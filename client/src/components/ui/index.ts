/**
 * UI Components Index
 * 
 * This file exports all shared UI components for easy importing
 * throughout the application.
 * 
 * Usage:
 * import { StatusTag, EmployeeCard } from '@/components/ui';
 */

// Export all UI components
export { default as StatusTag } from './StatusTag';
export { default as EmployeeCard } from './EmployeeCard';

// Re-export component types
export type { StatusTagProps } from './StatusTag';
export type { EmployeeCardProps } from './EmployeeCard';