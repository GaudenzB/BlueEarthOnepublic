import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIContractAnalyzer } from '../AIContractAnalyzer';
import { AnalysisResult } from '../IContractAnalyzer';

// Mock OpenAI API
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    vendor: 'Acme Corp',
                    contractTitle: 'Service Agreement',
                    docType: 'SERVICE',
                    effectiveDate: '2025-01-01',
                    terminationDate: '2026-01-01',
                    confidence: {
                      vendor: 0.95,
                      contractTitle: 0.92,
                      docType: 0.90,
                      effectiveDate: 0.85,
                      terminationDate: 0.83
                    }
                  })
                }
              }
            ]
          })
        }
      }
    }))
  };
});

// Mock dependencies
vi.mock('../../../../server/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

// Mock database operations
vi.mock('../../../../shared/db', () => ({
  db: {
    insert: vi.fn().mockResolvedValue([{ id: 'mock-analysis-id' }]),
    select: vi.fn().mockResolvedValue([{
      id: 'mock-analysis-id',
      status: 'COMPLETED',
      document_id: 'test-document-id',
      vendor: 'Acme Corp',
      contract_title: 'Service Agreement',
      doc_type: 'SERVICE',
      effective_date: '2025-01-01',
      termination_date: '2026-01-01',
      confidence: JSON.stringify({
        vendor: 0.95,
        contractTitle: 0.92,
        docType: 0.90,
        effectiveDate: 0.85,
        terminationDate: 0.83
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]),
    update: vi.fn().mockResolvedValue([{ id: 'mock-analysis-id' }])
  }
}));

// Mock document retrieval
vi.mock('../../../../modules/documents/server/services/documentService', () => ({
  getDocumentContent: vi.fn().mockResolvedValue(`
    SERVICE AGREEMENT
    
    This agreement is made on January 1, 2025 between Acme Corp ("Vendor") and BlueSky Inc ("Client").
    
    Term: This agreement shall commence on January 1, 2025 and shall continue until January 1, 2026.
    
    Services: Vendor shall provide consulting services to Client as described in Exhibit A.
  `)
}));

// Mock environment variables
vi.mock('../../../../server/env', () => ({
  env: {
    OPENAI_API_KEY: 'mock-api-key',
    AI_ENABLED: 'true',
    NODE_ENV: 'test'
  }
}));

describe('AIContractAnalyzer', () => {
  let analyzer: AIContractAnalyzer;
  const testDocumentId = 'test-document-id';
  const testUserId = 'test-user-id';
  const testTenantId = 'test-tenant-id';
  
  beforeEach(() => {
    analyzer = new AIContractAnalyzer();
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('isAvailable', () => {
    it('should return true when API key is available and AI is enabled', () => {
      expect(analyzer.isAvailable()).toBe(true);
    });
    
    it('should return false when API key is missing', () => {
      // Mock environment without API key
      vi.spyOn(require('../../../../server/env'), 'env', 'get').mockReturnValue({
        AI_ENABLED: 'true',
        NODE_ENV: 'test'
      });
      
      expect(analyzer.isAvailable()).toBe(false);
    });
    
    it('should return false when AI is disabled', () => {
      // Mock environment with AI disabled
      vi.spyOn(require('../../../../server/env'), 'env', 'get').mockReturnValue({
        OPENAI_API_KEY: 'mock-api-key',
        AI_ENABLED: 'false',
        NODE_ENV: 'test'
      });
      
      expect(analyzer.isAvailable()).toBe(false);
    });
  });
  
  describe('analyzeContract', () => {
    it('should create an analysis record and process the document with AI', async () => {
      const result = await analyzer.analyzeContract(testDocumentId, testUserId, testTenantId);
      
      // Check if analysis record was created
      expect(result).toBeDefined();
      expect(result.id).toBe('mock-analysis-id');
      expect(result.status).toBe('COMPLETED');
      expect(result.documentId).toBe(testDocumentId);
      
      // Verify OpenAI was called
      const openai = require('openai').default;
      expect(openai).toHaveBeenCalledTimes(1);
    });
    
    it('should handle errors during AI processing', async () => {
      // Mock OpenAI to throw an error
      const openaiMock = require('openai').default;
      openaiMock.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: vi.fn().mockRejectedValueOnce(new Error('API error'))
          }
        }
      }));
      
      const result = await analyzer.analyzeContract(testDocumentId, testUserId, testTenantId);
      
      expect(result.status).toBe('FAILED');
      expect(result.error).toContain('API error');
    });
    
    it('should handle malformed AI responses', async () => {
      // Mock OpenAI to return invalid JSON
      const openaiMock = require('openai').default;
      openaiMock.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValueOnce({
              choices: [
                {
                  message: {
                    content: 'Not a valid JSON response'
                  }
                }
              ]
            })
          }
        }
      }));
      
      const result = await analyzer.analyzeContract(testDocumentId, testUserId, testTenantId);
      
      expect(result.status).toBe('FAILED');
      expect(result.error).toContain('Failed to parse AI response');
    });
  });
  
  describe('getAnalysisStatus', () => {
    it('should return the analysis status', async () => {
      const result = await analyzer.getAnalysisStatus('mock-analysis-id');
      
      expect(result).toBeDefined();
      expect(result.id).toBe('mock-analysis-id');
      expect(result.status).toBe('COMPLETED');
      expect(result.vendor).toBe('Acme Corp');
      expect(result.contractTitle).toBe('Service Agreement');
      expect(result.docType).toBe('SERVICE');
      expect(result.effectiveDate).toBe('2025-01-01');
      expect(result.terminationDate).toBe('2026-01-01');
    });
    
    it('should throw an error when analysis is not found', async () => {
      // Mock the database to return an empty array
      const dbSelectMock = require('../../../../shared/db').db.select;
      dbSelectMock.mockResolvedValueOnce([]);
      
      await expect(analyzer.getAnalysisStatus('non-existent-id')).rejects.toThrow('Analysis record not found');
    });
  });
});