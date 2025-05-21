/**
 * Contract Analyzer Service
 * 
 * This service acts as a facade for all contract analyzers,
 * and implements a fallback strategy between analyzers.
 */

import { IContractAnalyzer } from './types/IContractAnalyzer';
import { AnalysisResult } from './types/AnalysisResult';
import { AIContractAnalyzer } from './implementations/AIContractAnalyzer';
import { RuleBasedContractAnalyzer } from './implementations/RuleBasedContractAnalyzer';
import { logger } from '../../../../server/utils/logger';

/**
 * Service that orchestrates different analyzers with fallback strategy
 */
export class ContractAnalyzerService implements IContractAnalyzer {
  private primaryAnalyzer: IContractAnalyzer;
  private fallbackAnalyzer: IContractAnalyzer;
  
  constructor() {
    this.primaryAnalyzer = new AIContractAnalyzer();
    this.fallbackAnalyzer = new RuleBasedContractAnalyzer();
    logger.info('Contract Analyzer Service initialized with primary and fallback analyzers');
  }
  
  /**
   * Check if this analyzer is available
   * A composite analyzer is available if any of its components are available
   */
  public isAvailable(): boolean {
    return this.primaryAnalyzer.isAvailable() || this.fallbackAnalyzer.isAvailable();
  }
  
  /**
   * Analyze a contract document with fallback strategy
   * 
   * This method will:
   * 1. Try to use the AI analyzer if available
   * 2. If AI analyzer is not available or fails, fall back to rule-based analyzer
   * 3. If both fail, return a structured error
   */
  public async analyzeContract(documentId: string, userId: string, tenantId: string): Promise<AnalysisResult> {
    let result: AnalysisResult;
    let usedFallback = false;
    
    try {
      // Try primary analyzer (AI-based) first
      if (this.primaryAnalyzer.isAvailable()) {
        try {
          logger.info(`Using primary analyzer (AI) for document ${documentId}`);
          result = await this.primaryAnalyzer.analyzeContract(documentId, userId, tenantId);
          return result;
        } catch (primaryError) {
          logger.warn(`Primary analyzer failed for document ${documentId}, falling back to rule-based:`, primaryError);
          usedFallback = true;
        }
      } else {
        logger.info(`Primary analyzer not available for document ${documentId}, using fallback`);
        usedFallback = true;
      }
      
      // If primary analyzer failed or is not available, use fallback (rule-based)
      if (usedFallback) {
        try {
          logger.info(`Using fallback analyzer (rule-based) for document ${documentId}`);
          result = await this.fallbackAnalyzer.analyzeContract(documentId, userId, tenantId);
          return result;
        } catch (fallbackError) {
          logger.error(`Fallback analyzer also failed for document ${documentId}:`, fallbackError);
          
          // Both analyzers failed, return error
          return {
            id: 'error',
            status: 'FAILED',
            documentId: documentId,
            error: `Analysis failed with both analyzers: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`
          };
        }
      }
      
      // This should never happen as we either return from primary or fallback
      logger.error(`Unexpected flow in contract analysis for document ${documentId}`);
      return {
        id: 'error',
        status: 'FAILED',
        documentId: documentId,
        error: 'Unexpected analyzer flow'
      };
    } catch (error) {
      // Catch any other unexpected errors
      logger.error(`Unexpected error in contract analysis for document ${documentId}:`, error);
      return {
        id: 'error',
        status: 'FAILED',
        documentId: documentId,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get the status of an analysis
   * 
   * This delegates to the primary analyzer for status checks since
   * analysis records are stored in a shared database table regardless
   * of which analyzer created them.
   */
  public async getAnalysisStatus(analysisId: string): Promise<AnalysisResult> {
    try {
      return await this.primaryAnalyzer.getAnalysisStatus(analysisId);
    } catch (error) {
      logger.error(`Error getting analysis status for ID ${analysisId}:`, error);
      throw error;
    }
  }
}