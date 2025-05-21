/**
 * Contract Analyzer Service
 * 
 * This service combines the AI-powered and rule-based analyzers with a clear fallback strategy.
 * It will attempt to use the AI analyzer first, falling back to the rule-based analyzer if needed.
 */

import { IContractAnalyzer, AnalysisResult } from './IContractAnalyzer';
import { AIContractAnalyzer } from './AIContractAnalyzer';
import { RuleBasedContractAnalyzer } from './RuleBasedContractAnalyzer';
import { logger } from '../../../../server/utils/logger';

export class ContractAnalyzerService implements IContractAnalyzer {
  private primaryAnalyzer: AIContractAnalyzer;
  private fallbackAnalyzer: RuleBasedContractAnalyzer;

  constructor() {
    this.primaryAnalyzer = new AIContractAnalyzer();
    this.fallbackAnalyzer = new RuleBasedContractAnalyzer();
    
    logger.info('ContractAnalyzerService initialized', {
      aiAnalyzerAvailable: this.primaryAnalyzer.isAvailable()
    });
  }

  /**
   * Analyze a contract document, trying AI first and falling back to rule-based
   */
  public async analyzeContract(documentId: string, userId: string, tenantId: string): Promise<AnalysisResult> {
    try {
      // Try AI analyzer first if available
      if (this.primaryAnalyzer.isAvailable()) {
        logger.info(`Using AI analyzer for document ${documentId}`);
        return await this.primaryAnalyzer.analyzeContract(documentId, userId, tenantId);
      } else {
        // AI not available, use rule-based
        logger.info(`AI analyzer not available, using rule-based analyzer for document ${documentId}`);
        return await this.fallbackAnalyzer.analyzeContract(documentId, userId, tenantId);
      }
    } catch (error) {
      // Error with primary analyzer, try fallback
      logger.error(`Error with primary analyzer, falling back for document ${documentId}:`, error);
      
      try {
        return await this.fallbackAnalyzer.analyzeContract(documentId, userId, tenantId);
      } catch (fallbackError) {
        logger.error(`Fallback analyzer also failed for document ${documentId}:`, fallbackError);
        return {
          id: 'error',
          status: 'FAILED',
          documentId,
          error: `Analysis failed with both analyzers: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  }

  /**
   * Get analysis status, trying both analyzers
   */
  public async getAnalysisStatus(analysisId: string): Promise<AnalysisResult> {
    try {
      // Try getting status from either analyzer
      // Since both store in the same table, it doesn't matter which one we use
      return await this.primaryAnalyzer.getAnalysisStatus(analysisId);
    } catch (error) {
      logger.error(`Error getting analysis status for ${analysisId}:`, error);
      throw error;
    }
  }
}