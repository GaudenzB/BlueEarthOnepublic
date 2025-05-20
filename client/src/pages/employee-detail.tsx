import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Employee } from "@shared/schema";
import { 
  Card, 
  Avatar, 
  Button, 
  Skeleton, 
  Tabs, 
  Tag,
  Typography, 
  Space,
  Empty,
  Alert,
  Descriptions
} from "antd";
import { 
  ArrowLeftOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  BankOutlined,
  UserOutlined
} from "@ant-design/icons";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { PermissionGuard } from "@/components/permissions/PermissionGuard";
import { ROUTES } from "@/lib/routes";

const { Title, Text, Paragraph } = Typography;

// Utility functions for employee status
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active': return 'green';
    case 'inactive': return 'red';
    case 'pending': return 'orange';
    default: return 'gray';
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'active': return 'Active';
    case 'inactive': return 'Inactive';
    case 'pending': return 'Pending';
    default: return 'Unknown';
  }
};

/**
 * Employee detail page component
 * Displays detailed information about an employee
 */
export default function EmployeeDetail() {
  // Get employee ID from URL
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTabKey, setActiveTabKey] = useState<string>("1");
  const { hasPermissionCached } = usePermissionsContext();
  
  // Check permissions
  const canView = hasPermissionCached("employees", "view");
  const canEdit = hasPermissionCached("employees", "edit");
  
  // Fetch employee data using query
  const { 
    data: employee, 
    isLoading, 
    error 
  } = useQuery<Employee>({
    queryKey: [`/api/employees/${id}`],
    enabled: !!id && canView === true
  });
  
  // Handle the back button click
  const handleBackClick = () => {
    navigate(ROUTES.EMPLOYEES.LIST);
  };
  
  // Render the employee details when data is loaded
  const renderEmployeeDetails = () => {
    if (isLoading) {
      return (
        <Card>
          <Skeleton active avatar paragraph={{ rows: 4 }} />
        </Card>
      );
    }
    
    if (error) {
      return (
        <Alert
          message="Error Loading Employee"
          description="There was a problem loading the employee details. Please try again later."
          type="error"
          showIcon
        />
      );
    }
    
    if (!employee) {
      return (
        <Alert
          message="Employee Not Found"
          description="The requested employee could not be found."
          type="warning"
          showIcon
        />
      );
    }
    
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Button type="default" onClick={handleBackClick} icon={<ArrowLeftOutlined />}>
            Back to Employees
          </Button>
        </div>
        
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
            <Avatar 
              size={64} 
              src={employee.avatarUrl || undefined}
              icon={!employee.avatarUrl ? <UserOutlined /> : undefined}
            />
            <div style={{ marginLeft: 16 }}>
              <Title level={3} style={{ margin: 0 }}>{employee.name}</Title>
              <Text type="secondary">{employee.position}</Text>
              <div style={{ marginTop: 8 }}>
                <Tag color={getStatusColor(employee.status)}>
                  {getStatusText(employee.status)}
                </Tag>
              </div>
            </div>
            {canEdit && (
              <div style={{ marginLeft: 'auto' }}>
                <Button 
                  type="primary"
                  href={`/employee/${employee.id}/edit`}
                >
                  Edit Employee
                </Button>
              </div>
            )}
          </div>
          
          <Tabs defaultActiveKey="1" onChange={setActiveTabKey}>
            <Tabs.TabPane tab="Profile" key="1">
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Email">
                  <Space>
                    <MailOutlined />
                    <a href={`mailto:${employee.email}`}>{employee.email}</a>
                  </Space>
                </Descriptions.Item>
                
                {employee.phone && (
                  <Descriptions.Item label="Phone">
                    <Space>
                      <PhoneOutlined />
                      <a href={`tel:${employee.phone}`}>{employee.phone}</a>
                    </Space>
                  </Descriptions.Item>
                )}
                
                <Descriptions.Item label="Location">
                  <Space>
                    <EnvironmentOutlined />
                    {employee.location}
                  </Space>
                </Descriptions.Item>
                
                <Descriptions.Item label="Department">
                  <Space>
                    <BankOutlined />
                    {employee.department}
                  </Space>
                </Descriptions.Item>
                
                {employee.bio && (
                  <Descriptions.Item label="Bio">
                    <Paragraph>{employee.bio}</Paragraph>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Tabs.TabPane>
            
            <Tabs.TabPane tab="Responsibilities" key="2">
              {employee.responsibilities ? (
                <Paragraph>{employee.responsibilities}</Paragraph>
              ) : (
                <Empty description="No responsibilities information available" />
              )}
            </Tabs.TabPane>
          </Tabs>
        </Card>
      </div>
    );
  };
  
  return (
    <PermissionGuard 
      area="employees"
      permission="view"
      fallback={
        <Alert
          message="Access Restricted"
          description="You don't have permission to view employee details."
          type="error"
          showIcon
        />
      }
    >
      {renderEmployeeDetails()}
    </PermissionGuard>
  );
}