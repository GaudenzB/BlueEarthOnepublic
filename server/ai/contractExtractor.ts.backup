import { logger } from '../utils/logger';
import OpenAI from 'openai';
import { ContractExtraction } from '../../modules/contracts/server/contractProcessor';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });

// Using GPT-4o for contract extraction
const CONTRACT_MODEL = "gpt-4o";

/**
 * Specialized prompt for contract data extraction
 * 
 * Designed to extract key information from contract documents
 * using a structured approach with Azure Document Intelligence layout information
 */
const CONTRACT_SYSTEM_PROMPT = `
You are an expert legal AI assistant specialized in contract analysis for investment firms.
Your task is to extract key contract information from document text, focusing on:

1. Parties involved, their roles and contact information
2. Key dates (effective, execution, expiry, renewal)
3. Financial terms and obligations
4. Important clauses and their locations in the document
5. Contractual obligations with deadlines

Follow these guidelines:
- Extract information with high precision; only include what is explicitly stated
- For each extracted field, include a confidence score (0-1)
- Format the response as a structured JSON object
- Include page references and coordinates when available
- Identify all obligations with due dates, responsible parties, and descriptions
- For limited partnership agreements (LPAs), pay special attention to reporting and payment obligations

Maintain absolute confidentiality of all document content.
`;

/**
 * Extract contract-specific data from document text
 * 
 * @param documentText The extracted document text content
 * @param documentTitle The document title or filename
 * @param layoutData Optional Azure Document Intelligence layout data
 * @returns Structured contract extraction result
 */
export async function extractContractData(
  documentText: string,
  documentTitle: string,
  layoutData?: any
): Promise<ContractExtraction> {
  try {
    logger.info('Starting contract data extraction', { documentTitle });
    
    if (!process.env['OPENAI_API_KEY']) {
      logger.error('OPENAI_API_KEY is not configured');
      throw new Error('OpenAI API key not configured');
    }
    
    // Determine likely contract type from title or content
    const contractType = determineContractType(documentTitle, documentText);
    logger.info('Detected contract type', { contractType, documentTitle });
    
    // Prepare specialized extraction prompt based on contract type
    const userPrompt = prepareContractPrompt(documentText, documentTitle, contractType, layoutData);
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: CONTRACT_MODEL,
      messages: [
        { role: "system", content: CONTRACT_SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // Low temperature for consistency in extraction
    });
    
    // Parse and validate response
    const content = response.choices[0]?.message?.content || '{}';
    let extractionResult: any;
    
    try {
      extractionResult = JSON.parse(content);
    } catch (parseError) {
      logger.error('Failed to parse contract extraction response as JSON', { 
        error: parseError, 
        responseContent: content.substring(0, 200) + '...' 
      });
      throw new Error('Invalid JSON response from AI service');
    }
    
    // Format and return the extraction result
    const formattedResult = formatContractExtraction(extractionResult, contractType);
    
    logger.info('Contract extraction completed successfully', {
      documentTitle,
      parties: formattedResult.parties.length,
      obligations: formattedResult.obligations.length,
      clauses: formattedResult.clauses.length,
      confidence: formattedResult.metadata.confidenceScore
    });
    
    return formattedResult;
  } catch (error: any) {
    logger.error('Error in contract data extraction', { 
      error: error.message, 
      documentTitle 
    });
    
    // Return a minimal extraction result on error
    return {
      parties: [],
      keyDates: [],
      financialTerms: [],
      clauses: [],
      obligations: [],
      metadata: {
        contractType: 'OTHER',
        confidenceScore: 0,
        processingTime: 0,
        sourceReferences: {}
      }
    };
  }
}

/**
 * Determine the type of contract from title and content
 */
function determineContractType(title: string, content: string): string {
  // Normalize inputs for case-insensitive matching
  const normalizedTitle = title.toUpperCase();
  const normalizedContent = content.substring(0, 5000).toUpperCase(); // Check beginning of content
  
  // Check for LPA indicators
  if (
    normalizedTitle.includes('LIMITED PARTNERSHIP') || 
    normalizedTitle.includes('LPA') ||
    normalizedContent.includes('LIMITED PARTNERSHIP AGREEMENT') ||
    (normalizedContent.includes('LIMITED PARTNERSHIP') && normalizedContent.includes('AGREEMENT'))
  ) {
    return 'LPA';
  }
  
  // Check for subscription agreement indicators
  if (
    normalizedTitle.includes('SUBSCRIPTION') || 
    normalizedContent.includes('SUBSCRIPTION AGREEMENT') ||
    (normalizedContent.includes('SUBSCRIBE') && normalizedContent.includes('SHARES'))
  ) {
    return 'SUBSCRIPTION_AGREEMENT';
  }
  
  // Check for side letter indicators
  if (
    normalizedTitle.includes('SIDE LETTER') || 
    normalizedContent.includes('SIDE LETTER')
  ) {
    return 'SIDE_LETTER';
  }
  
  // Check for amendment indicators
  if (
    normalizedTitle.includes('AMENDMENT') || 
    normalizedTitle.includes('ADDENDUM') ||
    normalizedContent.includes('HEREBY AMENDS') ||
    normalizedContent.includes('AMENDMENT TO')
  ) {
    return 'AMENDMENT';
  }
  
  // Check for NDA indicators
  if (
    normalizedTitle.includes('NON-DISCLOSURE') || 
    normalizedTitle.includes('NDA') ||
    normalizedTitle.includes('CONFIDENTIALITY') ||
    normalizedContent.includes('NON-DISCLOSURE AGREEMENT') ||
    normalizedContent.includes('CONFIDENTIALITY AGREEMENT')
  ) {
    return 'NDA';
  }
  
  // Check for service agreement indicators
  if (
    normalizedTitle.includes('SERVICE AGREEMENT') || 
    normalizedTitle.includes('CONSULTING') ||
    normalizedContent.includes('SERVICE AGREEMENT') ||
    normalizedContent.includes('SERVICES TO BE PROVIDED')
  ) {
    return 'SERVICE_AGREEMENT';
  }
  
  // Default to OTHER if no specific type is identified
  return 'OTHER';
}

/**
 * Prepare contract-specific extraction prompt
 */
function prepareContractPrompt(
  text: string, 
  title: string, 
  contractType: string,
  layoutData?: any
): string {
  // Truncate text if too long
  const maxLength = 15000;
  let truncatedText = text;
  
  if (text.length > maxLength) {
    const firstPart = text.substring(0, maxLength * 0.7); // 70% from beginning
    const lastPart = text.substring(text.length - (maxLength * 0.3)); // 30% from end
    truncatedText = `${firstPart}\n\n[... Content truncated due to length ...]\n\n${lastPart}`;
  }
  
  // Base prompt structure
  let prompt = `
    Please extract contract data from the following document.
    
    DOCUMENT TITLE: ${title}
    DETECTED CONTRACT TYPE: ${contractType}
    
    DOCUMENT CONTENT:
    ${truncatedText}
    
    Extract the following information in JSON format:
    1. Parties to the contract (names, roles, addresses, contact details)
    2. Key dates (effective date, execution date, expiry date, renewal date)
    3. Financial terms (amounts, currencies, payment schedules)
    4. Important clauses (title, section number, content, page reference)
    5. Contractual obligations (description, deadline, responsible party)
    
    For each extraction, include a confidence score (0-1).
    Format the response as a valid JSON object.
  `;
  
  // Add contract-type specific instructions
  switch(contractType) {
    case 'LPA': // Fall through
      prompt += `
        For this Limited Partnership Agreement, pay special attention to:
        - General Partner and Limited Partner details
        - Management fee calculations and payment schedules
        - Reporting obligations and deadlines
        - Distribution waterfall provisions
        - Key-person clauses and termination conditions
      `;
      break;
      
    case 'SUBSCRIPTION_AGREEMENT': // Fall through
      prompt += `
        For this Subscription Agreement, pay special attention to:
        - Investor details and commitment amount
        - Payment schedule and drawdown provisions
        - Representations and warranties
        - Anti-money laundering provisions
      `;
      break;
      
    case 'SIDE_LETTER': // Fall through
      prompt += `
        For this Side Letter, pay special attention to:
        - Special terms or exemptions granted
        - Modified fee arrangements
        - Reporting requirements
        - Any terms that override the main agreement
      `;
      break;
  }
  
  // Add layout data if available
  if (layoutData) {
    prompt += `
      DOCUMENT LAYOUT INFORMATION:
      ${JSON.stringify(layoutData)}
      
      When extracting information, use the layout data to provide accurate page references and coordinates.
    `;
  }
  
  return prompt;
}

/**
 * Format the extraction result to match the expected structure
 */
function formatContractExtraction(extractionResult: any, contractType: string): ContractExtraction {
  // Initialize with default structure
  const defaultExtraction: ContractExtraction = {
    parties: [],
    keyDates: [],
    financialTerms: [],
    clauses: [],
    obligations: [],
    metadata: {
      contractType: contractType,
      confidenceScore: extractionResult.confidence || 0.5,
      sourceReferences: {}
    }
  };
  
  try {
    // Map parties
    if (Array.isArray(extractionResult.parties)) {
      defaultExtraction.parties = extractionResult.parties.map((party: any) => ({
        name: party.name || 'Unknown Party',
        role: party.role || 'party',
        address: party.address,
        contact: party.contact || party.email
      }));
    }
    
    // Map dates
    if (Array.isArray(extractionResult.dates) || Array.isArray(extractionResult.keyDates)) {
      const datesArray = extractionResult.dates || extractionResult.keyDates || [];
      defaultExtraction.keyDates = datesArray.map((date: any) => ({
        type: date.type || 'OTHER',
        date: date.date || date.value,
        description: date.description,
        sourceClause: date.sourceClause || date.clause
      }));
    }
    
    // Map financial terms
    if (Array.isArray(extractionResult.financialTerms) || Array.isArray(extractionResult.financial)) {
      const financialArray = extractionResult.financialTerms || extractionResult.financial || [];
      defaultExtraction.financialTerms = financialArray.map((term: any) => ({
        type: term.type || 'OTHER',
        value: term.value || term.amount,
        currency: term.currency,
        description: term.description
      }));
    }
    
    // Map clauses
    if (Array.isArray(extractionResult.clauses)) {
      defaultExtraction.clauses = extractionResult.clauses.map((clause: any) => ({
        title: clause.title || 'Untitled Clause',
        sectionNumber: clause.sectionNumber || clause.section,
        content: clause.content || clause.text,
        pageNumber: clause.pageNumber || clause.page,
        pageCoordinates: clause.pageCoordinates || clause.coordinates,
        confidenceScore: clause.confidenceScore || clause.confidence || 0.7
      }));
    }
    
    // Map obligations
    if (Array.isArray(extractionResult.obligations)) {
      defaultExtraction.obligations = extractionResult.obligations.map((obligation: any) => ({
        title: obligation.title || 'Untitled Obligation',
        description: obligation.description || obligation.text,
        type: obligation.type || 'OTHER',
        dueDate: obligation.dueDate || obligation.date,
        recurringPattern: obligation.recurringPattern || obligation.pattern,
        responsibleParty: obligation.responsibleParty || obligation.party,
        sourceClauseIndex: obligation.sourceClauseIndex,
        confidenceScore: obligation.confidenceScore || obligation.confidence || 0.6
      }));
    }
    
    // Extract source references
    if (extractionResult.sourceReferences) {
      defaultExtraction.metadata.sourceReferences = extractionResult.sourceReferences;
    }
    
    // Set contract number if available
    if (extractionResult.contractNumber) {
      defaultExtraction.metadata.contractNumber = extractionResult.contractNumber;
    }
    
    return defaultExtraction;
  } catch (error) {
    logger.error('Error formatting contract extraction', { error });
    return defaultExtraction;
  }
}