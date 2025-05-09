import fetch from 'node-fetch';
import { InsertEmployee } from '@shared/schema';

// Check if API key is available
const BUBBLE_API_KEY = process.env.BUBBLE_API_KEY;
if (!BUBBLE_API_KEY) {
  console.warn('BUBBLE_API_KEY not set. Bubble.io integration will not function.');
}

const BUBBLE_API_URL = 'https://blueearth.team/version-test/api/1.1/obj';
const BUBBLE_DATA_TYPE = 'Employees';

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
 * Convert a Bubble.io employee to our application's employee format
 */
function mapBubbleEmployeeToAppEmployee(bubbleEmployee: BubbleEmployee): InsertEmployee {
  return {
    name: [bubbleEmployee['First name'], bubbleEmployee['Last name']]
      .filter(Boolean)
      .join(' ') || bubbleEmployee.Name || '',
    position: bubbleEmployee['Job Title'] || bubbleEmployee.Job || bubbleEmployee.Function || '',
    department: bubbleEmployee.Department || '',
    location: bubbleEmployee.Country || bubbleEmployee.City || '',
    email: bubbleEmployee['Email business'] || bubbleEmployee['Email personal'] || '',
    phone: bubbleEmployee['Phone business mobile'] || bubbleEmployee['Phone business office'] || bubbleEmployee['Phone personal'] || '',
    avatarUrl: bubbleEmployee.Photo || '',
    status: mapBubbleStatusToAppStatus(bubbleEmployee.Status),
  };
}

/**
 * Map Bubble.io status values to our application's status values
 */
function mapBubbleStatusToAppStatus(bubbleStatus?: string): 'active' | 'inactive' | 'on_leave' | 'remote' {
  if (!bubbleStatus) return 'active';
  
  const status = bubbleStatus.toLowerCase();
  
  if (status.includes('active') || status.includes('current')) {
    return 'active';
  } else if (status.includes('leave') || status.includes('absent')) {
    return 'on_leave';
  } else if (status.includes('remote') || status.includes('external')) {
    return 'remote';
  } else if (status.includes('inactive') || status.includes('former') || status.includes('terminated')) {
    return 'inactive';
  }
  
  return 'active'; // Default status
}

/**
 * Fetch all employees from Bubble.io
 */
export async function fetchBubbleEmployees(): Promise<BubbleEmployee[]> {
  if (!BUBBLE_API_KEY) {
    throw new Error('BUBBLE_API_KEY is not set');
  }

  try {
    const response = await fetch(`${BUBBLE_API_URL}/${BUBBLE_DATA_TYPE}?limit=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BUBBLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Bubble API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as BubbleApiResponse;
    return data.response.results;
  } catch (error) {
    console.error('Error fetching employees from Bubble.io:', error);
    throw error;
  }
}

/**
 * Convert Bubble.io employees to our application format
 */
export function convertBubbleEmployees(bubbleEmployees: BubbleEmployee[]): InsertEmployee[] {
  return bubbleEmployees
    .filter(emp => !emp.Deleted) // Skip deleted employees
    .map(mapBubbleEmployeeToAppEmployee);
}

/**
 * Fetch and convert employees from Bubble.io
 */
export async function getEmployeesFromBubble(): Promise<InsertEmployee[]> {
  const bubbleEmployees = await fetchBubbleEmployees();
  return convertBubbleEmployees(bubbleEmployees);
}