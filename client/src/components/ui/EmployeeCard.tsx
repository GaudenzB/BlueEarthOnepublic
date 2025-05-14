import React from 'react';
import { Link } from 'wouter';
import { Card, Avatar, Skeleton } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { Employee } from '@shared/schema';
import StatusTag from './StatusTag';
import { theme } from '@/lib/theme';

export interface EmployeeCardProps {
  /** 
   * Employee data object 
   */
  employee: Employee;
  
  /** 
   * Optional click handler 
   */
  onClick?: (employee: Employee) => void;
  
  /** 
   * Optional className for additional styling 
   */
  className?: string;
  
  /** 
   * Whether to show loading state 
   */
  loading?: boolean;
}

/**
 * EmployeeCard Component
 * 
 * A standardized card component for displaying an employee in lists and grids.
 * Uses our theme-based design system for consistent styling.
 * 
 * @example
 * <EmployeeCard employee={employee} />
 */
export const EmployeeCard: React.FC<EmployeeCardProps> = ({ 
  employee, 
  onClick, 
  className = '',
  loading = false
}) => {
  // Generate initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  // Card click handler
  const handleClick = () => {
    if (onClick) {
      onClick(employee);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card
        className={`employee-card ${className}`}
        hoverable
        style={{
          borderRadius: theme.borderRadius.xl,
          overflow: 'hidden',
          height: '100%',
          boxShadow: theme.shadows.sm
        }}
      >
        <div style={{ textAlign: 'center', padding: theme.spacing[4] }}>
          <Skeleton.Avatar active size={80} shape="circle" style={{ margin: '0 auto' }} />
          <div style={{ marginTop: theme.spacing[4] }}>
            <Skeleton.Input active size="small" style={{ width: 150, margin: '0 auto' }} />
            <Skeleton.Input active size="small" style={{ width: 100, margin: '8px auto 0' }} />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Link href={`/employees/${employee.id}`}>
      <Card
        className={`employee-card ${className}`}
        hoverable
        onClick={handleClick}
        style={{
          borderRadius: theme.borderRadius.xl,
          overflow: 'hidden',
          height: '100%',
          boxShadow: theme.shadows.sm,
          cursor: 'pointer'
        }}
      >
        <div style={{ textAlign: 'center', padding: theme.spacing[4] }}>
          <Avatar
            size={80}
            src={employee.avatarUrl || undefined}
            icon={<UserOutlined />}
            style={{ 
              margin: '0 auto', 
              display: 'block',
              backgroundColor: employee.avatarUrl ? 'transparent' : theme.gray[100],
              color: theme.gray[700],
              fontSize: theme.typography.fontSize.xl
            }}
          >
            {!employee.avatarUrl && employee.name ? getInitials(employee.name) : null}
          </Avatar>

          <div style={{ marginTop: theme.spacing[4] }}>
            <h3 style={{ 
              fontSize: theme.typography.fontSize.lg, 
              fontWeight: theme.typography.fontWeight.semibold,
              margin: '0 0 4px 0'
            }}>
              {employee.name}
            </h3>
            
            <p style={{ 
              fontSize: theme.typography.fontSize.sm, 
              color: theme.gray[600],
              margin: '0 0 12px 0'
            }}>
              {employee.position || 'No position'}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <StatusTag status={employee.status || 'inactive'} />
            </div>
          </div>

          {employee.department && (
            <div style={{ 
              marginTop: theme.spacing[4], 
              padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
              backgroundColor: theme.gray[50],
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.xs,
              display: 'inline-block'
            }}>
              {employee.department}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
};

export default EmployeeCard;