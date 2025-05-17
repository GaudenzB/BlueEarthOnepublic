import { logger } from '../../../server/utils/logger';
import { contracts, contractClauses, contractObligations } from '../../../shared/schema';
import { sql } from 'drizzle-orm';
import { db } from '../../../server/db';
import { createEventEmitter } from '../../../server/utils/eventEmitter';

// Event emitter for contract processing events
interface ContractEvents {
  CONTRACT_PARSED: {
    contractId: string;
    documentId: string;
    tenantId: string;
    userId?: string;
  };
}

export const contractEvents = createEventEmitter<ContractEvents>();

/**
 * Contract metadata structure as extracted from AI
 */
export interface ContractExtraction {
  parties: {
    name: string;
    role: string;
    address?: string;
    contact?: string;
  }[];
  keyDates: {
    type: string;
    date: string; // ISO format
    description?: string;
    sourceClause?: string;
  }[];
  financialTerms: {
    type: string;
    value: string;
    currency?: string;
    description?: string;
  }[];
  clauses: {
    title: string;
    sectionNumber?: string;
    content: string;
    pageNumber?: number;
    pageCoordinates?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    confidenceScore: number;
  }[];
  obligations: {
    title: string;
    description: string;
    type: string;
    dueDate?: string; // ISO format
    recurringPattern?: string;
    responsibleParty?: string;
    sourceClauseIndex?: number;
    confidenceScore: number;
  }[];
  metadata: {
    contractType: string;
    contractNumber?: string;
    confidenceScore: number;
    processingTime?: number;
    sourceReferences: Record<string, {
      page: number;
      coordinates?: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }>;
  };
}

/**
 * Maps confidence score to ConfidenceLevel enum
 */
function mapConfidenceToLevel(score: number): 'HIGH' | 'MEDIUM' | 'LOW' | 'UNVERIFIED' {
  if (score >= 0.8) return 'HIGH';
  if (score >= 0.5) return 'MEDIUM';
  if (score > 0) return 'LOW';
  return 'UNVERIFIED';
}

/**
 * Maps AI-extracted obligation type to database enum
 */
function mapObligationType(type: string): 'REPORTING' | 'PAYMENT' | 'DISCLOSURE' | 'COMPLIANCE' | 'OPERATIONAL' | 'OTHER' {
  const normalizedType = type.toUpperCase().trim();
  
  if (normalizedType.includes('REPORT') || normalizedType.includes('NOTIFY')) 
    return 'REPORTING';
  
  if (normalizedType.includes('PAY') || normalizedType.includes('FEE') || normalizedType.includes('FINANCIAL'))
    return 'PAYMENT';
  
  if (normalizedType.includes('DISCLOS') || normalizedType.includes('INFORM'))
    return 'DISCLOSURE';
  
  if (normalizedType.includes('COMPLY') || normalizedType.includes('REGULAT') || normalizedType.includes('LAW'))
    return 'COMPLIANCE';
  
  if (normalizedType.includes('OPERAT') || normalizedType.includes('PERFORM') || normalizedType.includes('DELIVER'))
    return 'OPERATIONAL';
  
  return 'OTHER';
}

/**
 * Processes contract document AI extraction and creates contract records
 * 
 * @param documentId The ID of the processed document
 * @param tenantId The tenant ID
 * @param userId The user ID processing the document
 * @param aiAnalysis The AI analysis result from the document processor
 * @returns The ID of the created contract or null if processing failed
 */
export async function postProcessContract(
  documentId: string,
  tenantId: string,
  userId: string | undefined,
  aiAnalysis: any
): Promise<string | null> {
  try {
    logger.info('Starting contract post-processing', { documentId, tenantId });
    
    // Check for env flag to enable contract processing
    if (process.env['ENABLE_CONTRACT_AI'] !== 'true') {
      logger.info('Contract AI processing is disabled', { documentId });
      return null;
    }
    
    // Check if the document is already processed as a contract
    const existingContract = await db.query.contracts.findFirst({
      where: sql`${contracts.documentId} = ${documentId} AND ${contracts.tenantId} = ${tenantId}`
    });

    if (existingContract) {
      logger.info('Document already processed as contract', { documentId, contractId: existingContract.id });
      return existingContract.id;
    }
    
    // Extract contract-specific data from AI analysis
    // This requires the AI model to output specific fields we can use
    let contractData: ContractExtraction | null = null;
    
    try {
      // Check if the AI metadata contains contract-specific extraction
      if (aiAnalysis?.contractData) {
        // Direct contract data extraction is available
        contractData = aiAnalysis.contractData as ContractExtraction;
      } else {
        // Need to parse from general AI output
        contractData = await extractContractDataFromGeneral(aiAnalysis);
      }
      
      if (!contractData) {
        logger.warn('Failed to extract contract data from AI analysis', { documentId });
        return null;
      }
    } catch (extractionError) {
      logger.error('Error extracting contract data', { error: extractionError, documentId });
      return null;
    }
    
    // Create contract record with properly typed values
    const insertData = {
      documentId,
      tenantId,
      createdBy: userId,
      
      // Contract type mapping
      contractType: mapContractType(contractData.metadata.contractType) as any,
      contractStatus: 'DRAFT' as const,
      contractNumber: contractData.metadata.contractNumber,
      
      // Try to identify counterparty
      counterpartyName: findCounterpartyName(contractData.parties),
      counterpartyAddress: findCounterpartyAddress(contractData.parties),
      counterpartyContactEmail: findCounterpartyEmail(contractData.parties),
      
      // Extract key dates - convert Date objects to ISO strings for Drizzle
      effectiveDate: findDateByType(contractData.keyDates, 'EFFECTIVE') 
        ? new Date(findDateByType(contractData.keyDates, 'EFFECTIVE')!).toISOString().split('T')[0]
        : null,
      expiryDate: findDateByType(contractData.keyDates, 'EXPIRY')
        ? new Date(findDateByType(contractData.keyDates, 'EXPIRY')!).toISOString().split('T')[0]
        : null,
      executionDate: findDateByType(contractData.keyDates, 'EXECUTION')
        ? new Date(findDateByType(contractData.keyDates, 'EXECUTION')!).toISOString().split('T')[0]
        : null,
      renewalDate: findDateByType(contractData.keyDates, 'RENEWAL')
        ? new Date(findDateByType(contractData.keyDates, 'RENEWAL')!).toISOString().split('T')[0]
        : null,
      
      // Financial terms
      totalValue: findFinancialTermByType(contractData.financialTerms, 'TOTAL'),
      currency: findCurrency(contractData.financialTerms),
      
      // AI-related metadata
      confidenceLevel: mapConfidenceToLevel(contractData.metadata.confidenceScore) as any,
      rawExtraction: contractData as any,
      sourcePageReferences: contractData.metadata.sourceReferences as any,
    };
    
    const [contract] = await db.insert(contracts).values(insertData).returning();
    
    if (!contract) {
      logger.error('Failed to create contract record', { documentId });
      return null;
    }
    
    logger.info('Contract record created successfully', { 
      documentId, 
      contractId: contract.id,
      contractType: contract.contractType
    });
    
    // Process clauses in batches
    if (contractData.clauses?.length > 0) {
      try {
        // Batch insert clauses
        await processContractClauses(
          contract.id, 
          tenantId, 
          contractData.clauses
        );
        
        logger.info('Contract clauses processed', { 
          contractId: contract.id, 
          clauseCount: contractData.clauses.length 
        });
      } catch (clauseError) {
        logger.error('Error processing contract clauses', { 
          error: clauseError, 
          contractId: contract.id 
        });
      }
    }
    
    // Process obligations in batches
    if (contractData.obligations?.length > 0) {
      try {
        // Batch insert obligations
        await processContractObligations(
          contract.id, 
          tenantId, 
          userId || undefined, 
          contractData.obligations,
          contractData.clauses
        );
        
        logger.info('Contract obligations processed', { 
          contractId: contract.id, 
          obligationCount: contractData.obligations.length 
        });
      } catch (obligationError) {
        logger.error('Error processing contract obligations', { 
          error: obligationError, 
          contractId: contract.id 
        });
      }
    }
    
    // Emit contract processed event
    contractEvents.emit('CONTRACT_PARSED', { 
      contractId: contract.id,
      documentId,
      tenantId,
      userId
    });
    
    return contract.id;
  } catch (error) {
    logger.error('Error in contract post-processing', { error, documentId, tenantId });
    return null;
  }
}

/**
 * Processes the contract clauses
 */
async function processContractClauses(
  contractId: string,
  tenantId: string,
  clauses: ContractExtraction['clauses']
): Promise<void> {
  // Process in batches of 50 to avoid overloading the database
  const BATCH_SIZE = 50;
  const totalBatches = Math.ceil(clauses.length / BATCH_SIZE);
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batchStart = batchIndex * BATCH_SIZE;
    const batchEnd = Math.min((batchIndex + 1) * BATCH_SIZE, clauses.length);
    const clauseBatch = clauses.slice(batchStart, batchEnd);
    
    // Insert batch
    await db.insert(contractClauses).values(
      clauseBatch.map((clause, index) => ({
        contractId,
        tenantId,
        title: clause.title || `Clause ${index + 1}`,
        sectionNumber: clause.sectionNumber,
        content: clause.content,
        pageNumber: clause.pageNumber,
        pageCoordinates: clause.pageCoordinates as any,
        confidenceLevel: mapConfidenceToLevel(clause.confidenceScore) as any
      }))
    );
  }
}

/**
 * Processes the contract obligations
 */
async function processContractObligations(
  contractId: string,
  tenantId: string,
  userId: string | undefined,
  obligations: ContractExtraction['obligations'],
  clauses: ContractExtraction['clauses']
): Promise<void> {
  // Process in batches of 50 to avoid overloading the database
  const BATCH_SIZE = 50;
  const totalBatches = Math.ceil(obligations.length / BATCH_SIZE);
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batchStart = batchIndex * BATCH_SIZE;
    const batchEnd = Math.min((batchIndex + 1) * BATCH_SIZE, obligations.length);
    const obligationBatch = obligations.slice(batchStart, batchEnd);
    
    // Look up clause IDs for each obligation
    const clauseIds = await Promise.all(
      obligationBatch.map(async (obligation) => {
        if (obligation.sourceClauseIndex !== undefined && 
            clauses[obligation.sourceClauseIndex]) {
          // Find the clause by matching content
          const clauseContent = clauses[obligation.sourceClauseIndex].content;
          
          // Find clause ID based on content match
          const matchingClause = await db.query.contractClauses.findFirst({
            where: sql`${contractClauses.contractId} = ${contractId} AND 
                      ${contractClauses.content} ILIKE ${`%${clauseContent.substring(0, 100)}%`}`
          });
          
          return matchingClause?.id || null;
        }
        return null;
      })
    );
    
    // Insert batch with properly formatted dates
    for (let i = 0; i < obligationBatch.length; i++) {
      const obligation = obligationBatch[i];
      if (!obligation) continue; // Skip undefined obligations
      
      let dueDateISO: string | null = null;
      
      if (obligation.dueDate) {
        try {
          const dateObj = new Date(obligation.dueDate);
          dueDateISO = dateObj.toISOString().split('T')[0]; // Get YYYY-MM-DD format
        } catch (e) {
          // Invalid date format
          logger.warn('Invalid date format for obligation', { 
            dueDate: obligation.dueDate,
            obligationTitle: obligation.title
          });
        }
      }
      
      // Insert each obligation individually to handle data type issues
      try {
        await db.insert(contractObligations).values({
          contractId,
          tenantId,
          createdBy: userId,
          clauseId: clauseIds[i] || null,
          title: obligation.title,
          description: obligation.description,
          obligationType: mapObligationType(obligation.type || 'OTHER') as any,
          responsibleParty: obligation.responsibleParty || null,
          dueDate: dueDateISO,
          recurringPattern: obligation.recurringPattern || null,
          reminderDays: [30, 14, 7, 1], // Default reminder days
          confidenceLevel: mapConfidenceToLevel(obligation.confidenceScore || 0.5) as any
        });
      } catch (insertError) {
        logger.error('Error inserting obligation', { 
          error: insertError, 
          obligationTitle: obligation.title,
          contractId
        });
      }
    }
  }
}

/**
 * Extracts contract data from general AI analysis output
 */
async function extractContractDataFromGeneral(aiAnalysis: any): Promise<ContractExtraction | null> {
  try {
    const result: ContractExtraction = {
      parties: [],
      keyDates: [],
      financialTerms: [],
      clauses: [],
      obligations: [],
      metadata: {
        contractType: 'OTHER',
        confidenceScore: 0.5,
        sourceReferences: {}
      }
    };
    
    // Determine contract type from categories or entities
    if (aiAnalysis.categories?.some((cat: string) => 
        cat.includes('agreement') || cat.includes('contract'))) {
      const categoryMatch = aiAnalysis.categories.find((cat: string) => 
        cat.includes('agreement') || cat.includes('contract') || 
        cat.includes('LPA') || cat.includes('partnership'));
        
      if (categoryMatch) {
        result.metadata.contractType = mapContractTypeFromCategory(categoryMatch);
      }
    }
    
    // Extract parties from entities
    if (aiAnalysis.entities) {
      const orgEntities = aiAnalysis.entities.filter((entity: any) => 
        entity.type === 'organization' || entity.type === 'Organization');
        
      result.parties = orgEntities.map((org: any) => ({
        name: org.name,
        role: 'party',
        address: org.address,
        contact: org.contact
      }));
    }
    
    // Extract dates from timeline or entities
    if (aiAnalysis.timeline) {
      result.keyDates = aiAnalysis.timeline.map((event: any) => ({
        type: determineDateType(event.event),
        date: event.date,
        description: event.event
      }));
    }
    
    // Extract clauses from the document text
    // This would require more complex processing with the original document
    // For now, we'll create a placeholder clause with the summary
    if (aiAnalysis.summary) {
      result.clauses.push({
        title: 'Document Summary',
        content: aiAnalysis.summary,
        confidenceScore: 0.6
      });
    }
    
    // Extract obligations from key insights
    if (aiAnalysis.keyInsights) {
      result.obligations = aiAnalysis.keyInsights
        .filter((insight: string) => 
          insight.includes('must') || 
          insight.includes('shall') || 
          insight.includes('required') ||
          insight.includes('obligation'))
        .map((insight: string) => ({
          title: 'Obligation from Insight',
          description: insight,
          type: 'OTHER',
          confidenceScore: 0.4
        }));
    }
    
    // Set overall confidence score
    result.metadata.confidenceScore = aiAnalysis.confidence || 0.5;
    
    return result;
  } catch (error) {
    logger.error('Error extracting contract data from general analysis', { error });
    return null;
  }
}

/**
 * Maps AI contract type string to database enum value
 */
function mapContractType(type: string): string {
  const normalizedType = type.toUpperCase().trim();
  
  if (normalizedType.includes('LPA') || normalizedType.includes('LIMITED PARTNERSHIP'))
    return 'LPA';
  
  if (normalizedType.includes('SUBSCRIPTION'))
    return 'SUBSCRIPTION_AGREEMENT';
  
  if (normalizedType.includes('SIDE LETTER'))
    return 'SIDE_LETTER';
  
  if (normalizedType.includes('AMENDMENT') || normalizedType.includes('ADDENDUM'))
    return 'AMENDMENT';
  
  if (normalizedType.includes('NDA') || normalizedType.includes('NON-DISCLOSURE'))
    return 'NDA';
  
  if (normalizedType.includes('SERVICE') || normalizedType.includes('VENDOR'))
    return 'SERVICE_AGREEMENT';
  
  return 'OTHER';
}

/**
 * Maps AI category to contract type
 */
function mapContractTypeFromCategory(category: string): string {
  const normalizedCategory = category.toUpperCase().trim();
  
  if (normalizedCategory.includes('LPA') || normalizedCategory.includes('LIMITED PARTNERSHIP'))
    return 'LPA';
  
  if (normalizedCategory.includes('SUBSCRIPTION'))
    return 'SUBSCRIPTION_AGREEMENT';
  
  if (normalizedCategory.includes('SIDE LETTER'))
    return 'SIDE_LETTER';
  
  if (normalizedCategory.includes('AMENDMENT') || normalizedCategory.includes('ADDENDUM'))
    return 'AMENDMENT';
  
  if (normalizedCategory.includes('NDA') || normalizedCategory.includes('NON-DISCLOSURE'))
    return 'NDA';
  
  if (normalizedCategory.includes('SERVICE') || normalizedCategory.includes('VENDOR'))
    return 'SERVICE_AGREEMENT';
  
  return 'OTHER';
}

/**
 * Determines date type from description
 */
function determineDateType(description: string): string {
  const normalizedDesc = description.toUpperCase().trim();
  
  if (normalizedDesc.includes('EFFECTIVE') || normalizedDesc.includes('BEGINS') || normalizedDesc.includes('START'))
    return 'EFFECTIVE';
  
  if (normalizedDesc.includes('EXPIRY') || normalizedDesc.includes('EXPIRATION') || normalizedDesc.includes('TERMINAT'))
    return 'EXPIRY';
  
  if (normalizedDesc.includes('EXECUTION') || normalizedDesc.includes('SIGNED') || normalizedDesc.includes('EXECUTED'))
    return 'EXECUTION';
  
  if (normalizedDesc.includes('RENEWAL') || normalizedDesc.includes('RENEW') || normalizedDesc.includes('EXTENSION'))
    return 'RENEWAL';
  
  return 'OTHER';
}

/**
 * Finds the counterparty name from parties list
 */
function findCounterpartyName(parties: ContractExtraction['parties']): string | undefined {
  // Simple heuristic: return the second party if available
  if (parties.length > 1) {
    return parties[1].name;
  } else if (parties.length === 1) {
    return parties[0].name;
  }
  return undefined;
}

/**
 * Finds the counterparty address from parties list
 */
function findCounterpartyAddress(parties: ContractExtraction['parties']): string | undefined {
  // Simple heuristic: return the second party's address if available
  if (parties.length > 1 && parties[1].address) {
    return parties[1].address;
  } else if (parties.length === 1 && parties[0].address) {
    return parties[0].address;
  }
  return undefined;
}

/**
 * Finds the counterparty email from parties list
 */
function findCounterpartyEmail(parties: ContractExtraction['parties']): string | undefined {
  // Look for an email in the contact field
  for (const party of parties) {
    if (party.contact && party.contact.includes('@')) {
      return party.contact;
    }
  }
  return undefined;
}

/**
 * Finds date by type from key dates list
 */
function findDateByType(dates: ContractExtraction['keyDates'], type: string): Date | null | undefined {
  const matchingDate = dates.find(date => date.type.toUpperCase() === type);
  if (matchingDate?.date) {
    try {
      return new Date(matchingDate.date);
    } catch (e) {
      logger.warn('Invalid date format', { date: matchingDate.date, type });
      return null;
    }
  }
  return undefined;
}

/**
 * Finds financial term by type
 */
function findFinancialTermByType(terms: ContractExtraction['financialTerms'], type: string): string | undefined {
  const matchingTerm = terms.find(term => term.type.toUpperCase().includes(type));
  return matchingTerm?.value;
}

/**
 * Finds currency from financial terms
 */
function findCurrency(terms: ContractExtraction['financialTerms']): string | undefined {
  // Look for currency in any term
  for (const term of terms) {
    if (term.currency) {
      return term.currency;
    }
  }
  
  // Try to extract from value format
  for (const term of terms) {
    const value = term.value || '';
    if (value.startsWith('$')) return 'USD';
    if (value.startsWith('€')) return 'EUR';
    if (value.startsWith('£')) return 'GBP';
  }
  
  return undefined;
}