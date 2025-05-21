/**
 * Contract Analysis Result
 * 
 * This interface defines the structure of contract analysis results,
 * ensuring consistency across different analyzer implementations.
 */

export interface AnalysisResult {
  /** Unique identifier for the analysis */
  id: string;
  
  /** Current status of the analysis */
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  
  /** The document ID being analyzed */
  documentId: string;
  
  /** Original filename if available */
  filename?: string | undefined;
  
  /** Document title if available */
  title?: string | undefined;
  
  /** Error message if analysis failed */
  error?: string | undefined;
  
  /** Extracted vendor/counterparty name */
  vendor?: string | undefined;
  
  /** Extracted contract title */
  contractTitle?: string | undefined;
  
  /** Detected document type (SERVICE, NDA, etc.) */
  docType?: string | undefined;
  
  /** Extracted effective date (ISO format) */
  effectiveDate?: string | undefined;
  
  /** Extracted termination date (ISO format) */
  terminationDate?: string | undefined;
  
  /** Confidence scores for each extracted field */
  confidence?: Record<string, number> | undefined;
}