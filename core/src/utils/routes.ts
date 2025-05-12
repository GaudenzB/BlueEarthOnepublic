/**
 * Centralized route constants for the application
 * 
 * These are used to ensure consistency between frontend routing and backend API endpoints.
 */

export const ROUTES = {
  HOME: '/',
  
  AUTH: {
    LOGIN: '/login',
    LOGOUT: '/logout',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  },
  
  EMPLOYEES: {
    LIST: '/employees',
    DETAIL: (id: string | number) => `/employees/${id}`,
    CREATE: '/employees/create',
    EDIT: (id: string | number) => `/employees/${id}/edit`,
  },
  
  USERS: {
    LIST: '/admin/users',
    DETAIL: (id: string | number) => `/admin/users/${id}`,
    CREATE: '/admin/users/create',
    EDIT: (id: string | number) => `/admin/users/${id}/edit`,
  },
  
  DOCUMENTS: {
    LIST: '/documents',
    DETAIL: (id: string | number) => `/documents/${id}`,
    CREATE: '/documents/create',
    EDIT: (id: string | number) => `/documents/${id}/edit`,
  },
  
  CONTRACTS: {
    LIST: '/contracts',
    DETAIL: (id: string | number) => `/contracts/${id}`,
    CREATE: '/contracts/create',
    EDIT: (id: string | number) => `/contracts/${id}/edit`,
  },

  API: {
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      REGISTER: '/api/auth/register',
      ME: '/api/auth/me',
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password',
    },
    
    EMPLOYEES: {
      BASE: '/api/employees',
      DETAIL: (id: string | number) => `/api/employees/${id}`,
      SEARCH: '/api/employees/search',
    },
    
    USERS: {
      BASE: '/api/users',
      DETAIL: (id: string | number) => `/api/users/${id}`,
      PERMISSIONS: (id: string | number) => `/api/users/${id}/permissions`,
    },
    
    DOCUMENTS: {
      BASE: '/api/documents',
      DETAIL: (id: string | number) => `/api/documents/${id}`,
      UPLOAD: '/api/documents/upload',
    },
    
    CONTRACTS: {
      BASE: '/api/contracts',
      DETAIL: (id: string | number) => `/api/contracts/${id}`,
    },
  },
};