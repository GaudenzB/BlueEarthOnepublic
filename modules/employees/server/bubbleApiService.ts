import fetch, { RequestInit, Response as NodeFetchResponse } from 'node-fetch';
import { insertEmployeeSchema } from '@blueearth/core-server';
import { type Employee } from '@blueearth/core-common';
import { logger } from '../../../server/utils/logger';

/**
 * Bubble.io API Integration
 * 
 * This module handles the integration with Bubble.io's API for employee data.
 * It includes retry logic with exponential backoff for handling network issues.
 */

// Get configuration from centralized config - using a fallback for now until proper config access
const BUBBLE_API_KEY = process.env["BUBBLE_API_KEY"];
const BUBBLE_API_URL = process.env["BUBBLE_API_URL"] || 'https://api.bubble.io/version-test/api/1.1/obj';
const BUBBLE_DATA_TYPE = 'Employees';

// Retry configuration
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds
const REQUEST_TIMEOUT = 10000; // 10 seconds default timeout

if (!BUBBLE_API_KEY) {
  logger.warn('BUBBLE_API_KEY not set. Bubble.io integration will not function.');
}

interface BubbleEmployee {
  _id: string;
  About?: string;
  'Address 1'?: string;
  'Address 2'?: string;
  'Bank contact'?: string;
  'Birth day'?: string;
  'Board Memberships'?: string;
  'Email business'?: string;
  City?: string;
  'Committee Memberships'?: string;
  Country?: string;
  'Date of Birth'?: string;
  Deleted?: boolean;
  Department?: string;
  Documents?: any;
  'Email personal'?: string;
  'Employment Type'?: string;
  'External / Contractor'?: boolean;
  'Access Permissions'?: any;
  'First name preferred'?: string;
  'First name'?: string;
  'Function 2'?: string;
  Function?: string;
  Gender?: string;
  IBAN?: string;
  Initials?: string;
  Job?: string;
  'Job Title'?: string;
  'Jurisdiction 2'?: string;
  Jurisdiction?: string;
  'Last name'?: string;
  'Leave date'?: string;
  'Location geo'?: any;
  Manager?: string;
  'Menu Access'?: any;
  Name?: string;
  Nationality?: string;
  'Notes internal'?: string;
  Offboarding?: any;
  Onboarding?: any;
  'On-Offboarding temp'?: any;
  'System Permissions'?: any;
  'Data Admin'?: boolean;
  'Phone business mobile'?: string;
  'Phone business office'?: string;
  'Phone personal'?: string;
  Photo?: string;
  'Post Code ZIP'?: string;
  'Preferred first name checkbox'?: boolean;
  'Rank 2'?: string;
  Rank?: string;
  'Requires work permit'?: boolean;
  Role?: string;
  'Social Security Number'?: string;
  'Start date'?: string;
  Status?: string;
  Tags?: string[];
  'Team 2'?: string;
  Team?: string;
  Type?: string;
  User?: string;
  'Work permit expiration'?: string;
  'Work permit'?: string;
}

interface BubbleApiResponse {
  response: {
    results: BubbleEmployee[];
    cursor: number;
    remaining: number;
    count: number;
  };
}

/**
 * Sleep utility for retry delay
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 * @param attempt Current attempt number (1-based)
 * @returns Delay in milliseconds with jitter
 */
function calculateBackoff(attempt: number): number {
  // Exponential backoff with jitter: 2^attempt * initial_delay * (0.5-1.5 random factor)
  const exponentialDelay = Math.min(
    INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1),
    MAX_RETRY_DELAY
  );
  // Add jitter (±50%) to prevent synchronized retries
  const jitter = 0.5 + Math.random();
  return Math.floor(exponentialDelay * jitter);
}

/**
 * Make fetch request with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<NodeFetchResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Convert a Bubble.io employee to our application's employee format
 */
function mapBubbleEmployeeToAppEmployee(bubbleEmployee: BubbleEmployee): Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'syncedAt'> {
  const firstName = bubbleEmployee['First name'] || '';
  const lastName = bubbleEmployee['Last name'] || '';
  // Combine first and last name into a single name field
  const fullName = `${firstName} ${lastName}`.trim();
  
  return {
    name: fullName,
    email: bubbleEmployee['Email business'] || bubbleEmployee['Email personal'] || '',
    phone: bubbleEmployee['Phone business mobile'] || bubbleEmployee['Phone business office'] || bubbleEmployee['Phone personal'] || '',
    position: bubbleEmployee['Job Title'] || bubbleEmployee.Job || bubbleEmployee.Function || '',
    department: mapBubbleDepartmentToAppDepartment(bubbleEmployee.Department),
    status: mapBubbleStatusToAppStatus(bubbleEmployee.Status),
    avatarUrl: bubbleEmployee.Photo || '',
    location: `${bubbleEmployee.City || ''}${bubbleEmployee.City && bubbleEmployee.Country ? ', ' : ''}${bubbleEmployee.Country || ''}`.trim() || '',
    bio: bubbleEmployee.About || '',
    responsibilities: ''
  };
}

/**
 * Map Bubble.io department values to our application's department values
 * Maps to the standardized department values in the schema
 */
function mapBubbleDepartmentToAppDepartment(bubbleDepartment?: string): string {
  if (!bubbleDepartment) return 'operations';
  
  const dept = bubbleDepartment.toLowerCase();
  
  if (dept.includes('finance') || dept.includes('accounting')) {
    return 'finance';
  } else if (dept.includes('hr') || dept.includes('human')) {
    return 'hr';
  } else if (dept.includes('it') || dept.includes('tech')) {
    return 'operations';
  } else if (dept.includes('legal') || dept.includes('law')) {
    return 'legal';
  } else if (dept.includes('marketing')) {
    return 'marketing';
  } else if (dept.includes('sales')) {
    return 'sales';
  } else if (dept.includes('research') || dept.includes('r&d')) {
    return 'product';
  } else if (dept.includes('exec') || dept.includes('board')) {
    return 'executive';
  } else if (dept.includes('design')) {
    return 'design';
  } else if (dept.includes('product')) {
    return 'product';
  } else if (dept.includes('engineering')) {
    return 'engineering';
  }
  
  return 'operations';
}

/**
 * Map Bubble.io status values to our application's status values
 * Maps to the new standardized status values in the schema
 */
function mapBubbleStatusToAppStatus(bubbleStatus?: string): "active" | "inactive" | "on_leave" | "remote" {
  if (!bubbleStatus) return 'active';
  
  const status = bubbleStatus.toUpperCase();
  
  if (status.includes('ACTIVE') || status.includes('CURRENT')) {
    return 'active';
  } else if (status.includes('LEAVE') || status.includes('ABSENT')) {
    return 'on_leave';
  } else if (status.includes('CONTRACT') || status.includes('EXTERNAL') || status.includes('INTERN')) {
    // Map contract and intern to active since we don't have an exact match
    return 'active';
  } else if (status.includes('INACTIVE') || status.includes('FORMER') || status.includes('TERMINATED')) {
    return 'inactive';
  } else if (status.includes('REMOTE')) {
    return 'remote';
  }
  
  // Default to active as fallback
  return 'active';
}

/**
 * Fetch data from Bubble.io API with retry logic and exponential backoff
 */
async function fetchBubbleData(url: string): Promise<BubbleApiResponse> {
  if (!BUBBLE_API_KEY) {
    throw new Error('BUBBLE_API_KEY is not set');
  }

  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info(`Fetching data from Bubble.io (attempt ${attempt}/${MAX_RETRIES})`);
      
      // Increase timeout with each retry
      const timeout = REQUEST_TIMEOUT * attempt;
      
      const response = await fetchWithTimeout(
        url,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${BUBBLE_API_KEY}`,
            'Content-Type': 'application/json',
          }
        },
        timeout
      );

      // Handle rate limiting (status 429)
      if (response.status === 429) {
        const retryAfterHeader = response.headers.get('retry-after');
        const retryAfter = retryAfterHeader 
          ? parseInt(retryAfterHeader, 10) * 1000 
          : calculateBackoff(attempt);
        
        logger.warn(`Rate limited by Bubble.io API. Retrying after ${retryAfter}ms`);
        await sleep(retryAfter);
        continue;
      }

      // Handle other error responses
      if (!response.ok) {
        throw new Error(`Bubble API error: ${response.status} ${response.statusText}`);
      }

      // Successfully got a response
      const data = await response.json() as BubbleApiResponse;
      logger.info(`Successfully fetched ${data.response.results.length} employees from Bubble.io`);
      return data;
      
    } catch (error: any) {
      lastError = error;
      
      // Determine if error is retryable
      const isRetryable = 
        error.name === 'AbortError' ||  // Timeout
        error.name === 'FetchError' ||  // Network error
        error.code === 'ECONNRESET' ||  // Connection reset
        error.code === 'ETIMEDOUT' ||   // Connection timeout
        error.code === 'ECONNABORTED' || // Connection aborted
        (error.message && (
          error.message.includes('timeout') ||
          error.message.includes('network') ||
          error.message.includes('connection')
        ));
      
      if (!isRetryable) {
        logger.error('Non-retryable error from Bubble.io API', { error: error.message });
        throw error;
      }
      
      // Only retry if not the last attempt
      if (attempt < MAX_RETRIES) {
        const delay = calculateBackoff(attempt);
        logger.warn(`Retryable error from Bubble.io API. Retrying in ${delay}ms`, { 
          error: error.message,
          attempt,
          nextAttempt: attempt + 1,
          maxRetries: MAX_RETRIES,
          delay
        });
        await sleep(delay);
      } else {
        logger.error(`Failed to fetch from Bubble.io after ${MAX_RETRIES} attempts`, { 
          error: error.message,
          attempts: MAX_RETRIES
        });
      }
    }
  }
  
  // If all retries failed, throw the last error
  throw lastError || new Error(`Failed to fetch from Bubble.io API after ${MAX_RETRIES} attempts`);
}

/**
 * Fetch all employees from Bubble.io
 */
async function fetchBubbleEmployees(): Promise<BubbleEmployee[]> {
  try {
    const data = await fetchBubbleData(`${BUBBLE_API_URL}/${BUBBLE_DATA_TYPE}?limit=100`);
    return data.response.results;
  } catch (error) {
    logger.error('Error fetching employees from Bubble.io:', error);
    throw error;
  }
}

/**
 * Convert Bubble.io employees to our application format
 */
function convertBubbleEmployees(bubbleEmployees: BubbleEmployee[]): Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'syncedAt'>[] {
  return bubbleEmployees
    .filter(emp => !emp.Deleted) // Skip deleted employees
    .map(mapBubbleEmployeeToAppEmployee);
}

/**
 * Fetch and convert employees from Bubble.io
 */
async function getEmployeesFromBubble(): Promise<Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'syncedAt'>[]> {
  const bubbleEmployees = await fetchBubbleEmployees();
  return convertBubbleEmployees(bubbleEmployees);
}

// Export the bubble API service
export const bubbleApiService = {
  getEmployeesFromBubble,
  fetchBubbleEmployees,
  convertBubbleEmployees
};