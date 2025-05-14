import React, { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Employee } from "@shared/schema";
import { 
  Card, 
  Avatar, 
  Divider, 
  Button, 
  Skeleton, 
  Tabs, 
  Select, 
  Tag, 
  Result, 
  Empty,
  Space
} from "antd";
import { 
  MailOutlined, 
  PhoneOutlined, 
  EnvironmentOutlined, 
  BankOutlined, 
  ApartmentOutlined, 
  UserOutlined, 
  FileTextOutlined, 
  DollarOutlined, 
  LockOutlined, 
  CalendarOutlined, 
  SyncOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  StopOutlined
} from "@ant-design/icons";
import { colors } from "@/lib/colors";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { PermissionGuard } from "@/components/permissions/PermissionGuard";
import { ROUTES } from "@/lib/routes";
import { httpClient, ApiResponse, ApiError } from "@/lib/httpClient";

const { TabPane } = Tabs;

/**
 * Employee detail page component
 * Displays detailed information about an employee
 */
export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { hasPermissions, hasPermissionCached } = usePermissionsContext();

  // Check if we have an auth token
  const token = localStorage.getItem("token");
  
  // Fetch employee data directly from the single-employee endpoint
  const { 
    data: apiResponse, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ["employee", id], 
    queryFn: () => httpClient.get<Employee>(`/api/employees/${id}`),
    enabled: Boolean(id), 
    refetchOnMount: true,
    staleTime: 0,
    retry: 3,
    retryDelay: 1000,
  });
  
  // Extract employee from response
  const employee = apiResponse?.data as Employee | undefined;
  
  // Force refresh function
  const refreshData = () => {
    if (id) refetch();
  };
  
  // Effect to refresh data when component mounts or id changes
  useEffect(() => {
    refreshData();
  }, [id, refetch]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { 
          color: "success", 
          icon: <CheckCircleOutlined />, 
          text: 'Active' 
        };
      case 'inactive':
        return { 
          color: "default", 
          icon: <StopOutlined />, 
          text: 'Inactive' 
        };
      case 'on_leave':
        return { 
          color: "warning", 
          icon: <ClockCircleOutlined />, 
          text: 'On Leave' 
        };
      case 'remote':
        return { 
          color: "processing", 
          icon: <GlobalOutlined />, 
          text: 'Remote' 
        };
      default:
        return { 
          color: "default", 
          icon: <StopOutlined />, 
          text: 'Unknown' 
        };
    }
  };

  const goBack = () => {
    setLocation(ROUTES.HOME);
  };

  // Loading state (detail)
  if (isLoading || !employee) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button
            type="link"
            onClick={goBack}
            className="mr-4 flex items-center px-0"
          >
            <ArrowLeftOutlined className="mr-2" />
            Back
          </Button>
          <Skeleton.Input active style={{ width: 180 }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="md:col-span-1">
            <div className="px-6 pt-6 pb-4 text-center">
              <Skeleton.Avatar active size={128} shape="circle" style={{ margin: '0 auto' }} />
              <Skeleton.Input active size="small" style={{ width: 150, margin: '12px auto 4px' }} />
              <Skeleton.Input active size="small" style={{ width: 100, margin: '0 auto' }} />
            </div>
            <div className="px-6 py-4">
              <Skeleton active paragraph={{ rows: 3 }} title={false} />
            </div>
          </Card>
          <div className="md:col-span-3">
            <Card>
              <div className="px-6 pt-6 pb-2">
                <div className="flex justify-end items-center">
                  <Skeleton.Button active size="small" shape="default" style={{ width: 300 }} />
                </div>
              </div>
              <div className="px-6 py-4">
                <Skeleton active paragraph={{ rows: 8 }} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Button 
          type="link" 
          onClick={goBack} 
          className="mb-6 flex items-center px-0"
        >
          <ArrowLeftOutlined className="mr-2" />
          Back to Directory
        </Button>
        
        <Result
          status="error"
          title="Error Loading Employee"
          subTitle="There was an error loading the employee information. Please try refreshing."
          extra={[
            <Button 
              key="retry" 
              type="primary" 
              onClick={refreshData}
              style={{ backgroundColor: colors.primary.base }}
            >
              Retry
            </Button>
          ]}
        />
      </div>
    );
  }

  // No token (authentication error)
  if (!token) {
    return (
      <div className="container mx-auto p-6">
        <Button 
          type="link" 
          onClick={goBack} 
          className="mb-6 flex items-center px-0"
        >
          <ArrowLeftOutlined className="mr-2" />
          Back to Directory
        </Button>
        
        <Result
          status="warning"
          title="Authentication Error"
          subTitle="You need to be logged in to view employee details. Please log in and try again."
          extra={[
            <Button 
              key="return" 
              type="primary" 
              onClick={goBack}
              style={{ backgroundColor: colors.primary.base }}
            >
              Return to Directory
            </Button>
          ]}
        />
      </div>
    );
  }

  // API error or no employee data
  if (error || !apiResponse || !employee) {
    return (
      <div className="container mx-auto p-6">
        <Button 
          type="link" 
          onClick={goBack} 
          className="mb-6 flex items-center px-0"
        >
          <ArrowLeftOutlined className="mr-2" />
          Back to Directory
        </Button>
        
        <Result
          status="error"
          title="Error"
          subTitle={
            !apiResponse 
              ? "Could not load employee data. The employee may not exist or there was a server error."
              : (apiResponse as ApiResponse<Employee>).message || "Server returned an error response"
          }
          extra={[
            <Button 
              key="return" 
              type="primary" 
              onClick={goBack}
              style={{ backgroundColor: colors.primary.base }}
            >
              Return to Directory
            </Button>
          ]}
        />
      </div>
    );
  }

  // Deleted state
  if (employee.status === 'deleted') {
    return (
      <div className="container mx-auto p-6">
        <Button 
          type="link" 
          onClick={goBack} 
          className="mb-6 flex items-center px-0"
        >
          <ArrowLeftOutlined className="mr-2" />
          Back to Directory
        </Button>
        
        <Result
          status="warning"
          title="Employee No Longer Available"
          subTitle={
            <>
              This employee record has been deleted or archived.
              {hasPermissions(['admin', 'hr']) && (
                <p className="mt-2">As an admin, you can still view the archived information below.</p>
              )}
            </>
          }
          extra={[
            <Button 
              key="return" 
              type="primary" 
              onClick={goBack}
              style={{ backgroundColor: colors.primary.base }}
            >
              Return to Directory
            </Button>
          ]}
        />
      </div>
    );
  }

  // Get status configuration
  const statusConfig = getStatusConfig(employee.status || 'inactive');

  // Main content render
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <Button
          type="link"
          onClick={goBack}
          className="mr-4 flex items-center px-0"
        >
          <ArrowLeftOutlined className="mr-2" />
          Back to Directory
        </Button>
        
        <Button
          type="default"
          onClick={refreshData}
          className="flex items-center"
          icon={<SyncOutlined />}
        >
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <div className="px-6 pt-6 pb-4 text-center">
            <Avatar
              size={128}
              src={employee.avatarUrl || undefined}
              className="mx-auto"
              style={{ display: 'block', margin: '0 auto 16px' }}
            >
              {employee.name 
                ? employee.name
                    .split(' ')
                    .map(part => part.charAt(0) || '')
                    .join('')
                : 'EM'
              }
            </Avatar>
            <h3 className="text-lg font-medium mb-1">{employee.name || 'Unknown'}</h3>
            <p className="text-gray-500 mb-2">{employee.position || 'No position'}</p>
            <Tag 
              color={statusConfig.color as any} 
              icon={statusConfig.icon}
              className="mx-auto"
            >
              {statusConfig.text}
            </Tag>
          </div>
          
          <Divider style={{ margin: '0 16px 16px' }} />
          
          <div className="px-6 pb-6">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {employee.email && (
                <div className="flex items-center">
                  <MailOutlined className="text-gray-500 mr-2" />
                  <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline">
                    {employee.email}
                  </a>
                </div>
              )}
              
              {employee.phone && (
                <div className="flex items-center">
                  <PhoneOutlined className="text-gray-500 mr-2" />
                  <a href={`tel:${employee.phone}`} className="text-blue-600 hover:underline">
                    {employee.phone}
                  </a>
                </div>
              )}
              
              {employee.location && (
                <div className="flex items-center">
                  <EnvironmentOutlined className="text-gray-500 mr-2" />
                  <span>{employee.location}</span>
                </div>
              )}
              
              {employee.department && (
                <div className="flex items-center">
                  <ApartmentOutlined className="text-gray-500 mr-2" />
                  <span>{employee.department}</span>
                </div>
              )}
            </Space>
          </div>
        </Card>

        {/* Details Card with Tabs */}
        <div className="md:col-span-3">
          <Card>
            <Tabs defaultActiveKey="business" className="w-full">
              {/* Business info tab - visible to everyone */}
              <TabPane 
                tab={
                  <span>
                    <ApartmentOutlined />
                    Business Info
                  </span>
                } 
                key="business"
              >
                <div className="px-6 py-4">
                  <h3 className="text-lg font-medium mb-4">Position Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Job Title</p>
                      <p className="font-medium">{employee.position || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Department</p>
                      <p className="font-medium">{employee.department || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <Divider />
                  
                  <h3 className="text-lg font-medium mb-4">Responsibilities</h3>
                  <p className="mb-6">
                    {employee.responsibilities || 'No responsibilities listed for this employee.'}
                  </p>
                  
                  <Divider />
                  
                  <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Email</p>
                      <p className="font-medium">{employee.email || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Phone</p>
                      <p className="font-medium">{employee.phone || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </TabPane>
              
              {/* HR tabs - only visible with HR permission */}
              {hasPermissionCached('hr', 'view') && (
                <>
                  <TabPane 
                    tab={
                      <span>
                        <UserOutlined />
                        Personal Info
                      </span>
                    } 
                    key="personal"
                  >
                    <div className="px-6 py-4">
                      <Empty 
                        description="Personal information is not available or requires additional permissions." 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    </div>
                  </TabPane>
                  
                  <TabPane 
                    tab={
                      <span>
                        <FileTextOutlined />
                        Documents
                      </span>
                    } 
                    key="documents"
                  >
                    <div className="px-6 py-4">
                      <Empty 
                        description="Document information is not available or requires additional permissions." 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    </div>
                  </TabPane>
                  
                  <TabPane 
                    tab={
                      <span>
                        <DollarOutlined />
                        Compensation
                      </span>
                    } 
                    key="compensation"
                  >
                    <div className="px-6 py-4">
                      <Empty 
                        description="Compensation information is not available or requires additional permissions." 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    </div>
                  </TabPane>
                  
                  <TabPane 
                    tab={
                      <span>
                        <LockOutlined />
                        Permissions
                      </span>
                    } 
                    key="permissions"
                  >
                    <div className="px-6 py-4">
                      <Empty 
                        description="Permissions information is not available or requires additional permissions." 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    </div>
                  </TabPane>
                  
                  <TabPane 
                    tab={
                      <span>
                        <CalendarOutlined />
                        On-/Offboarding
                      </span>
                    } 
                    key="onboarding"
                  >
                    <div className="px-6 py-4">
                      <Empty 
                        description="Onboarding information is not available or requires additional permissions." 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    </div>
                  </TabPane>
                </>
              )}
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}