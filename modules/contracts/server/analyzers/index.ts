/**
 * Contract Analyzers Export
 * 
 * This file exports the contract analyzer interface and implementations
 * for easy importing throughout the application.
 */

export { IContractAnalyzer, AnalysisResult } from './IContractAnalyzer';
export { AIContractAnalyzer } from './AIContractAnalyzer';
export { RuleBasedContractAnalyzer } from './RuleBasedContractAnalyzer';
export { ContractAnalyzerService } from './ContractAnalyzerService';

// Create and export a singleton instance of the ContractAnalyzerService for use throughout the app
import { ContractAnalyzerService } from './ContractAnalyzerService';

export const contractAnalyzerService = new ContractAnalyzerService();