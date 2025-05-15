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
  // CONTRACTS module removed
  CALENDAR: '/calendar',
  MESSAGES: '/messages',
  DESIGN_TESTING: '/design-testing',
  DESIGN_SYSTEM: '/design-system',
  THEME_SHOWCASE: '/theme-showcase',
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
    // Contracts module removed
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
    {
      title: "Theme Showcase",
      href: ROUTES.THEME_SHOWCASE,
      icon: "Palette",
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
    path.startsWith(`${AUTH_ROUTES.RESET_PASSWORD}/`) ||
    path === AUTH_ROUTES.ENTRA_COMPLETE ||
    path === AUTH_ROUTES.ENTRA_ERROR;
};