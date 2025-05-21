/**
 * Integration Test for Contract Analyzers
 * 
 * This test verifies that the analyzers work properly together through 
 * the ContractAnalyzerService, which handles fallback and orchestration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContractAnalyzerService } from '../ContractAnalyzerService';
import { AIContractAnalyzer } from '../AIContractAnalyzer';
import { RuleBasedContractAnalyzer } from '../RuleBasedContractAnalyzer';

// Mock dependencies
vi.mock('../../../../server/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
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

// Mock database operations
vi.mock('../../../../shared/db', () => ({
  db: {
    insert: vi.fn().mockResolvedValue([{ id: 'test-analysis-id' }]),
    select: vi.fn().mockResolvedValue([{
      id: 'test-analysis-id',
      status: 'COMPLETED',
      document_id: 'test-doc-id',
      vendor: 'Acme Corp',
      contract_title: 'Service Agreement',
      doc_type: 'SERVICE_AGREEMENT',
      effective_date: '2025-01-01',
      termination_date: '2026-01-01',
      confidence: JSON.stringify({
        vendor: 0.8,
        contractTitle: 0.7,
        docType: 0.7,
        effectiveDate: 0.6,
        terminationDate: 0.6
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]),
    update: vi.fn().mockResolvedValue([{ id: 'test-analysis-id' }])
  }
}));

// Environment mocks
vi.mock('../../../../server/env', () => ({
  env: {
    OPENAI_API_KEY: undefined, // Simulate missing API key to test fallback
    AI_ENABLED: 'true',
    NODE_ENV: 'test'
  }
}));

describe('Contract Analyzer Integration Tests', () => {
  let service: ContractAnalyzerService;
  
  beforeEach(() => {
    service = new ContractAnalyzerService();
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should fallback to rule-based analyzer when AI is not available', async () => {
    // Mock dependencies to ensure AI analyzer isn't available
    vi.spyOn(service as any, 'primaryAnalyzer').get(() => {
      const ai = new AIContractAnalyzer();
      ai.isAvailable = vi.fn().mockReturnValue(false);
      return ai;
    });
    
    // Spy on the fallback analyzer
    const ruleBasedSpy = vi.spyOn((service as any).fallbackAnalyzer, 'analyzeContract');
    
    // Test the contract analysis
    const result = await service.analyzeContract('test-doc-id', 'test-user', 'test-tenant');
    
    // Verify fallback was used
    expect(ruleBasedSpy).toHaveBeenCalledWith('test-doc-id', 'test-user', 'test-tenant');
    expect(result.status).toBe('COMPLETED');
    expect(result.documentId).toBe('test-doc-id');
  });
  
  it('should get analysis status correctly', async () => {
    const status = await service.getAnalysisStatus('test-analysis-id');
    
    expect(status).toBeDefined();
    expect(status.id).toBe('test-analysis-id');
    expect(status.vendor).toBe('Acme Corp');
    expect(status.contractTitle).toBe('Service Agreement');
  });
  
  it('should handle errors gracefully', async () => {
    // Make both analyzers fail
    vi.spyOn(service as any, 'primaryAnalyzer').get(() => {
      const ai = new AIContractAnalyzer();
      ai.isAvailable = vi.fn().mockReturnValue(true);
      ai.analyzeContract = vi.fn().mockRejectedValue(new Error('AI failed'));
      return ai;
    });
    
    vi.spyOn(service as any, 'fallbackAnalyzer').get(() => {
      const rule = new RuleBasedContractAnalyzer();
      rule.analyzeContract = vi.fn().mockRejectedValue(new Error('Rule-based failed'));
      return rule;
    });
    
    const result = await service.analyzeContract('test-doc-id', 'test-user', 'test-tenant');
    
    // Verify error handling
    expect(result.status).toBe('FAILED');
    expect(result.error).toBeDefined();
    expect(result.error).toContain('Analysis failed with both analyzers');
  });
});