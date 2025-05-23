/**
 * Centralized route definitions
 * 
 * This file defines all routes used throughout the application to ensure consistency
 * between router definitions and link targets.
 */

// Auth Routes
export const AUTH_ROUTES = {
  LOGIN: '/auth',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password', // :token is appended dynamically
  ENTRA_COMPLETE: '/auth/entra-complete',
  ENTRA_ERROR: '/auth/entra-error',
};

// Main Routes
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  EMPLOYEES: {
    LIST: '/',
    DETAIL: (id: string | number) => `/employee/${id}`,
  },
  DOCUMENTS: {
    LIST: '/documents',
    DETAIL: (id: string | number) => `/documents/${id}`,
  },
  CONTRACTS: {
    LIST: '/contracts',
    NEW: '/contracts/new',
    DETAIL: (id: string | number) => `/contracts/${id}`,
    EDIT: (id: string | number) => `/contracts/${id}/edit`,
  },
  CALENDAR: '/calendar',
  MESSAGES: '/messages',
  DESIGN_TESTING: '/design-testing',
  DESIGN_SYSTEM: '/design-system',
};

// Admin Routes
export const ADMIN_ROUTES = {
  USERS: '/users',
  INTEGRATIONS: '/integrations',
};

// Feature flag check for contracts module
const isContractsEnabled = () => {
  return true; // Force enable contracts module for testing
  // return import.meta.env['ENABLE_CONTRACTS'] === 'true';
};

// Navigation items for Sidebar
export const getNavItems = (isSuperAdmin: boolean) => {
  // Base navigation items
  const baseNavItems = [
    {
      title: "Employee Directory",
      href: ROUTES.EMPLOYEES.LIST,
      icon: "Users",
    },
    {
      title: "Dashboard",
      href: ROUTES.DASHBOARD,
      icon: "LayoutDashboard",
    },
    {
      title: "Calendar",
      href: ROUTES.CALENDAR,
      icon: "Calendar",
    },
    {
      title: "Documents",
      href: ROUTES.DOCUMENTS.LIST,
      icon: "FileText",
    },
    {
      title: "Messages",
      href: ROUTES.MESSAGES,
      icon: "MessageSquare",
    },
    {
      title: "Design Testing",
      href: ROUTES.DESIGN_TESTING,
      icon: "Palette",
    },
    {
      title: "Design System",
      href: ROUTES.DESIGN_SYSTEM,
      icon: "PenTool",
    },

  ];
  
  // Add Contracts menu item if the feature is enabled
  if (isContractsEnabled()) {
    // Insert after Documents and before Messages
    baseNavItems.splice(4, 0, {
      title: "Contracts",
      href: ROUTES.CONTRACTS.LIST,
      icon: "FileContract",
    });
  }
  
  // Admin navigation items - only visible to superadmins
  const adminNavItems = isSuperAdmin ? [
    {
      title: "User Management",
      href: ADMIN_ROUTES.USERS,
      icon: "UserCog",
    },
    {
      title: "Integrations",
      href: ADMIN_ROUTES.INTEGRATIONS,
      icon: "Link",
    }
  ] : [];
  
  // Combine all navigation items
  return [...baseNavItems, ...adminNavItems];
};

/**
 * Check if the current URL path is part of authentication flow
 */
export const isAuthRoute = (path: string): boolean => {
  return path === AUTH_ROUTES.LOGIN || 
    path === '/auth' ||  // Include direct /auth path
    path === AUTH_ROUTES.FORGOT_PASSWORD || 
    path.startsWith(`${AUTH_ROUTES.RESET_PASSWORD}/`) ||
    path === AUTH_ROUTES.ENTRA_COMPLETE ||
    path === AUTH_ROUTES.ENTRA_ERROR;
};