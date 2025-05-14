import React from 'react';
import { Link } from 'wouter';
import { Card, Avatar, Skeleton, Tag } from 'antd';
import { 
  UserOutlined, 
  BankOutlined, 
  EnvironmentOutlined, 
  MailOutlined, 
  MessageOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  StopOutlined 
} from '@ant-design/icons';
import type { Employee } from '@shared/schema';
import StatusTag from './StatusTag';
import { theme } from '@/lib/theme';
import { colors } from '@/lib/colors';
import { ROUTES } from '@/lib/routes';

/**
 * Status configuration for different employee states
 */
const statusConfig: Record<string, { color: string, icon: React.ReactNode }> = {
  active: { 
    color: "success", 
    icon: <CheckCircleOutlined /> 
  },
  on_leave: { 
    color: "warning", 
    icon: <ClockCircleOutlined /> 
  },
  remote: { 
    color: "processing", 
    icon: <GlobalOutlined /> 
  },
  inactive: { 
    color: "default", 
    icon: <StopOutlined /> 
  }
};

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

  /**
   * Card display variant
   * - 'compact': Minimal info, good for grid layouts
   * - 'detailed': Shows more employee details (contact info, etc.)
   */
  variant?: 'compact' | 'detailed';
}

/**
 * EmployeeCard Component
 * 
 * A standardized card component for displaying an employee in lists and grids.
 * Uses our theme-based design system for consistent styling.
 * 
 * @example
 * <EmployeeCard employee={employee} />
 * <EmployeeCard employee={employee} variant="detailed" />
 */
export const EmployeeCard: React.FC<EmployeeCardProps> = ({ 
  employee, 
  onClick, 
  className = '',
  loading = false,
  variant = 'compact'
}) => {
  // Generate initials for avatar fallback
  const getInitials = (name: string = '') => {
    if (!name) return '??';
    
    const nameParts = name.split(' ');
    if (nameParts.length > 1 && nameParts[0] && nameParts[nameParts.length - 1]) {
      return `${nameParts[0]?.[0] || ''}${nameParts[nameParts.length - 1]?.[0] || ''}`.toUpperCase(); 
    } else {
      return nameParts[0]?.substring(0, 2).toUpperCase() || '??';
    }
  };

  // Card click handler
  const handleClick = () => {
    if (onClick) {
      onClick(employee);
    }
  };

  // Safely create the detail URL
  const getEmployeeDetailUrl = (id: number | undefined) => {
    if (id === undefined) {
      return '/'; // Fallback to home if no ID
    }
    return ROUTES.EMPLOYEES.DETAIL(id);
  };

  // Add null safety for status property
  const status = employee?.status || 'inactive';
  const config = statusConfig[status.toLowerCase()] || statusConfig['inactive'];
  const formattedStatus = status.replace('_', ' ');

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
        <div style={{ padding: theme.spacing[4] }}>
          {variant === 'compact' ? (
            // Compact skeleton
            <div style={{ textAlign: 'center' }}>
              <Skeleton.Avatar active size={80} shape="circle" style={{ margin: '0 auto' }} />
              <div style={{ marginTop: theme.spacing[4] }}>
                <Skeleton.Input active size="small" style={{ width: 150, margin: '0 auto' }} />
                <Skeleton.Input active size="small" style={{ width: 100, margin: '8px auto 0' }} />
              </div>
            </div>
          ) : (
            // Detailed skeleton
            <>
              <div className="flex items-center">
                <Skeleton.Avatar active size={48} shape="circle" />
                <div className="ml-3 space-y-2">
                  <Skeleton.Input active style={{ width: 120 }} />
                  <Skeleton.Input active style={{ width: 90 }} />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton active paragraph={{ rows: 3 }} />
              </div>
              <div className="mt-4 pt-3 border-t border-border flex justify-between">
                <Skeleton.Button active />
                <div className="flex space-x-2">
                  <Skeleton.Button active shape="circle" />
                  <Skeleton.Button active shape="circle" />
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    );
  }

  // Compact variant (centered, minimal info)
  if (variant === 'compact') {
    return (
      <Link href={getEmployeeDetailUrl(employee.id)}>
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
                {employee.name || 'Unknown'}
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
                {employee.department.charAt(0).toUpperCase() + employee.department.slice(1)}
              </div>
            )}
          </div>
        </Card>
      </Link>
    );
  }

  // Detailed variant (left-aligned with more info)
  return (
    <Card className="overflow-hidden border border-border hover:shadow-md transition-all duration-300">
      <Link href={getEmployeeDetailUrl(employee.id)} className="block cursor-pointer">
        <div className="p-4">
          <div className="flex items-center">
            <Avatar 
              className="h-12 w-12"
              src={employee.avatarUrl || undefined}
              icon={<UserOutlined />}
            >
              {!employee.avatarUrl && employee.name ? getInitials(employee.name) : null}
            </Avatar>
            <div className="ml-3">
              <h3 className="text-base font-semibold text-foreground">{employee.name || 'Unknown'}</h3>
              <p className="text-sm text-muted-foreground">{employee.position || 'No position'}</p>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center text-sm">
              <BankOutlined className="mr-2 text-muted-foreground" style={{ fontSize: '16px' }} />
              <span>{employee.department 
                ? `${employee.department.charAt(0).toUpperCase()}${employee.department.slice(1)} Department` 
                : 'Unknown Department'}</span>
            </div>
            {employee.location && (
              <div className="flex items-center text-sm">
                <EnvironmentOutlined className="mr-2 text-muted-foreground" style={{ fontSize: '16px' }} />
                <span>{employee.location}</span>
              </div>
            )}
            <div className="flex items-center text-sm">
              <MailOutlined className="mr-2 text-muted-foreground" style={{ fontSize: '16px' }} />
              <span className="truncate">{employee.email || 'No email'}</span>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
            <Tag 
              icon={config?.icon} 
              color={config?.color || "default"}
              className="flex items-center h-6 leading-6"
            >
              {formattedStatus.charAt(0).toUpperCase() + formattedStatus.slice(1)}
            </Tag>
            <div>
              <button 
                type="button"
                className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full transition-colors"
                title="View Profile"
                onClick={(e) => {
                  e.preventDefault();
                  handleClick();
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.hover;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <UserOutlined style={{ fontSize: '16px' }} />
              </button>
              <button
                type="button"
                className="h-8 w-8 ml-1 text-muted-foreground hover:text-foreground rounded-full transition-colors" 
                title="Send Message"
                onClick={(e) => e.preventDefault()}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.hover;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <MessageOutlined style={{ fontSize: '16px' }} />
              </button>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
};

export default EmployeeCard;