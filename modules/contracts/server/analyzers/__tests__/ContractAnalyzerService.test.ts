import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContractAnalyzerService } from '../ContractAnalyzerService';
import { AIContractAnalyzer } from '../AIContractAnalyzer';
import { RuleBasedContractAnalyzer } from '../RuleBasedContractAnalyzer';
import { AnalysisResult } from '../IContractAnalyzer';

// Mock dependencies
vi.mock('../AIContractAnalyzer');
vi.mock('../RuleBasedContractAnalyzer');

// Test data
const testDocumentId = '12345678-1234-1234-1234-123456789012';
const testUserId = 'user-123';
const testTenantId = 'tenant-456';
const testAnalysisId = '87654321-4321-4321-4321-210987654321';

// Sample successful analysis result
const successfulAnalysisResult: AnalysisResult = {
  id: testAnalysisId,
  status: 'COMPLETED',
  documentId: testDocumentId,
  vendor: 'Acme Corp',
  contractTitle: 'Service Agreement',
  docType: 'SERVICE',
  effectiveDate: '2025-01-01',
  terminationDate: '2026-01-01',
  confidence: {
    vendor: 0.9,
    contractTitle: 0.85,
    docType: 0.8,
    effectiveDate: 0.75,
    terminationDate: 0.7
  }
};

// Sample failure analysis result
const failureAnalysisResult: AnalysisResult = {
  id: 'error',
  status: 'FAILED',
  documentId: testDocumentId,
  error: 'Analysis failed'
};

describe('ContractAnalyzerService', () => {
  let service: ContractAnalyzerService;
  let mockAIAnalyzer: AIContractAnalyzer;
  let mockRuleBasedAnalyzer: RuleBasedContractAnalyzer;
  
  beforeEach(() => {
    // Reset and setup mocks
    vi.resetAllMocks();
    
    // Mock AI analyzer
    mockAIAnalyzer = new AIContractAnalyzer();
    mockAIAnalyzer.isAvailable = vi.fn().mockReturnValue(true);
    mockAIAnalyzer.analyzeContract = vi.fn().mockResolvedValue(successfulAnalysisResult);
    mockAIAnalyzer.getAnalysisStatus = vi.fn().mockResolvedValue(successfulAnalysisResult);
    
    // Mock rule-based analyzer
    mockRuleBasedAnalyzer = new RuleBasedContractAnalyzer();
    mockRuleBasedAnalyzer.analyzeContract = vi.fn().mockResolvedValue(successfulAnalysisResult);
    mockRuleBasedAnalyzer.getAnalysisStatus = vi.fn().mockResolvedValue(successfulAnalysisResult);
    
    // Setup ContractAnalyzerService with mocked dependencies
    service = new ContractAnalyzerService();
    
    // Override the private properties with our mocks
    (service as any).primaryAnalyzer = mockAIAnalyzer;
    (service as any).fallbackAnalyzer = mockRuleBasedAnalyzer;
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('analyzeContract', () => {
    it('should use the AI analyzer when available', async () => {
      const result = await service.analyzeContract(testDocumentId, testUserId, testTenantId);
      
      expect(mockAIAnalyzer.isAvailable).toHaveBeenCalled();
      expect(mockAIAnalyzer.analyzeContract).toHaveBeenCalledWith(testDocumentId, testUserId, testTenantId);
      expect(mockRuleBasedAnalyzer.analyzeContract).not.toHaveBeenCalled();
      expect(result).toEqual(successfulAnalysisResult);
    });
    
    it('should use the rule-based analyzer when AI is not available', async () => {
      // Set AI analyzer to be unavailable
      mockAIAnalyzer.isAvailable = vi.fn().mockReturnValue(false);
      
      const result = await service.analyzeContract(testDocumentId, testUserId, testTenantId);
      
      expect(mockAIAnalyzer.isAvailable).toHaveBeenCalled();
      expect(mockAIAnalyzer.analyzeContract).not.toHaveBeenCalled();
      expect(mockRuleBasedAnalyzer.analyzeContract).toHaveBeenCalledWith(testDocumentId, testUserId, testTenantId);
      expect(result).toEqual(successfulAnalysisResult);
    });
    
    it('should fallback to rule-based analyzer when AI analyzer throws an error', async () => {
      // Make AI analyzer throw an error
      mockAIAnalyzer.analyzeContract = vi.fn().mockRejectedValue(new Error('AI analysis failed'));
      
      const result = await service.analyzeContract(testDocumentId, testUserId, testTenantId);
      
      expect(mockAIAnalyzer.isAvailable).toHaveBeenCalled();
      expect(mockAIAnalyzer.analyzeContract).toHaveBeenCalledWith(testDocumentId, testUserId, testTenantId);
      expect(mockRuleBasedAnalyzer.analyzeContract).toHaveBeenCalledWith(testDocumentId, testUserId, testTenantId);
      expect(result).toEqual(successfulAnalysisResult);
    });
    
    it('should return a failure result when both analyzers fail', async () => {
      // Make both analyzers fail
      mockAIAnalyzer.analyzeContract = vi.fn().mockRejectedValue(new Error('AI analysis failed'));
      mockRuleBasedAnalyzer.analyzeContract = vi.fn().mockRejectedValue(new Error('Rule-based analysis failed'));
      
      const result = await service.analyzeContract(testDocumentId, testUserId, testTenantId);
      
      expect(mockAIAnalyzer.isAvailable).toHaveBeenCalled();
      expect(mockAIAnalyzer.analyzeContract).toHaveBeenCalledWith(testDocumentId, testUserId, testTenantId);
      expect(mockRuleBasedAnalyzer.analyzeContract).toHaveBeenCalledWith(testDocumentId, testUserId, testTenantId);
      expect(result.status).toBe('FAILED');
      expect(result.error).toContain('Analysis failed with both analyzers');
    });
  });
  
  describe('getAnalysisStatus', () => {
    it('should successfully get analysis status', async () => {
      const result = await service.getAnalysisStatus(testAnalysisId);
      
      expect(mockAIAnalyzer.getAnalysisStatus).toHaveBeenCalledWith(testAnalysisId);
      expect(result).toEqual(successfulAnalysisResult);
    });
    
    it('should throw an error when getAnalysisStatus fails', async () => {
      mockAIAnalyzer.getAnalysisStatus = vi.fn().mockRejectedValue(new Error('Failed to get status'));
      
      await expect(service.getAnalysisStatus(testAnalysisId)).rejects.toThrow('Failed to get status');
    });
  });
});