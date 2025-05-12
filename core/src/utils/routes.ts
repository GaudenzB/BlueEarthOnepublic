/**
 * Centralized route definitions for the application
 * 
 * This ensures consistency between frontend and backend route references
 */

/**
 * Frontend routes
 */
export const ROUTES = {
  // Auth routes
  LOGIN: '/login',
  LOGOUT: '/logout',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Main routes
  HOME: '/',
  DASHBOARD: '/dashboard',
  
  // Employee routes
  DIRECTORY: '/directory',
  EMPLOYEE_DETAIL: (id: string | number) => `/directory/${id}`,
  
  // User management routes
  USERS: '/users',
  USER_DETAIL: (id: string | number) => `/users/${id}`,
  USER_CREATE: '/users/new',
  USER_EDIT: (id: string | number) => `/users/${id}/edit`,
  
  // Document routes
  DOCUMENTS: '/documents',
  DOCUMENT_DETAIL: (id: string | number) => `/documents/${id}`,
  DOCUMENT_UPLOAD: '/documents/upload',
  
  // Contract routes
  CONTRACTS: '/contracts',
  CONTRACT_DETAIL: (id: string | number) => `/contracts/${id}`,
  CONTRACT_CREATE: '/contracts/new',
  
  // Admin routes
  ADMIN: '/admin',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_BUBBLE_SYNC: '/admin/bubble-sync',
};

/**
 * API routes
 */
export const API_ROUTES = {
  // Auth API routes
  AUTH: {
    BASE: '/api/auth',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  
  // User API routes
  USERS: {
    BASE: '/api/users',
    DETAIL: (id: string | number) => `/api/users/${id}`,
    PERMISSIONS: (userId: string | number) => `/api/users/${userId}/permissions`,
  },
  
  // Employee API routes
  EMPLOYEES: {
    BASE: '/api/employees',
    DETAIL: (id: string | number) => `/api/employees/${id}`,
    SEARCH: '/api/employees/search',
    DEPARTMENTS: '/api/employees/departments',
  },
  
  // Document API routes
  DOCUMENTS: {
    BASE: '/api/documents',
    DETAIL: (id: string | number) => `/api/documents/${id}`,
    UPLOAD: '/api/documents/upload',
    SEARCH: '/api/documents/search',
    TYPES: '/api/documents/types',
  },
  
  // Contract API routes
  CONTRACTS: {
    BASE: '/api/contracts',
    DETAIL: (id: string | number) => `/api/contracts/${id}`,
    TYPES: '/api/contracts/types',
    STATUSES: '/api/contracts/statuses',
  },
  
  // Admin API routes
  ADMIN: {
    BASE: '/api/admin',
    BUBBLE_SYNC: '/api/admin/bubble-sync',
    SETTINGS: '/api/admin/settings',
    STATS: '/api/admin/stats',
  },
};