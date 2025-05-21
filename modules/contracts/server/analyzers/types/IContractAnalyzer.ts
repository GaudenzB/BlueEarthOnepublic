/**
 * Contract Analyzer Interface
 * 
 * This interface defines the contract for all analyzer implementations,
 * allowing for different strategies with a consistent API.
 */

import { AnalysisResult } from './AnalysisResult';

export interface IContractAnalyzer {
  /**
   * Check if this analyzer is available for use
   * Used for determining fallback strategies
   */
  isAvailable(): boolean;
  
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