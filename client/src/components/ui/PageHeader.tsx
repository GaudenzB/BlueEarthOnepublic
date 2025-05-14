import React from 'react';
import { Button, Space, Breadcrumb } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { theme } from '@/lib/theme';

export interface PageHeaderProps {
  /**
   * The main title of the page
   */
  title: string;
  
  /**
   * Optional subtitle or description text
   */
  description?: string;
  
  /**
   * Optional back button label. If provided, a back button will be shown
   */
  backLabel?: string;
  
  /**
   * Optional back button action. Required if backLabel is provided
   */
  onBack?: () => void;
  
  /**
   * Optional breadcrumb items
   */
  breadcrumbItems?: { label: string; href?: string }[];
  
  /**
   * Optional actions to show in the header
   */
  actions?: React.ReactNode;
  
  /**
   * Optional className for additional styling
   */
  className?: string;
}

/**
 * PageHeader Component
 * 
 * A standardized header component for page layouts.
 * Includes title, optional description, breadcrumbs, and action buttons.
 * 
 * @example
 * <PageHeader 
 *   title="Employee Directory" 
 *   description="View and manage employees"
 *   backLabel="Dashboard"
 *   onBack={() => navigate('/')}
 *   actions={<Button type="primary">Add Employee</Button>}
 * />
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  backLabel,
  onBack,
  breadcrumbItems = [],
  actions,
  className = '',
}) => {
  return (
    <div 
      className={`page-header ${className}`}
      style={{
        marginBottom: theme.spacing[6],
      }}
    >
      {/* Breadcrumbs */}
      {breadcrumbItems.length > 0 && (
        <Breadcrumb 
          style={{ marginBottom: theme.spacing[3] }}
          items={breadcrumbItems.map((item, index) => ({
            title: item.href ? <a href={item.href}>{item.label}</a> : item.label,
            key: index
          }))}
        />
      )}
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: description ? theme.spacing[2] : 0
      }}>
        <div>
          {/* Back button */}
          {backLabel && onBack && (
            <Button 
              type="link" 
              onClick={onBack} 
              style={{ 
                padding: 0, 
                height: 'auto',
                marginBottom: theme.spacing[2],
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ArrowLeftOutlined style={{ marginRight: theme.spacing[1] }} />
              {backLabel}
            </Button>
          )}
          
          {/* Title */}
          <h1 style={{ 
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            margin: 0,
            color: theme.gray[900]
          }}>
            {title}
          </h1>
        </div>
        
        {/* Actions */}
        {actions && (
          <Space size="small">
            {actions}
          </Space>
        )}
      </div>
      
      {/* Description */}
      {description && (
        <p style={{ 
          fontSize: theme.typography.fontSize.base,
          color: theme.gray[600],
          margin: 0,
          marginTop: theme.spacing[1]
        }}>
          {description}
        </p>
      )}
    </div>
  );
};

export default PageHeader;