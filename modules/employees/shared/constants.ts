/**
 * API Endpoints for employee-related operations
 */
export const EMPLOYEE_API = {
  BASE: '/api/employees',
  SYNC: '/api/sync/employees',
  DETAIL: (id: number | string) => `/api/employees/${id}`,
};

/**
 * Client-side routes for employee views
 */
export const EMPLOYEE_ROUTES = {
  LIST: '/employees',
  DETAIL: (id: number | string) => `/employees/${id}`,
  NEW: '/employees/new',
  EDIT: (id: number | string) => `/employees/${id}/edit`,
};

/**
 * Employee detail view tab identifiers
 */
export const EMPLOYEE_TABS = {
  OVERVIEW: 'overview',
  PROJECTS: 'projects',
  DOCUMENTS: 'documents',
  TIMELINE: 'timeline',
  NOTES: 'notes',
} as const;

/**
 * Query keys for React Query
 */
export const EMPLOYEE_QUERY_KEYS = {
  ALL: ['employees'],
  DETAIL: (id: number | string) => ['employees', id.toString()],
  SEARCH: (params: Record<string, any>) => ['employees', 'search', params],
};