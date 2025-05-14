# BlueEarth Financial Portal Component Examples

This document provides examples of common UI components styled according to our financial services design system. Use these examples as a reference when building new features or updating existing ones.

## StatusTag Examples

The StatusTag component is a cornerstone of our UI system, providing consistent status indicators throughout the application.

```tsx
// Employee status examples
<StatusTag status="active" />
<StatusTag status="inactive" />
<StatusTag status="on_leave" />
<StatusTag status="remote" />

// Document status examples
<StatusTag status="completed" />
<StatusTag status="processing" />
<StatusTag status="failed" />
<StatusTag status="warning" />
<StatusTag status="pending" />

// Approval status examples
<StatusTag status="draft" />
<StatusTag status="in_review" />
<StatusTag status="approved" />
<StatusTag status="expired" />
<StatusTag status="rejected" />

// Special types
<StatusTag status="version" text="v2.0" />
<StatusTag status="restricted" text="Confidential" />
<StatusTag status="archived" text="Quarterly Report" />

// Size variants
<StatusTag status="active" size="small" />
<StatusTag status="active" size="default" />
<StatusTag status="active" size="large" />

// Custom text
<StatusTag status="in_review" text="Under Review" />
```

## Button Examples

Buttons follow our financial services styling with appropriate use cases:

```tsx
// Primary actions
<Button type="primary">
  Save Changes
</Button>

// Secondary actions
<Button>
  Cancel
</Button>

// Destructive actions
<Button type="primary" danger>
  Delete Item
</Button>

// Text-only buttons
<Button type="text">
  View Details
</Button>

// Icon buttons
<Button icon={<DownloadOutlined />}>
  Download
</Button>

// Loading state
<Button type="primary" loading>
  Processing
</Button>
```

## Card Examples

Cards use our standardized box styling with appropriate content layouts:

```tsx
// Standard information card
<Card 
  className="financial-card"
  style={{
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.1)',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  }}
>
  <Title level={5}>Account Summary</Title>
  <div className="content">
    {/* Card content goes here */}
  </div>
</Card>

// Action card with header
<Card 
  className="financial-card"
  title="Recent Transactions"
  extra={<Button type="link">View All</Button>}
  style={{
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.1)',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  }}
>
  {/* Card content goes here */}
</Card>
```

## Table Examples

Tables follow our financial styling with appropriate header treatments:

```tsx
<Table
  dataSource={data}
  columns={columns}
  className="financial-table"
  size="middle"
  rowClassName={() => 'financial-table-row'}
  pagination={{
    pageSize: 10,
    showSizeChanger: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
  }}
/>
```

## Form Examples

Forms follow our financial styling with appropriate spacing and validation:

```tsx
<Form
  layout="vertical"
  style={{
    maxWidth: '800px',
  }}
>
  <Form.Item
    label="Account Name"
    name="accountName"
    rules={[{ required: true, message: 'Please enter account name' }]}
  >
    <Input />
  </Form.Item>
  
  <Form.Item
    label="Account Type"
    name="accountType"
    rules={[{ required: true, message: 'Please select account type' }]}
  >
    <Select>
      <Select.Option value="checking">Checking</Select.Option>
      <Select.Option value="savings">Savings</Select.Option>
      <Select.Option value="investment">Investment</Select.Option>
    </Select>
  </Form.Item>
  
  <Form.Item>
    <Space>
      <Button type="primary" htmlType="submit">
        Save
      </Button>
      <Button>
        Cancel
      </Button>
    </Space>
  </Form.Item>
</Form>
```

## Document Detail UI

The document detail page follows our structured layout system:

```tsx
<div 
  className="document-detail-container"
  style={{ 
    maxWidth: '1200px', 
    margin: '0 auto', 
    padding: '24px 16px' 
  }}
>
  {/* Document Header with financial services styling */}
  <div className="financial-section">
    <DocumentHeader 
      document={document}
      statusBadge={<DocumentStatusBadge status={document.processingStatus} />}
      onDeleteClick={handleDeleteClick}
      onShareClick={handleShareClick}
      onFavorite={handleFavoriteToggle}
      isFavorited={isFavorited}
      loading={loading}
    />
  </div>
  
  {/* Processing Alert if needed */}
  <DocumentProcessingAlert 
    document={document}
    onRefresh={handleRefreshStatus}
    isRefreshing={isRefreshing}
  />
  
  {/* Document Tabs with financial industry styling */}
  <div 
    className="financial-section"
    style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(16, 24, 40, 0.1)', 
      padding: '24px',
      border: '1px solid #e5e7eb',
      marginTop: '16px'
    }}
  >
    <DocumentTabs 
      document={document}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onRestoreVersion={handleRestoreVersion}
      isRestoring={loading?.restore || false}
    />
  </div>
</div>
```

## Employee Card Examples

The EmployeeCard component presents employee profiles in a financial services styling:

```tsx
// Compact variant (grid layout)
<EmployeeCard 
  employee={employee} 
  variant="compact" 
  onClick={handleEmployeeClick}
/>

// Detailed variant (detailed info)
<EmployeeCard 
  employee={employee} 
  variant="detailed" 
/>

// Loading state
<EmployeeCard 
  employee={employee} 
  loading={true} 
/>
```

## Page Layout Examples

Standard page layout follows our spacing and container system:

```tsx
<div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
  <PageHeader 
    title="Document Management"
    subtitle="View and manage your financial documents"
    actions={
      <Button type="primary" icon={<UploadOutlined />}>
        Upload Document
      </Button>
    }
  />
  
  <div style={{ marginTop: '24px' }}>
    {/* Page content */}
  </div>
</div>
```

## Alert and Notification Examples

Alerts follow our financial styling with appropriate status colors:

```tsx
// Success alert
<Alert
  type="success"
  message="Transaction Completed"
  description="Your transaction has been processed successfully."
  showIcon
/>

// Warning alert
<Alert
  type="warning"
  message="Account Warning"
  description="Your account balance is below the minimum threshold."
  showIcon
/>

// Error alert
<Alert
  type="error"
  message="Transaction Failed"
  description="Your transaction could not be processed. Please try again."
  showIcon
/>

// Info alert
<Alert
  type="info"
  message="New Feature Available"
  description="You can now download your statements directly from the dashboard."
  showIcon
/>
```

## Using Theme Tokens

Import our theme tokens to maintain consistency:

```tsx
import { colors, typography, spacing, shadows } from '@/lib/theme';

// Using in component styles
const styles = {
  container: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.default,
    boxShadow: shadows.sm,
    padding: spacing.lg,
  },
  title: {
    color: colors.secondary.charcoal,
    fontSize: typography.fontSize.h5,
    fontWeight: typography.fontWeight.bold,
  },
  statusSuccess: {
    color: colors.status.active,
  },
  // ... other styles
};
```