/**
 * UI Components Index
 * 
 * This file exports all shared UI components for easy importing
 * throughout the application.
 * 
 * Usage:
 * import { StatusTag, EmployeeCard, PageHeader } from '@/components/ui';
 */

// Export all UI components
export { default as StatusTag } from './StatusTag';
export { default as EmployeeCard } from './EmployeeCard';
export { default as PageHeader } from './PageHeader';
export { default as CardContainer } from './CardContainer';
export { default as EmptyState } from './EmptyState';

// Re-export component types
export type { StatusTagProps } from './StatusTag';
export type { EmployeeCardProps } from './EmployeeCard';
export type { PageHeaderProps } from './PageHeader';
export type { CardContainerProps } from './CardContainer';
export type { EmptyStateProps } from './EmptyState';