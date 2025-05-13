/**
 * Centralized route definitions
 * 
 * This file defines all routes used throughout the application to ensure consistency
 * between router definitions and link targets.
 */

// Auth Routes
export const AUTH_ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password', // :token is appended dynamically
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
    DETAIL: (id: string | number) => `/contracts/${id}`,
  },
  CALENDAR: '/calendar',
  MESSAGES: '/messages',
  CHAKRA_TEST: '/chakra-test',
  DOCUMENTS_EXAMPLE: '/documents-example',
  PDF_TEST: '/pdf-test',
};

// Admin Routes
export const ADMIN_ROUTES = {
  USERS: '/users',
  INTEGRATIONS: '/integrations',
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
      title: "Contracts",
      href: ROUTES.CONTRACTS.LIST,
      icon: "GanttChart",
    },
    {
      title: "Messages",
      href: ROUTES.MESSAGES,
      icon: "MessageSquare",
    },
    {
      title: "Chakra UI Test",
      href: ROUTES.CHAKRA_TEST,
      icon: "Palette",
    },
    {
      title: "Documents Example",
      href: ROUTES.DOCUMENTS_EXAMPLE,
      icon: "FileText",
    },
  ];
  
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
    path === AUTH_ROUTES.FORGOT_PASSWORD || 
    path.startsWith(`${AUTH_ROUTES.RESET_PASSWORD}/`);
};