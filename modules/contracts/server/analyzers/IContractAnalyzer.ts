/**
 * Contract Analyzer Interface
 * 
 * This interface defines the contract for all contract analyzers,
 * allowing for different implementations with a consistent API.
 */

export interface AnalysisResult {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  documentId: string;
  filename?: string;
  title?: string;
  error?: string;
  vendor?: string | null;
  contractTitle?: string | null;
  docType?: string | null;
  effectiveDate?: string | null;
  terminationDate?: string | null;
  confidence?: Record<string, number> | null;
}

export interface IContractAnalyzer {
  /**
   * Analyze a contract document and extract key information
   * @param documentId Document ID to analyze
   * @param userId User who initiated the analysis 
   * @param tenantId Tenant context
   * @returns Analysis result with ID for tracking status
   */
  analyzeContract(documentId: string, userId: string, tenantId: string): Promise<AnalysisResult>;
  
  /**
   * Get the status and results of an ongoing or completed analysis
   * @param analysisId The ID of the analysis to check
   * @returns Current analysis status and any extracted data
   */
  getAnalysisStatus(analysisId: string): Promise<AnalysisResult>;
}