/**
 * EmployeeSearchParams
 * Parameters for searching and filtering employees
 */
export interface EmployeeSearchParams {
  search?: string;
  department?: string;
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * EmployeeSyncStats
 * Statistics from syncing employees with external systems
 */
export interface EmployeeSyncStats {
  totalEmployees: number;
  created: number;
  updated: number;
  unchanged: number;
  errors: number;
}

/**
 * EmployeeTab
 * Represents the available tabs in the employee detail view
 */
export type EmployeeTab = 'overview' | 'projects' | 'documents' | 'timeline' | 'notes';

/**
 * EmployeePermission
 * Represents an employee-specific permission
 */
export interface EmployeePermission {
  id: number;
  employeeId: number;
  permissionType: string;
  permissionValue: boolean;
  areaId?: number;
}

/**
 * EmployeeNote
 * Represents a note attached to an employee record
 */
export interface EmployeeNote {
  id: number;
  employeeId: number;
  createdById: number;
  createdByName: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  visibility: 'private' | 'team' | 'all';
}