/**
 * Re-export all shared types, constants, and utilities from the employee module
 */
export * from './types';
export * from './constants';

/**
 * Export any module-specific utilities or helper functions here
 */

/**
 * Format the employee's full name
 * @param firstName First name of the employee
 * @param lastName Last name of the employee
 * @returns The full name, formatted as "First Last"
 */
export const formatEmployeeName = (firstName?: string, lastName?: string): string => {
  const first = firstName?.trim() || '';
  const last = lastName?.trim() || '';
  
  if (first && last) {
    return `${first} ${last}`;
  } else if (first) {
    return first;
  } else if (last) {
    return last;
  }
  
  return 'Unknown';
};

/**
 * Format a phone number for display
 * @param phone Phone number string
 * @returns Formatted phone number or empty string if not provided
 */
export const formatPhoneNumber = (phone?: string): string => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a standard 10-digit US phone number
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
  }
  
  // Check if it's an 11-digit US phone number with country code 1
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 11)}`;
  }
  
  // For international or non-standard formats, just add a plus sign if needed
  if (!phone.startsWith('+') && cleaned.length > 10) {
    return `+${cleaned}`;
  }
  
  // Return the original if we can't format it
  return phone;
};

/**
 * Get an abbreviation from an employee name
 * @param firstName First name of the employee
 * @param lastName Last name of the employee
 * @returns Two-letter abbreviation (e.g., "JD" for "John Doe")
 */
export const getEmployeeInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName?.trim() || '';
  const last = lastName?.trim() || '';
  
  if (first && last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  } else if (first) {
    return first.substring(0, 2).toUpperCase();
  } else if (last) {
    return last.substring(0, 2).toUpperCase();
  }
  
  return 'NA';
};