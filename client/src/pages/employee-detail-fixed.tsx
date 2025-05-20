import React from "react";
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
  Divider,
  Typography,
  Space,
  Row,
  Col
} from "antd";
import { 
  ArrowLeftOutlined,
  CheckCircleOutlined,
  StopOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  BankOutlined,
  UserOutlined,
  FileTextOutlined,
  DollarOutlined,
  LockOutlined,
  CalendarOutlined
} from "@ant-design/icons";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { ROUTES } from "@/lib/routes";
import { ApiResponse, ApiError } from "@/lib/httpClient";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// Utility functions for employee status
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'green';
    case 'inactive': return 'red';
    case 'pending': return 'orange';
    default:
      return undefined; // Default fallback case
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return 'Active';
    case 'inactive': return 'Inactive';
    case 'pending': return 'Pending';
    default:
      return undefined; // Default fallback case
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
  
  // Get authentication token
  const token = localStorage.getItem('authToken');
  
  // Fetch employee data
  const { 
    data: apiResponse, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<ApiResponse<Employee>, Error>({
    queryKey: [`/api/employees/${id}`],
    enabled: !!id && !!token,
  });
  
  // Extract employee data from API response
  const employee = apiResponse?.data;
  
  // Get permissions context
  const { hasPermissionCached } = usePermissionsContext();
  
  // Determine if current user can edit employee data
  const canEdit = hasPermissionCached('employees', 'edit') === true;

  // Track active tab
  const [activeTab, setActiveTab] = React.useState("1");
  
  // Navigation helper
  const goBack = () => navigate(ROUTES.EMPLOYEES.LIST);
  
  // Log errors for debugging
  if (error) {
    console.error("Error fetching employee:", error);
    // Detailed error information
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
      // API-specific error information
      if (error instanceof ApiError) {
        console.error("API Error status:", error.status);
        if (error.errors) {
          console.error("API Error details:", error.errors);
        }
      }
    }
  }
  
  // Log API response for debugging
  console.log("Employee API response:", {
    id,
    apiResponse,
    token: !!token,
    isLoading,
    error: !!error
  });

  if (!token) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button
            type="link"
            onClick={goBack}
            icon={<ArrowLeftOutlined />}
          >
            Back
          </Button>
        </div>
        <Card>
          <Skeleton active />
          <Text type="secondary">
            Authentication required. Please log in to view employee details.
          </Text>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button
            type="link"
            onClick={goBack}
            icon={<ArrowLeftOutlined />}
          >
            Back
          </Button>
        </div>
        <Card>
          <Skeleton active avatar paragraph={{ rows: 4 }} />
        </Card>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button
            type="link"
            onClick={goBack}
            icon={<ArrowLeftOutlined />}
          >
            Back
          </Button>
          <Button 
            type="primary"
            onClick={() => refetch()}
            icon={<CheckCircleOutlined />}
            className="ml-4"
          >
            Retry
          </Button>
        </div>
        <Card>
          <div className="text-center p-8">
            <StopOutlined style={{ fontSize: 48, color: 'red', marginBottom: 16 }} />
            <Title level={4}>Error Loading Employee</Title>
            <Paragraph type="secondary">
              {error instanceof Error ? error.message : 'Failed to load employee details'}
            </Paragraph>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <div className="flex justify-between items-center mb-6">
            <Button
              type="link"
              onClick={goBack}
              icon={<ArrowLeftOutlined />}
            >
              Back
            </Button>
            <Space>
              {canEdit && (
                <Button 
                  type="primary"
                  href={`/employee/${id}/edit`}
                >
                  Edit Employee
                </Button>
              )}
            </Space>
          </div>
        </Col>

        <Col span={24} md={8}>
          <Card>
            <div className="flex flex-col items-center text-center mb-4">
              <Avatar 
                size={96} 
                src={employee.avatarUrl} 
                icon={!employee.avatarUrl && <UserOutlined />}
              />
              <Title level={4} className="mt-4 mb-1">{employee.name}</Title>
              <Text type="secondary">{employee.position || 'No position specified'}</Text>
              <div className="mt-2">
                <Tag color={getStatusColor(employee.status)}>
                  {getStatusText(employee.status)}
                </Tag>
              </div>
            </div>
            
            <Divider />
            
            <Space direction="vertical" className="w-full" size="large">
              <div className="flex items-center">
                <MailOutlined className="mr-2" />
                <Text>{employee.email || 'No email specified'}</Text>
              </div>
              
              <div className="flex items-center">
                <PhoneOutlined className="mr-2" />
                <Text>{employee.phone || 'No phone specified'}</Text>
              </div>
              
              <div className="flex items-center">
                <EnvironmentOutlined className="mr-2" />
                <Text>{employee.location || 'No location specified'}</Text>
              </div>
              
              <div className="flex items-center">
                <BankOutlined className="mr-2" />
                <Text>{employee.department || 'No department specified'}</Text>
              </div>
            </Space>
          </Card>
        </Col>

        <Col span={24} md={16}>
          <Card>
            <Tabs 
              defaultActiveKey="1"
              activeKey={activeTab}
              onChange={setActiveTab}
            >
              <TabPane 
                tab={
                  <span>
                    <UserOutlined />
                    Profile
                  </span>
                } 
                key="1"
              >
                <div className="p-4">
                  <Title level={5}>Employee Information</Title>
                  <Divider />
                  
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Text type="secondary">Employee ID</Text>
                      <Paragraph strong>{employee.id}</Paragraph>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">Last Updated</Text>
                      <Paragraph strong>{employee.updatedAt || 'Not specified'}</Paragraph>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">Department</Text>
                      <Paragraph strong>{employee.department || 'Not specified'}</Paragraph>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">Status</Text>
                      <Paragraph>
                        <Tag color={getStatusColor(employee.status)}>
                          {getStatusText(employee.status)}
                        </Tag>
                      </Paragraph>
                    </Col>
                  </Row>
                </div>
              </TabPane>
              
              <TabPane 
                tab={
                  <span>
                    <FileTextOutlined />
                    Documents
                  </span>
                } 
                key="2"
              >
                <div className="p-4">
                  <Title level={5}>Employee Documents</Title>
                  <Divider />
                  
                  {/* Documents tab content would go here */}
                  <Paragraph>No documents available for this employee.</Paragraph>
                </div>
              </TabPane>
              
              <TabPane 
                tab={
                  <span>
                    <DollarOutlined />
                    Compensation
                  </span>
                } 
                key="3"
              >
                <div className="p-4 space-y-4">
                  <Title level={5}>Compensation Information</Title>
                  <Divider />
                  
                  {/* Compensation tab content would go here */}
                  <Paragraph>Compensation details are restricted.</Paragraph>
                </div>
              </TabPane>
              
              <TabPane 
                tab={
                  <span>
                    <LockOutlined />
                    Access
                  </span>
                } 
                key="4"
              >
                <div className="p-4 space-y-4">
                  <Title level={5}>System Access</Title>
                  <Divider />
                  
                  {/* Access tab content would go here */}
                  <Paragraph>System access details are restricted.</Paragraph>
                </div>
              </TabPane>
              
              <TabPane 
                tab={
                  <span>
                    <CalendarOutlined />
                    Time Off
                  </span>
                } 
                key="5"
              >
                <div className="p-4 space-y-4">
                  <Title level={5}>Time Off Information</Title>
                  <Divider />
                  
                  {/* Time off tab content would go here */}
                  <Paragraph>No time off records available.</Paragraph>
                </div>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
}