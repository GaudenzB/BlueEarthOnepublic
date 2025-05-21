/**
 * Contract Analyzer Module
 * 
 * This file serves as the main entry point for the contract analyzer module.
 * It exports all necessary types and implementations with a clean API.
 */

// Export types
export { AnalysisResult } from './types/AnalysisResult';
export { IContractAnalyzer } from './types/IContractAnalyzer';

// Export implementations (for direct use/testing if needed)
export { AIContractAnalyzer } from './implementations/AIContractAnalyzer';
export { RuleBasedContractAnalyzer } from './implementations/RuleBasedContractAnalyzer';

// Export the main service
export { ContractAnalyzerService } from './ContractAnalyzerService';

// Create and export a singleton instance for use across the application
import { ContractAnalyzerService } from './ContractAnalyzerService';

/**
 * Singleton instance of ContractAnalyzerService
 * Use this for most application code instead of creating new instances
 */
export const contractAnalyzerService = new ContractAnalyzerService();