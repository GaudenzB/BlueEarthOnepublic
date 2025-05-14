import React from 'react';
import { Link } from 'wouter';
import { Card, Avatar, Skeleton, Typography, Divider } from 'antd';
import { 
  UserOutlined, 
  BankOutlined, 
  EnvironmentOutlined, 
  MailOutlined, 
  PhoneOutlined
} from '@ant-design/icons';
import type { Employee } from '@shared/schema';
import StatusTag from './StatusTag';
import { ROUTES } from '@/lib/routes';

const { Title, Text } = Typography;

/**
 * Professional color palette for financial style
 */
const CARD_STYLES = {
  avatar: {
    border: '2px solid #f0f0f0',
    background: '#f6f9fc',
    color: '#334155'
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1f2937'
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b'
  },
  iconColor: '#0e4a86', // Updated to match primary blue from theme
  infoLabel: {
    fontSize: '13px',
    color: '#374151'
  },
  card: {
    boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)',
    borderRadius: '8px',
    transition: 'all 0.2s ease-in-out',
    hover: {
      boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.08)'
    }
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
  const employeeStatus = employee?.status || 'inactive';

  // Loading state
  if (loading) {
    return (
      <Card
        className={`employee-card ${className}`}
        variant="outlined"
        style={{
          overflow: 'hidden',
          height: '100%',
          boxShadow: CARD_STYLES.card.boxShadow,
          borderRadius: CARD_STYLES.card.borderRadius,
          background: '#fff',
          border: '1px solid #eaecf0'
        }}
      >
        <div style={{ padding: '16px' }}>
          {variant === 'compact' ? (
            // Compact skeleton
            <div style={{ textAlign: 'center' }}>
              <Skeleton.Avatar active size={64} shape="circle" style={{ margin: '0 auto' }} />
              <div style={{ marginTop: '16px' }}>
                <Skeleton.Input active size="small" style={{ width: 150, margin: '0 auto' }} />
                <Skeleton.Input active size="small" style={{ width: 100, margin: '8px auto 0' }} />
              </div>
            </div>
          ) : (
            // Detailed skeleton
            <>
              <div className="flex items-center">
                <Skeleton.Avatar active size={64} shape="circle" />
                <div className="ml-4 space-y-1 flex-1">
                  <Skeleton.Input active style={{ width: '60%' }} />
                  <Skeleton.Input active style={{ width: '40%' }} />
                </div>
              </div>
              <Skeleton.Input active style={{ width: '30%', marginTop: '16px' }} />
              <div className="mt-4 space-y-3">
                <Skeleton active paragraph={{ rows: 3, width: ['90%', '80%', '70%'] }} />
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
          className={`employee-card ${className} transition-all duration-200`}
          hoverable
          variant="outlined"
          onClick={handleClick}
          style={{
            overflow: 'hidden',
            height: '100%',
            boxShadow: CARD_STYLES.card.boxShadow,
            borderRadius: CARD_STYLES.card.borderRadius,
            cursor: 'pointer',
            background: '#fff',
            border: '1px solid #eaecf0',
            transition: CARD_STYLES.card.transition
          }}
        >
          <div style={{ 
            padding: '16px 8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Avatar
              size={64}
              src={employee.avatarUrl || undefined}
              icon={<UserOutlined />}
              style={{ 
                border: CARD_STYLES.avatar.border,
                backgroundColor: employee.avatarUrl ? 'transparent' : CARD_STYLES.avatar.background,
                color: CARD_STYLES.avatar.color,
                fontSize: '18px',
                marginBottom: '12px'
              }}
            >
              {!employee.avatarUrl && employee.name ? getInitials(employee.name) : null}
            </Avatar>

            <Title level={5} style={{ 
              margin: '0 0 4px 0',
              fontSize: CARD_STYLES.title.fontSize,
              textAlign: 'center',
              fontWeight: CARD_STYLES.title.fontWeight,
              color: CARD_STYLES.title.color
            }}>
              {employee.name || 'Unknown'}
            </Title>
            
            <Text type="secondary" style={{ 
              fontSize: CARD_STYLES.subtitle.fontSize,
              lineHeight: 1.4,
              textAlign: 'center',
              marginBottom: '12px',
              color: CARD_STYLES.subtitle.color
            }}>
              {employee.position || 'No position'}
            </Text>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <StatusTag status={employeeStatus} size="small" />
            </div>

            {employee.department && (
              <div style={{ 
                padding: '4px 12px',
                backgroundColor: '#f5f8fe',
                borderRadius: '16px',
                color: '#4b5563',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.3px',
                textTransform: 'uppercase'
              }}>
                {employee.department}
              </div>
            )}
          </div>
        </Card>
      </Link>
    );
  }

  // Detailed variant (left-aligned with more info)
  return (
    <Card 
      className={`${className} transition-all duration-200`}
      hoverable
      variant="outlined"
      style={{
        overflow: 'hidden',
        height: '100%',
        boxShadow: CARD_STYLES.card.boxShadow,
        borderRadius: CARD_STYLES.card.borderRadius,
        border: '1px solid #eaecf0',
        transition: CARD_STYLES.card.transition
      }}
    >
      <Link href={getEmployeeDetailUrl(employee.id)} className="block cursor-pointer">
        <div>
          <div className="flex items-center mb-3">
            <Avatar 
              size={64}
              src={employee.avatarUrl || undefined}
              icon={<UserOutlined />}
              style={{ 
                border: CARD_STYLES.avatar.border,
                backgroundColor: employee.avatarUrl ? 'transparent' : CARD_STYLES.avatar.background,
                color: CARD_STYLES.avatar.color
              }}
            >
              {!employee.avatarUrl && employee.name ? getInitials(employee.name) : null}
            </Avatar>
            <div className="ml-4">
              <Title level={5} style={{ 
                margin: '0 0 2px 0',
                fontSize: CARD_STYLES.title.fontSize,
                fontWeight: CARD_STYLES.title.fontWeight,
                color: CARD_STYLES.title.color
              }}>
                {employee.name || 'Unknown'}
              </Title>
              <Text type="secondary" style={{ 
                fontSize: CARD_STYLES.subtitle.fontSize,
                color: CARD_STYLES.subtitle.color 
              }}>
                {employee.position || 'No position'}
              </Text>
              <div className="mt-1">
                <StatusTag status={employeeStatus} size="small" />
              </div>
            </div>
          </div>
          
          <Divider style={{ margin: '12px 0' }} />
          
          <div className="grid grid-cols-1 gap-2">
            {employee.department && (
              <div className="flex items-center text-sm">
                <BankOutlined className="mr-3" style={{ 
                  fontSize: '14px',
                  color: CARD_STYLES.iconColor 
                }} />
                <Text style={{ 
                  fontSize: CARD_STYLES.infoLabel.fontSize, 
                  color: CARD_STYLES.infoLabel.color 
                }}>
                  {employee.department.charAt(0).toUpperCase() + employee.department.slice(1)}
                </Text>
              </div>
            )}
            {employee.location && (
              <div className="flex items-center text-sm">
                <EnvironmentOutlined className="mr-3" style={{ 
                  fontSize: '14px',
                  color: CARD_STYLES.iconColor 
                }} />
                <Text style={{ 
                  fontSize: CARD_STYLES.infoLabel.fontSize, 
                  color: CARD_STYLES.infoLabel.color 
                }}>
                  {employee.location}
                </Text>
              </div>
            )}
            {employee.email && (
              <div className="flex items-center text-sm">
                <MailOutlined className="mr-3" style={{ 
                  fontSize: '14px',
                  color: CARD_STYLES.iconColor 
                }} />
                <Text 
                  style={{ 
                    fontSize: CARD_STYLES.infoLabel.fontSize, 
                    color: CARD_STYLES.infoLabel.color 
                  }} 
                  ellipsis={{ tooltip: employee.email }}
                >
                  {employee.email}
                </Text>
              </div>
            )}
            {employee.phone && (
              <div className="flex items-center text-sm">
                <PhoneOutlined className="mr-3" style={{ 
                  fontSize: '14px',
                  color: CARD_STYLES.iconColor 
                }} />
                <Text style={{ 
                  fontSize: CARD_STYLES.infoLabel.fontSize, 
                  color: CARD_STYLES.infoLabel.color 
                }}>
                  {employee.phone}
                </Text>
              </div>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
};

export default EmployeeCard;