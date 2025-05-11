import { eq, and, desc, sql, or, like, gte, lte } from 'drizzle-orm';
import { db } from '../db';
import { 
  contracts, 
  type Contract, 
  type InsertContract,
  contractTypeEnum,
  contractStatusEnum
} from '../../shared/schema/index';
import { logger } from '../utils/logger';

/**
 * Repository for Contract-related database operations
 */
export const contractRepository = {
  /**
   * Create a new contract record
   * 
   * @param contract - Contract data to insert
   * @returns The created contract
   */
  async create(contract: InsertContract): Promise<Contract> {
    try {
      const [result] = await db.insert(contracts)
        .values(contract)
        .returning();
      return result;
    } catch (error) {
      logger.error('Error creating contract', { error, contract });
      throw new Error(`Failed to create contract: ${error.message}`);
    }
  },

  /**
   * Get a contract by its ID
   * 
   * @param id - Contract ID
   * @param tenantId - Tenant ID for multi-tenancy
   * @returns The contract or undefined if not found
   */
  async getById(id: string, tenantId: string): Promise<Contract | undefined> {
    try {
      const [result] = await db.select()
        .from(contracts)
        .where(
          and(
            eq(contracts.id, id),
            eq(contracts.tenantId, tenantId)
          )
        );
      return result;
    } catch (error) {
      logger.error('Error getting contract by ID', { error, id, tenantId });
      throw new Error(`Failed to get contract: ${error.message}`);
    }
  },

  /**
   * Get all contracts for a tenant with optional filtering and pagination
   * 
   * @param tenantId - Tenant ID
   * @param options - Query options for filtering and pagination
   * @returns Array of contracts and total count
   */
  async getAll(tenantId: string, options: {
    limit?: number;
    offset?: number;
    contractType?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    tags?: string[];
    effectiveFrom?: Date;
    effectiveTo?: Date;
    expirationFrom?: Date;
    expirationTo?: Date;
    internalOwner?: string;
  } = {}): Promise<{ contracts: Contract[]; total: number }> {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        contractType, 
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        tags,
        effectiveFrom,
        effectiveTo,
        expirationFrom,
        expirationTo,
        internalOwner
      } = options;

      // Build query conditions
      const conditions = [
        eq(contracts.tenantId, tenantId)
      ];

      if (contractType) {
        conditions.push(eq(contracts.contractType, contractType));
      }

      if (status) {
        conditions.push(eq(contracts.status, status));
      }

      if (search) {
        conditions.push(
          or(
            like(contracts.title, `%${search}%`),
            like(contracts.contractNumber, `%${search}%`),
            like(contracts.description, `%${search}%`),
            like(contracts.counterpartyName, `%${search}%`)
          )
        );
      }

      if (tags && tags.length > 0) {
        for (const tag of tags) {
          conditions.push(sql`${contracts.tags} @> array[${tag}]::text[]`);
        }
      }

      if (effectiveFrom) {
        conditions.push(gte(contracts.effectiveDate, effectiveFrom));
      }

      if (effectiveTo) {
        conditions.push(lte(contracts.effectiveDate, effectiveTo));
      }

      if (expirationFrom) {
        conditions.push(gte(contracts.expirationDate, expirationFrom));
      }

      if (expirationTo) {
        conditions.push(lte(contracts.expirationDate, expirationTo));
      }

      if (internalOwner) {
        conditions.push(eq(contracts.internalOwner, internalOwner));
      }

      // Count total records for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(contracts)
        .where(and(...conditions));

      // Get contracts with pagination
      const results = await db
        .select()
        .from(contracts)
        .where(and(...conditions))
        .orderBy(
          sortOrder === 'desc' 
            ? desc(contracts[sortBy as keyof typeof contracts]) 
            : contracts[sortBy as keyof typeof contracts]
        )
        .limit(limit)
        .offset(offset);

      return {
        contracts: results,
        total: Number(count)
      };
    } catch (error) {
      logger.error('Error getting contracts', { error, tenantId, options });
      throw new Error(`Failed to get contracts: ${error.message}`);
    }
  },

  /**
   * Update a contract
   * 
   * @param id - Contract ID
   * @param tenantId - Tenant ID
   * @param updates - Fields to update
   * @returns The updated contract
   */
  async update(id: string, tenantId: string, updates: Partial<InsertContract>): Promise<Contract | undefined> {
    try {
      const [result] = await db
        .update(contracts)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(contracts.id, id),
            eq(contracts.tenantId, tenantId)
          )
        )
        .returning();
      return result;
    } catch (error) {
      logger.error('Error updating contract', { error, id, tenantId, updates });
      throw new Error(`Failed to update contract: ${error.message}`);
    }
  },

  /**
   * Update contract status
   * 
   * @param id - Contract ID
   * @param tenantId - Tenant ID
   * @param status - New status
   * @returns The updated contract
   */
  async updateStatus(id: string, tenantId: string, status: string): Promise<Contract | undefined> {
    try {
      // Validate status
      if (!Object.values(contractStatusEnum.enum).includes(status as any)) {
        throw new Error(`Invalid contract status: ${status}`);
      }

      const [result] = await db
        .update(contracts)
        .set({
          status: status as any,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(contracts.id, id),
            eq(contracts.tenantId, tenantId)
          )
        )
        .returning();
      return result;
    } catch (error) {
      logger.error('Error updating contract status', { error, id, tenantId, status });
      throw new Error(`Failed to update contract status: ${error.message}`);
    }
  },

  /**
   * Get contracts that are near expiration
   * 
   * @param tenantId - Tenant ID
   * @param daysThreshold - Number of days before expiration to include
   * @returns Contracts near expiration
   */
  async getExpiringContracts(tenantId: string, daysThreshold: number = 30): Promise<Contract[]> {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysThreshold);

      const results = await db
        .select()
        .from(contracts)
        .where(
          and(
            eq(contracts.tenantId, tenantId),
            eq(contracts.status, 'ACTIVE'),
            gte(contracts.expirationDate, today),
            lte(contracts.expirationDate, futureDate)
          )
        )
        .orderBy(contracts.expirationDate);

      return results;
    } catch (error) {
      logger.error('Error getting expiring contracts', { error, tenantId, daysThreshold });
      throw new Error(`Failed to get expiring contracts: ${error.message}`);
    }
  },

  /**
   * Create a new version of an existing contract
   * 
   * @param parentContractId - ID of the parent contract
   * @param contractData - New contract version data
   * @returns The created contract version
   */
  async createNewVersion(parentContractId: string, contractData: InsertContract): Promise<Contract> {
    try {
      // First get the current version
      const [parentContract] = await db
        .select()
        .from(contracts)
        .where(eq(contracts.id, parentContractId));

      if (!parentContract) {
        throw new Error(`Parent contract not found: ${parentContractId}`);
      }

      // Create new version with incremented version number
      const [newVersion] = await db
        .insert(contracts)
        .values({
          ...contractData,
          parentContractId,
          version: parentContract.version + 1
        })
        .returning();

      return newVersion;
    } catch (error) {
      logger.error('Error creating new contract version', { error, parentContractId, contractData });
      throw new Error(`Failed to create new contract version: ${error.message}`);
    }
  },

  /**
   * Get all versions of a contract
   * 
   * @param contractId - ID of any version of the contract
   * @param tenantId - Tenant ID
   * @returns Array of contract versions
   */
  async getVersionHistory(contractId: string, tenantId: string): Promise<Contract[]> {
    try {
      // First find the contract
      const [contract] = await db
        .select()
        .from(contracts)
        .where(
          and(
            eq(contracts.id, contractId),
            eq(contracts.tenantId, tenantId)
          )
        );

      if (!contract) {
        throw new Error(`Contract not found: ${contractId}`);
      }

      // If this is a child version, find the parent
      let rootContractId = contractId;
      if (contract.parentContractId) {
        // Find the root parent by traversing up
        let parentId = contract.parentContractId;
        while (parentId) {
          const [parent] = await db
            .select()
            .from(contracts)
            .where(eq(contracts.id, parentId));
          
          if (!parent || !parent.parentContractId) {
            rootContractId = parent?.id || rootContractId;
            break;
          }
          parentId = parent.parentContractId;
        }
      }

      // Now find all contracts with this root as parent, or the root itself
      const results = await db
        .select()
        .from(contracts)
        .where(
          or(
            eq(contracts.id, rootContractId),
            eq(contracts.parentContractId, rootContractId),
            // Also include any descendants
            sql`${contracts.id} IN (
              WITH RECURSIVE contract_tree AS (
                SELECT id FROM ${contracts} WHERE parent_contract_id = ${rootContractId}
                UNION ALL
                SELECT c.id FROM ${contracts} c
                JOIN contract_tree ct ON c.parent_contract_id = ct.id
              )
              SELECT id FROM contract_tree
            )`
          )
        )
        .orderBy(contracts.version);

      return results;
    } catch (error) {
      logger.error('Error getting contract version history', { error, contractId, tenantId });
      throw new Error(`Failed to get contract version history: ${error.message}`);
    }
  }
};

export default contractRepository;