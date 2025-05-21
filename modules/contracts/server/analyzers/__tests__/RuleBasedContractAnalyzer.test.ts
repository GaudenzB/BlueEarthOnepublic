import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RuleBasedContractAnalyzer } from '../RuleBasedContractAnalyzer';
import { AnalysisResult } from '../IContractAnalyzer';

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
        vendor: 0.7,
        contractTitle: 0.7,
        docType: 0.7,
        effectiveDate: 0.7,
        terminationDate: 0.7
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

describe('RuleBasedContractAnalyzer', () => {
  let analyzer: RuleBasedContractAnalyzer;
  const testDocumentId = 'test-document-id';
  const testUserId = 'test-user-id';
  const testTenantId = 'test-tenant-id';
  
  beforeEach(() => {
    analyzer = new RuleBasedContractAnalyzer();
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('analyzeContract', () => {
    it('should create an analysis record and process the document', async () => {
      const result = await analyzer.analyzeContract(testDocumentId, testUserId, testTenantId);
      
      // Check if analysis record was created
      expect(result).toBeDefined();
      expect(result.id).toBe('mock-analysis-id');
      expect(result.status).toBe('COMPLETED');
      expect(result.documentId).toBe(testDocumentId);
    });
    
    it('should handle errors during document processing', async () => {
      // Mock document service to throw an error
      const getDocumentContentMock = require('../../../../modules/documents/server/services/documentService').getDocumentContent;
      getDocumentContentMock.mockRejectedValueOnce(new Error('Document not found'));
      
      const result = await analyzer.analyzeContract(testDocumentId, testUserId, testTenantId);
      
      expect(result.status).toBe('FAILED');
      expect(result.error).toContain('Document not found');
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
  
  describe('extractContractInformation', () => {
    it('should extract contract metadata from document text', async () => {
      // Access the private method using type assertion
      const extractMethod = (analyzer as any).extractContractInformation;
      
      const docText = `
        SERVICE AGREEMENT
        
        This agreement is made on January 1, 2025 between Acme Corp ("Vendor") and BlueSky Inc ("Client").
        
        Term: This agreement shall commence on January 1, 2025 and shall continue until January 1, 2026.
        
        Services: Vendor shall provide consulting services to Client as described in Exhibit A.
      `;
      
      const result = extractMethod(docText);
      
      expect(result).toBeDefined();
      expect(result.vendor).toBe('Acme Corp');
      expect(result.contractTitle).toBe('SERVICE AGREEMENT');
      expect(result.docType).toBe('SERVICE');
      expect(result.effectiveDate).toBeDefined();
      expect(result.terminationDate).toBeDefined();
      expect(result.confidence.vendor).toBeGreaterThan(0);
      expect(result.confidence.contractTitle).toBeGreaterThan(0);
    });
    
    it('should handle documents with missing information', async () => {
      // Access the private method using type assertion
      const extractMethod = (analyzer as any).extractContractInformation;
      
      const docText = `
        This is a document with minimal contract information.
      `;
      
      const result = extractMethod(docText);
      
      expect(result).toBeDefined();
      expect(result.confidence.vendor).toBeLessThan(0.5);
      expect(result.confidence.contractTitle).toBeLessThan(0.5);
    });
  });
});