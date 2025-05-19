/**
 * Shared type definitions used across client and server
 */

/**
 * Available status types for documents, employees, and other entities
 */
export enum StatusType {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  PROCESSING = 'processing',
  ON_LEAVE = 'on_leave',
  REMOTE = 'remote',
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  EXPIRED = 'expired',
  ARCHIVED = 'archived',
  RESTRICTED = 'restricted',
  CUSTOM = 'custom'
}

/**
 * Document processing status enum
 */
export enum DocumentProcessingStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ERROR = 'ERROR',
  WARNING = 'WARNING'
}

/**
 * Types of permissions available in the application
 */
export enum PermissionType {
  VIEW = 'view',
  EDIT = 'edit',
  CREATE = 'create',
  DELETE = 'delete',
  APPROVE = 'approve',
  ADMIN = 'admin'
}

/**
 * Application areas for permission control
 */
export enum PermissionArea {
  DOCUMENTS = 'documents',
  EMPLOYEES = 'employees',
  SETTINGS = 'settings',
  ANALYTICS = 'analytics',
  CONTRACTS = 'contracts',
  ADMIN = 'admin'
}

/**
 * User role definitions
 */
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
  GUEST = 'guest'
}