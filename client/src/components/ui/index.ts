/**
 * UI Components Export
 * 
 * This file exports all UI components as a centralized entry point.
 * Components can be imported from '@/components/ui' instead of their individual files.
 */

export { default as StatusTag } from './StatusTag';
export type { StatusTagProps, StatusType } from './StatusTag';

export { default as EmployeeCard } from './EmployeeCard';
export type { EmployeeCardProps, Employee } from './EmployeeCard';

export { default as LoadingState } from './LoadingState';
export type { LoadingStateProps } from './LoadingState';

export { default as SkipLink } from './SkipLink';
export type { SkipLinkProps } from './SkipLink';

// Add other UI component exports here as they're created