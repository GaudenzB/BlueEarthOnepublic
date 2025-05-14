# BlueEarth Capital Component Examples

This guide provides examples of common components used throughout the BlueEarth Capital application, demonstrating how to implement the design system using Ant Design.

## Layout Components

### Page Layout

The standard page layout includes a header with title and a content area:

```tsx
import { PageLayout } from '../components/PageLayout';

function MyPage() {
  return (
    <PageLayout title="Employee Directory">
      <div>Page content goes here</div>
    </PageLayout>
  );
}
```

### Card Container

Use Card Container to group related content:

```tsx
import { Card } from 'antd';
import { theme } from '../lib/theme';

function ContentCard({ title, children }) {
  return (
    <Card 
      title={title}
      style={{
        borderRadius: theme.borderRadius.lg,
        boxShadow: theme.shadows.sm,
        marginBottom: theme.spacing.md
      }}
    >
      {children}
    </Card>
  );
}
```

## Data Display Components

### Status Tag

Use Status Tags to display entity status with consistent colors:

```tsx
import { Tag } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import { theme } from '../lib/theme';

function StatusTag({ status }) {
  const statusConfig = {
    active: {
      color: theme.colors.status.active,
      icon: <CheckCircleOutlined />,
      text: 'Active'
    },
    inactive: {
      color: theme.colors.status.inactive,
      icon: <CloseCircleOutlined />,
      text: 'Inactive'
    },
    pending: {
      color: theme.colors.status.pending,
      icon: <ClockCircleOutlined />,
      text: 'Pending'
    },
    review: {
      color: theme.colors.status.info,
      icon: <ExclamationCircleOutlined />,
      text: 'In Review'
    },
    // Add other statuses as needed
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Tag color={config.color} icon={config.icon}>
      {config.text}
    </Tag>
  );
}
```

### Employee Card

The employee card displays employee information in a consistent format:

```tsx
import { Card, Avatar, Typography, Space } from 'antd';
import { MailOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { theme } from '../lib/theme';

const { Title, Text } = Typography;

function EmployeeCard({ employee, compact = false }) {
  if (compact) {
    return (
      <Card
        size="small"
        style={{
          borderRadius: theme.borderRadius.lg,
          boxShadow: theme.shadows.sm,
          border: `1px solid ${theme.colors.border.light}`
        }}
      >
        <Space align="center">
          <Avatar 
            size={48} 
            src={employee.avatarUrl} 
          />
          <div>
            <Title level={5} style={{ margin: 0 }}>
              {employee.name}
            </Title>
            <Text type="secondary">
              {employee.position}
            </Text>
          </div>
        </Space>
      </Card>
    );
  }

  return (
    <Card
      style={{
        borderRadius: theme.borderRadius.lg,
        boxShadow: theme.shadows.sm,
        border: `1px solid ${theme.colors.border.light}`
      }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space align="start">
          <Avatar 
            size={64} 
            src={employee.avatarUrl} 
          />
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {employee.name}
            </Title>
            <Text type="secondary" style={{ fontSize: theme.typography.fontSizes.md }}>
              {employee.position}
            </Text>
            <div style={{ marginTop: theme.spacing[2] }}>
              <StatusTag status={employee.status} />
            </div>
          </div>
        </Space>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space>
            <MailOutlined />
            <Text>{employee.email}</Text>
          </Space>
          {employee.phone && (
            <Space>
              <PhoneOutlined />
              <Text>{employee.phone}</Text>
            </Space>
          )}
          {employee.location && (
            <Space>
              <EnvironmentOutlined />
              <Text>{employee.location}</Text>
            </Space>
          )}
        </Space>
      </Space>
    </Card>
  );
}
```

### Search Filters

Search filters component for filtering data:

```tsx
import { Input, Select, DatePicker, Space, Button } from 'antd';
import { SearchOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { theme } from '../lib/theme';

function SearchFilters({ 
  onSearch, 
  onFilter, 
  onReset, 
  departments = [], 
  locations = [] 
}) {
  return (
    <Space 
      direction="horizontal" 
      size="middle"
      wrap
      style={{ 
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md, 
        background: theme.colors.background.subtle,
        borderRadius: theme.borderRadius.md
      }}
    >
      <Input 
        placeholder="Search employees..."
        prefix={<SearchOutlined />}
        style={{ width: 250 }}
        onChange={(e) => onSearch(e.target.value)}
      />
      
      <Select
        placeholder="Department"
        style={{ width: 150 }}
        allowClear
        onChange={(value) => onFilter('department', value)}
        options={departments.map(dept => ({ label: dept, value: dept }))}
      />
      
      <Select
        placeholder="Location"
        style={{ width: 180 }}
        allowClear
        onChange={(value) => onFilter('location', value)}
        options={locations.map(loc => ({ label: loc, value: loc }))}
      />
      
      <DatePicker 
        placeholder="Start date"
        onChange={(date) => onFilter('startDate', date)}
      />
      
      <Button 
        icon={<ReloadOutlined />}
        onClick={onReset}
      >
        Reset
      </Button>
    </Space>
  );
}
```

### Empty State

Empty state to display when there's no data:

```tsx
import { Empty, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { theme } from '../lib/theme';

function EmptyState({ 
  title = 'No data found', 
  description = 'There is no data to display.',
  buttonText,
  onButtonClick
}) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
      background: theme.colors.background.card,
      borderRadius: theme.borderRadius.lg,
      border: `1px solid ${theme.colors.border.light}`,
      minHeight: '300px'
    }}>
      <Empty 
        description={
          <div>
            <div style={{ 
              fontSize: theme.typography.fontSizes.lg,
              fontWeight: theme.typography.fontWeights.medium,
              marginBottom: theme.spacing.sm
            }}>
              {title}
            </div>
            <div style={{ color: theme.colors.text.secondary }}>
              {description}
            </div>
          </div>
        } 
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
      
      {buttonText && (
        <Button 
          type="primary"
          icon={<PlusOutlined />}
          onClick={onButtonClick}
          style={{ marginTop: theme.spacing.md }}
        >
          {buttonText}
        </Button>
      )}
    </div>
  );
}
```

## Form Components

### Form with Validation

Example of a form with validation:

```tsx
import { Form, Input, Select, Button, DatePicker, Space } from 'antd';
import { theme } from '../lib/theme';

function EmployeeForm({ onSubmit, initialValues = {}, departments = [] }) {
  const [form] = Form.useForm();
  
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
    >
      <Form.Item
        name="name"
        label="Full Name"
        rules={[{ required: true, message: 'Please enter the employee name' }]}
      >
        <Input placeholder="Enter full name" />
      </Form.Item>
      
      <Form.Item
        name="email"
        label="Email Address"
        rules={[
          { required: true, message: 'Please enter the email address' },
          { type: 'email', message: 'Please enter a valid email address' }
        ]}
      >
        <Input placeholder="Enter email address" />
      </Form.Item>
      
      <Form.Item
        name="position"
        label="Position"
        rules={[{ required: true, message: 'Please enter the position' }]}
      >
        <Input placeholder="Enter position" />
      </Form.Item>
      
      <Form.Item
        name="department"
        label="Department"
        rules={[{ required: true, message: 'Please select a department' }]}
      >
        <Select 
          placeholder="Select department"
          options={departments.map(dept => ({ label: dept, value: dept }))}
        />
      </Form.Item>
      
      <Form.Item
        name="startDate"
        label="Start Date"
      >
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>
      
      <Form.Item
        name="status"
        label="Status"
        initialValue="active"
      >
        <Select
          options={[
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'On Leave', value: 'on_leave' },
            { label: 'Pending', value: 'pending' }
          ]}
        />
      </Form.Item>
      
      <Form.Item>
        <Space>
          <Button 
            type="primary" 
            htmlType="submit"
          >
            Save Employee
          </Button>
          <Button 
            onClick={() => form.resetFields()}
          >
            Reset
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
```

## Navigation Components

### Tabs

Example of using tabs:

```tsx
import { Tabs } from 'antd';
import { theme } from '../lib/theme';

function DocumentTabs({ activeTab, onChange, document }) {
  return (
    <Tabs
      activeKey={activeTab}
      onChange={onChange}
      items={[
        {
          key: 'overview',
          label: 'Overview',
          children: <DocumentOverviewTab document={document} />
        },
        {
          key: 'versions',
          label: 'Versions',
          children: <DocumentVersionsTab document={document} />
        },
        {
          key: 'comments',
          label: 'Comments',
          children: <DocumentCommentsTab document={document} />
        },
        {
          key: 'activity',
          label: 'Activity',
          children: <DocumentActivityTab document={document} />
        }
      ]}
    />
  );
}
```

### Page Header with Actions

Page header with action buttons:

```tsx
import { PageHeader, Button, Space, Dropdown } from 'antd';
import { 
  DownloadOutlined, 
  EditOutlined, 
  EllipsisOutlined,
  PrinterOutlined,
  ShareAltOutlined 
} from '@ant-design/icons';
import { theme } from '../lib/theme';

function DocumentHeader({ document, onEdit, onDownload, onShare }) {
  const moreMenuItems = [
    {
      key: 'print',
      label: 'Print Document',
      icon: <PrinterOutlined />
    },
    {
      key: 'archive',
      label: 'Archive Document',
      icon: <FolderOutlined />
    },
    {
      key: 'delete',
      label: 'Delete Document',
      icon: <DeleteOutlined />,
      danger: true
    }
  ];
  
  return (
    <PageHeader
      title={document.title}
      subTitle={`Last updated: ${new Date(document.updatedAt).toLocaleDateString()}`}
      tags={<StatusTag status={document.status} />}
      extra={[
        <Button 
          key="download" 
          icon={<DownloadOutlined />}
          onClick={onDownload}
        >
          Download
        </Button>,
        <Button 
          key="edit" 
          icon={<EditOutlined />}
          onClick={onEdit}
        >
          Edit
        </Button>,
        <Button 
          key="share" 
          type="primary" 
          icon={<ShareAltOutlined />}
          onClick={onShare}
        >
          Share
        </Button>,
        <Dropdown 
          key="more" 
          menu={{ items: moreMenuItems }} 
          placement="bottomRight"
        >
          <Button icon={<EllipsisOutlined />} />
        </Dropdown>
      ]}
    />
  );
}
```

## Feedback Components

### Loading States

Example loading states:

```tsx
import { Skeleton, Card, Space } from 'antd';
import { theme } from '../lib/theme';

function EmployeeCardSkeleton({ count = 1 }) {
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {Array.from({ length: count }).map((_, i) => (
        <Card
          key={i}
          style={{
            borderRadius: theme.borderRadius.lg,
            boxShadow: theme.shadows.sm,
            border: `1px solid ${theme.colors.border.light}`
          }}
        >
          <Skeleton avatar paragraph={{ rows: 3 }} active />
        </Card>
      ))}
    </Space>
  );
}
```

### Error State

Error state display:

```tsx
import { Result, Button } from 'antd';
import { theme } from '../lib/theme';

function ErrorState({ 
  title = 'Something went wrong', 
  subTitle = 'We encountered an error while loading the data.',
  onRetry
}) {
  return (
    <Result
      status="error"
      title={title}
      subTitle={subTitle}
      extra={[
        <Button 
          type="primary" 
          key="retry" 
          onClick={onRetry}
        >
          Try Again
        </Button>
      ]}
    />
  );
}
```

## Best Practices

1. **Consistent Styling**: Always use the theme tokens for colors, spacing, shadows, etc. to maintain consistency.

2. **Component Composition**: Build complex components by composing simpler Ant Design components.

3. **Responsive Design**: Ensure all components work well on different screen sizes.

4. **State Management**: Use appropriate React hooks for state management within components.

5. **Error Handling**: Always include error states and loading states for components that fetch data.

6. **Accessibility**: Follow accessibility best practices, including proper contrast ratios, keyboard navigation, and ARIA attributes.

7. **Performance**: Optimize components for performance, using memoization where appropriate.

These examples demonstrate how to implement the BlueEarth Capital design system using Ant Design components, ensuring a consistent, professional UI throughout the application.