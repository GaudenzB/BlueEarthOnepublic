# BlueEarth Capital UI Component Examples

This document provides examples of UI components styled according to our financial services design system.

## Button Examples

```jsx
// Primary Button
<Button 
  type="primary"
  style={{
    backgroundColor: colors.primary.base,
    borderColor: colors.primary.base,
    height: '40px',
    borderRadius: '6px',
    fontWeight: 500,
    boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)'
  }}
>
  Submit Application
</Button>

// Secondary Button
<Button 
  style={{
    backgroundColor: '#ffffff',
    borderColor: colors.primary.base,
    color: colors.primary.base,
    height: '40px',
    borderRadius: '6px',
    fontWeight: 500
  }}
>
  View Details
</Button>

// Tertiary/Ghost Button
<Button 
  type="text"
  style={{
    color: colors.primary.base,
    fontWeight: 500,
    height: '40px'
  }}
>
  Learn More
</Button>

// Danger Button
<Button 
  type="primary" 
  danger
  style={{
    height: '40px',
    borderRadius: '6px',
    fontWeight: 500,
    boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)'
  }}
>
  Delete Account
</Button>
```

## Card Examples

```jsx
// Standard Card
<Card
  style={{
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.1)',
    border: '1px solid #eaecf0'
  }}
>
  <div style={{ padding: '24px' }}>
    <Typography.Title level={5} style={{ marginBottom: '16px', color: '#1e293b' }}>
      Investment Summary
    </Typography.Title>
    <div style={{ color: '#64748b', fontSize: '14px' }}>
      Card content goes here...
    </div>
  </div>
</Card>

// Interactive Card
<Card
  hoverable
  style={{
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.1)',
    border: '1px solid #eaecf0',
    transition: 'all 0.2s ease-in-out'
  }}
>
  <div style={{ padding: '24px' }}>
    <Typography.Title level={5} style={{ marginBottom: '16px', color: '#1e293b' }}>
      Client Profile
    </Typography.Title>
    <div style={{ color: '#64748b', fontSize: '14px' }}>
      Hover to see interactive state...
    </div>
  </div>
</Card>

// Card with Header
<Card
  title={
    <div style={{ 
      fontWeight: 600, 
      fontSize: '18px', 
      color: '#1e293b',
      padding: '16px 24px',
      borderBottom: '1px solid #eaecf0'
    }}>
      Performance Metrics
    </div>
  }
  style={{
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.1)',
    border: '1px solid #eaecf0'
  }}
>
  <div style={{ padding: '24px' }}>
    Card content goes here...
  </div>
</Card>
```

## Form Input Examples

```jsx
// Standard Input
<Input
  placeholder="Full Name"
  style={{ 
    height: '40px',
    borderRadius: '6px',
    borderColor: '#d1d5db'
  }}
/>

// Input with Label
<Form.Item
  label={
    <span style={{ 
      fontSize: '14px', 
      fontWeight: 500, 
      color: '#1e293b', 
      marginBottom: '8px' 
    }}>
      Email Address
    </span>
  }
>
  <Input
    placeholder="Enter your email"
    style={{ 
      height: '40px',
      borderRadius: '6px',
      borderColor: '#d1d5db'
    }}
  />
</Form.Item>

// Select Input
<Select
  placeholder="Select Investment Type"
  style={{ 
    width: '100%', 
    height: '40px'
  }}
>
  <Option value="equity">Equity</Option>
  <Option value="debt">Debt</Option>
  <Option value="mutual_fund">Mutual Fund</Option>
</Select>

// Date Picker
<DatePicker
  style={{ 
    width: '100%', 
    height: '40px',
    borderRadius: '6px',
    borderColor: '#d1d5db'
  }}
/>
```

## Status Tag Examples

```jsx
// Status tags for financial services
<StatusTag 
  status="approved" 
  text="Approved" 
  style={{
    backgroundColor: '#ecfdf5',
    color: '#10b981',
    border: '1px solid #d1fae5',
    fontWeight: 500,
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '4px'
  }}
/>

<StatusTag 
  status="pending" 
  text="Pending" 
  style={{
    backgroundColor: '#fffbeb',
    color: '#f59e0b',
    border: '1px solid #fef3c7',
    fontWeight: 500,
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '4px'
  }}
/>

<StatusTag 
  status="rejected" 
  text="Declined" 
  style={{
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    border: '1px solid #fecaca',
    fontWeight: 500,
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '4px'
  }}
/>

<StatusTag 
  status="in_review" 
  text="In Review" 
  style={{
    backgroundColor: '#eff6ff',
    color: '#3b82f6',
    border: '1px solid #dbeafe',
    fontWeight: 500,
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '4px'
  }}
/>
```

## Table Examples

```jsx
// Financial table styling
<Table
  columns={columns}
  dataSource={data}
  rowKey="id"
  style={{
    border: '1px solid #eaecf0',
    borderRadius: '8px',
    overflow: 'hidden'
  }}
  rowClassName={() => 'financial-table-row'}
  className="financial-table"
  pagination={{
    showSizeChanger: false,
    pageSize: 10,
    style: {
      marginTop: '24px',
      textAlign: 'right'
    }
  }}
/>

// CSS for the table
.financial-table .ant-table-thead > tr > th {
  background-color: #f8fafc;
  color: #1e293b;
  font-weight: 600;
  font-size: 14px;
  padding: 16px;
  border-bottom: 1px solid #eaecf0;
}

.financial-table .ant-table-tbody > tr > td {
  padding: 16px;
  border-bottom: 1px solid #eaecf0;
  color: #64748b;
  font-size: 14px;
}

.financial-table-row:hover {
  background-color: #f0f7ff !important;
}
```

## Empty State Examples

```jsx
// Empty state for financial data
<div
  style={{
    padding: '48px 24px',
    textAlign: 'center',
    background: '#f9fafc',
    borderRadius: '8px',
    border: '1px solid #eaecf0'
  }}
>
  <Empty
    image={<FileOutlined style={{ fontSize: 48, color: '#94a3b8' }} />}
    imageStyle={{ marginBottom: '24px' }}
    description={
      <div>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#1e293b',
          marginBottom: '8px'
        }}>
          No Documents Found
        </h3>
        <p style={{
          color: '#64748b',
          fontSize: '14px',
          maxWidth: '320px',
          margin: '0 auto'
        }}>
          There are no documents in this category. Upload your first document to get started.
        </p>
      </div>
    }
  >
    <Button
      type="primary"
      icon={<UploadOutlined />}
      style={{
        backgroundColor: '#0e4a86',
        borderColor: '#0e4a86',
        height: '40px',
        borderRadius: '6px',
        fontWeight: 500,
        marginTop: '24px'
      }}
    >
      Upload Document
    </Button>
  </Empty>
</div>
```

## Modal Examples

```jsx
// Financial styled modal
<Modal
  title={
    <div style={{ 
      fontWeight: 600, 
      fontSize: '18px', 
      color: '#1e293b',
      padding: '4px 0'
    }}>
      Confirm Transaction
    </div>
  }
  open={isModalVisible}
  onCancel={() => setIsModalVisible(false)}
  width={480}
  centered
  footer={[
    <Button 
      key="cancel" 
      onClick={() => setIsModalVisible(false)}
      style={{
        height: '40px',
        borderRadius: '6px',
        borderColor: '#d1d5db',
        fontWeight: 500
      }}
    >
      Cancel
    </Button>,
    <Button 
      key="submit" 
      type="primary" 
      onClick={handleConfirm}
      style={{
        backgroundColor: '#0e4a86',
        borderColor: '#0e4a86',
        height: '40px',
        borderRadius: '6px',
        fontWeight: 500
      }}
    >
      Confirm
    </Button>
  ]}
  bodyStyle={{ padding: '24px' }}
  style={{ borderRadius: '12px', overflow: 'hidden' }}
>
  <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
    Are you sure you want to proceed with this transaction? This action cannot be undone.
  </p>
  <div style={{ 
    background: '#f9fafc', 
    padding: '16px', 
    borderRadius: '6px',
    border: '1px solid #eaecf0',
    marginBottom: '16px'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
      <span style={{ color: '#64748b', fontSize: '14px' }}>Amount:</span>
      <span style={{ color: '#1e293b', fontWeight: 500, fontSize: '14px' }}>$10,000.00</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: '#64748b', fontSize: '14px' }}>Fee:</span>
      <span style={{ color: '#1e293b', fontWeight: 500, fontSize: '14px' }}>$25.00</span>
    </div>
  </div>
</Modal>
```

## Alert Examples

```jsx
// Success Alert
<Alert
  message="Transaction Successful"
  description="Your funds have been successfully transferred to the specified account."
  type="success"
  showIcon
  style={{
    borderRadius: '8px',
    border: '1px solid #d1fae5',
    marginBottom: '24px'
  }}
/>

// Warning Alert
<Alert
  message="Unusual Activity Detected"
  description="We've noticed unusual activity on your account. Please verify your recent transactions."
  type="warning"
  showIcon
  style={{
    borderRadius: '8px',
    border: '1px solid #fef3c7',
    marginBottom: '24px'
  }}
/>

// Error Alert
<Alert
  message="Transaction Failed"
  description="Your transaction could not be completed. Please check your account balance and try again."
  type="error"
  showIcon
  style={{
    borderRadius: '8px',
    border: '1px solid #fecaca',
    marginBottom: '24px'
  }}
/>

// Info Alert
<Alert
  message="Account Update"
  description="Your account details will be updated within 24 hours. You'll receive a confirmation email."
  type="info"
  showIcon
  style={{
    borderRadius: '8px',
    border: '1px solid #dbeafe',
    marginBottom: '24px'
  }}
/>
```

## Progress Indicator Examples

```jsx
// Task Progress
<div style={{ marginBottom: '24px' }}>
  <div style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    marginBottom: '8px',
    alignItems: 'center'
  }}>
    <span style={{ 
      color: '#1e293b', 
      fontSize: '14px', 
      fontWeight: 500 
    }}>
      Application Progress
    </span>
    <span style={{ 
      color: '#64748b', 
      fontSize: '14px' 
    }}>
      75%
    </span>
  </div>
  <Progress 
    percent={75} 
    showInfo={false}
    strokeColor="#0e4a86"
    style={{ marginBottom: '4px' }}
  />
  <span style={{ color: '#64748b', fontSize: '12px' }}>
    3 of 4 steps completed
  </span>
</div>

// Step Progress
<Steps
  current={1}
  labelPlacement="vertical"
  style={{ marginBottom: '24px' }}
>
  <Steps.Step 
    title="Application" 
    description="Completed" 
    style={{ color: '#64748b', fontSize: '14px' }}
  />
  <Steps.Step 
    title="Verification" 
    description="In progress" 
    style={{ color: '#64748b', fontSize: '14px' }}
  />
  <Steps.Step 
    title="Approval" 
    description="Pending" 
    style={{ color: '#64748b', fontSize: '14px' }}
  />
  <Steps.Step 
    title="Funding" 
    description="Pending" 
    style={{ color: '#64748b', fontSize: '14px' }}
  />
</Steps>
```