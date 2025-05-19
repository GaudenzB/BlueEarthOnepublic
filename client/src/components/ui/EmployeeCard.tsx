import React, { memo, useMemo, useCallback } from 'react';
import { Avatar, Card, Button, Space, Typography, Tooltip } from 'antd';
import {
  PhoneOutlined,
  MailOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  CalendarOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { StatusTag } from '@/components/ui';
import { truncateText, formatDate } from '@/utils/formatting';
import { tokens } from '@/theme/tokens';
import a11y from '@/utils/a11y';

// Types for employee data
export interface Employee {
  /**
   * Unique identifier for the employee
   */
  id: string;
  
  /**
   * Employee first name
   */
  firstName: string;
  
  /**
   * Employee last name
   */
  lastName: string;
  
  /**
   * Employee email address
   */
  email: string;
  
  /**
   * Employee phone number
   */
  phone?: string;
  
  /**
   * Employee position/title
   */
  position?: string;
  
  /**
   * Employee department
   */
  department?: string;
  
  /**
   * Employee hire date (ISO string)
   */
  hireDate?: string;
  
  /**
   * Employee status
   */
  status: 'active' | 'inactive' | 'on_leave' | 'remote';
  
  /**
   * Employee avatar image URL
   */
  avatarUrl?: string;
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Props for EmployeeCard component
 */
export interface EmployeeCardProps {
  /**
   * Employee data object
   */
  employee: Employee;
  
  /**
   * Card size variant
   */
  size?: 'small' | 'default' | 'large';
  
  /**
   * Whether to show actions (edit, delete)
   */
  showActions?: boolean;
  
  /**
   * Whether the card is selectable
   */
  selectable?: boolean;
  
  /**
   * Whether the card is currently selected
   */
  isSelected?: boolean;
  
  /**
   * Whether to show detailed information
   */
  detailed?: boolean;
  
  /**
   * Custom className
   */
  className?: string;
  
  /**
   * Click handler for the entire card
   */
  onClick?: (employee: Employee) => void;
  
  /**
   * Edit button click handler
   */
  onEdit?: (employee: Employee) => void;
  
  /**
   * Delete button click handler
   */
  onDelete?: (employee: Employee) => void;
}

/**
 * Employee name component (memoized)
 */
const EmployeeName = memo(({ 
  firstName, 
  lastName, 
  position, 
  detailed 
}: { 
  firstName: string; 
  lastName: string; 
  position?: string; 
  detailed?: boolean 
}) => (
  <Space direction="vertical" size={0}>
    <Typography.Title
      level={detailed ? 4 : 5}
      style={{ 
        margin: 0, 
        overflow: 'hidden', 
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}
    >
      {firstName} {lastName}
    </Typography.Title>
    
    {position && (
      <Typography.Text type="secondary" style={{ fontSize: detailed ? 14 : 12 }}>
        {position}
      </Typography.Text>
    )}
  </Space>
));

EmployeeName.displayName = 'EmployeeName';

/**
 * Employee contact component (memoized)
 */
const EmployeeContact = memo(({ 
  email, 
  phone, 
  detailed 
}: { 
  email: string; 
  phone?: string; 
  detailed?: boolean 
}) => (
  <Space direction="vertical" size={detailed ? 4 : 2} style={{ width: '100%' }}>
    <Typography.Paragraph 
      style={{ 
        margin: 0, 
        fontSize: detailed ? 14 : 12,
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <MailOutlined style={{ marginRight: 8, color: tokens.colors.neutral[500] }} />
      <a href={`mailto:${email}`} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {truncateText(email, detailed ? 30 : 20)}
      </a>
    </Typography.Paragraph>
    
    {phone && (
      <Typography.Paragraph 
        style={{ 
          margin: 0, 
          fontSize: detailed ? 14 : 12,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <PhoneOutlined style={{ marginRight: 8, color: tokens.colors.neutral[500] }} />
        <a href={`tel:${phone}`}>{phone}</a>
      </Typography.Paragraph>
    )}
  </Space>
));

EmployeeContact.displayName = 'EmployeeContact';

/**
 * Employee details component (memoized)
 */
const EmployeeDetails = memo(({ 
  department, 
  hireDate 
}: { 
  department?: string; 
  hireDate?: string 
}) => (
  <Space direction="vertical" size={4} style={{ width: '100%' }}>
    {department && (
      <Space align="center">
        <TeamOutlined style={{ color: tokens.colors.neutral[500] }} />
        <Typography.Text>{department}</Typography.Text>
      </Space>
    )}
    
    {hireDate && (
      <Space align="center">
        <CalendarOutlined style={{ color: tokens.colors.neutral[500] }} />
        <Typography.Text>Joined {formatDate(hireDate, 'medium')}</Typography.Text>
      </Space>
    )}
  </Space>
));

EmployeeDetails.displayName = 'EmployeeDetails';

/**
 * EmployeeCard Component
 * 
 * A standardized component for displaying employee information with
 * proper accessibility attributes, responsive design, and memoization
 * for optimal performance.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <EmployeeCard 
 *   employee={employeeData} 
 *   onClick={handleEmployeeSelect} 
 * />
 * 
 * // Detailed card with actions
 * <EmployeeCard 
 *   employee={employeeData} 
 *   detailed
 *   showActions
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * 
 * // Selectable card
 * <EmployeeCard 
 *   employee={employeeData} 
 *   selectable
 *   isSelected={selectedEmployeeId === employeeData.id}
 *   onClick={toggleEmployeeSelection}
 * />
 * ```
 */
export const EmployeeCard: React.FC<EmployeeCardProps> = memo(({
  employee,
  size = 'default',
  showActions = false,
  selectable = false,
  isSelected = false,
  detailed = false,
  className = '',
  onClick,
  onEdit,
  onDelete
}) => {
  // Generate a unique ID for accessibility attributes
  const id = useMemo(() => 
    a11y.generateAriaId(`employee-${employee.id}`), 
    [employee.id]
  );
  
  // Determine card size properties
  const sizeConfig = useMemo(() => {
    switch (size) {
      case 'small':
        return {
          cardWidth: '240px',
          avatarSize: 40,
          bodyPadding: tokens.spacing[3],
          cardBodyStyle: { padding: tokens.spacing[3] }
        };
      case 'large':
        return {
          cardWidth: detailed ? '100%' : '320px',
          avatarSize: 64,
          bodyPadding: tokens.spacing[5],
          cardBodyStyle: { padding: tokens.spacing[5] }
        };
      case 'default':
      default:
        return {
          cardWidth: detailed ? '100%' : '280px',
          avatarSize: 48,
          bodyPadding: tokens.spacing[4],
          cardBodyStyle: { padding: tokens.spacing[4] }
        };
    }
  }, [size, detailed]);
  
  // Click handlers
  const handleCardClick = () => {
    if (onClick) {
      onClick(employee);
    }
  };
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(employee);
    }
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(employee);
    }
  };
  
  // Generate description for screen readers
  const ariaDescription = useMemo(() => {
    const parts = [];
    
    if (employee.position) {
      parts.push(`Position: ${employee.position}`);
    }
    
    if (employee.department) {
      parts.push(`Department: ${employee.department}`);
    }
    
    if (employee.status) {
      const statusText = employee.status.replace(/_/g, ' ');
      parts.push(`Status: ${statusText}`);
    }
    
    if (employee.hireDate) {
      parts.push(`Hire date: ${formatDate(employee.hireDate, 'short')}`);
    }
    
    return parts.join(', ');
  }, [employee]);
  
  // Card actions
  const cardActions = useMemo(() => {
    if (!showActions) return undefined;
    
    return [
      <Tooltip key="edit" title="Edit employee">
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={handleEditClick}
          aria-label="Edit employee"
        />
      </Tooltip>,
      <Tooltip key="delete" title="Delete employee">
        <Button
          type="text"
          icon={<DeleteOutlined />}
          onClick={handleDeleteClick}
          aria-label="Delete employee"
          danger
        />
      </Tooltip>
    ];
  }, [showActions, handleEditClick, handleDeleteClick]);
  
  // Card layout - horizontal for detailed mode, vertical for default
  const cardContent = detailed ? (
    <div style={{ display: 'flex', width: '100%' }}>
      <div style={{ marginRight: tokens.spacing[5] }}>
        <Avatar
          size={sizeConfig.avatarSize}
          src={employee.avatarUrl}
          icon={!employee.avatarUrl && <UserOutlined />}
          alt={`${employee.firstName} ${employee.lastName}`}
        />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[4], flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <EmployeeName 
            firstName={employee.firstName} 
            lastName={employee.lastName} 
            position={employee.position} 
            detailed
          />
          
          <StatusTag 
            status={employee.status} 
            tooltip={`Employee is currently ${employee.status.replace(/_/g, ' ')}`}
          />
        </div>
        
        <div style={{ display: 'flex', gap: tokens.spacing[6] }}>
          <EmployeeContact email={employee.email} phone={employee.phone} detailed />
          
          <EmployeeDetails 
            department={employee.department} 
            hireDate={employee.hireDate} 
          />
        </div>
      </div>
    </div>
  ) : (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <Avatar
        size={sizeConfig.avatarSize}
        src={employee.avatarUrl}
        icon={!employee.avatarUrl && <UserOutlined />}
        alt={`${employee.firstName} ${employee.lastName}`}
        style={{ marginBottom: tokens.spacing[3] }}
      />
      
      <div style={{ marginBottom: tokens.spacing[2] }}>
        <EmployeeName 
          firstName={employee.firstName} 
          lastName={employee.lastName} 
          position={employee.position}
        />
      </div>
      
      <div style={{ marginBottom: tokens.spacing[3] }}>
        <StatusTag 
          status={employee.status}
          size="small"
          tooltip={`Employee is currently ${employee.status.replace(/_/g, ' ')}`}
        />
      </div>
      
      <EmployeeContact email={employee.email} phone={employee.phone} />
    </div>
  );
  
  return (
    <Card
      id={id}
      hoverable={Boolean(onClick)}
      className={`employee-card ${className}`}
      actions={cardActions}
      style={{
        width: sizeConfig.cardWidth,
        cursor: onClick ? 'pointer' : 'default',
        border: isSelected ? `2px solid ${tokens.colors.brand.primary}` : undefined
      }}
      bodyStyle={sizeConfig.cardBodyStyle}
      onClick={handleCardClick}
      aria-label={`Employee: ${employee.firstName} ${employee.lastName}`}
      aria-description={ariaDescription}
      role="article"
    >
      {cardContent}
    </Card>
  );
});

EmployeeCard.displayName = 'EmployeeCard';

export default EmployeeCard;