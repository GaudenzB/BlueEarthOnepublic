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
  const [activeTab, setActiveTab] = useState<string>("1");
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
          
          <Tabs defaultActiveKey="1" onChange={setActiveTab}>
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
        };
    }
  };

  const goBack = () => {
    setLocation(ROUTES.HOME);
  };

  if (isLoading) {
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

  // Log any errors for debugging
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
            variant="ghost"
            onClick={goBack}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Authentication Error</CardTitle>
            <CardDescription>
              You need to be logged in to view employee details. Please log in and try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={goBack}
              style={{ backgroundColor: colors.primary.base }}
            >
              Return to Directory
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !apiResponse || !employee) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={goBack}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              {!apiResponse 
                ? "Could not load employee data. The employee may not exist or there was a server error."
                : (apiResponse as ApiResponse<Employee>).message || "Server returned an error response"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={goBack}
              style={{ backgroundColor: colors.primary.base }}
            >
              Return to Directory
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={goBack}
          className="mr-4"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Directory
        </Button>
        
        <Button
          variant="outline"
          onClick={() => refreshData()}
          className="flex items-center"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="h-32 w-32 mx-auto">
              {employee?.avatarUrl && <AvatarImage src={employee.avatarUrl} alt={employee?.name || 'Employee'} />}
              <AvatarFallback className="text-2xl">
                {employee?.name 
                  ? employee.name
                      .split(' ')
                      .map((part: string) => part.charAt(0) || '')
                      .join('')
                  : 'EM'
                }
              </AvatarFallback>
            </Avatar>
            <CardTitle className="mt-4">{employee?.name || 'Unknown'}</CardTitle>
            <CardDescription>{employee?.position || 'No position'}</CardDescription>
            <Badge 
              className={`mt-2 ${getStatusColor(employee?.status || 'inactive')}`}
            >
              {getStatusText(employee?.status || 'inactive')}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employee?.email && (
                <div className="flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-gray-500" />
                  <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline">
                    {employee.email}
                  </a>
                </div>
              )}
              {employee?.phone && (
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-gray-500" />
                  <a href={`tel:${employee.phone}`} className="text-blue-600 hover:underline">
                    {employee.phone}
                  </a>
                </div>
              )}
              {employee?.location && (
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{employee.location}</span>
                </div>
              )}
              {employee?.department && (
                <div className="flex items-center">
                  <Building className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{employee.department}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details Card with Tabs */}
        <div className="md:col-span-3">
          <Tabs defaultValue="business" className="w-full">
            <Card>
              {hasPermissionCached('hr', 'view') ? (
                <CardHeader>
                  <div className="flex justify-center items-center">
                    <>
                      {/* Desktop Tabs with multiple options - Hidden on small screens */}
                      <TabsList className="hidden md:flex">
                        {/* Business info tab - visible to everyone */}
                        <TabsTrigger value="business">
                          <Briefcase className="h-4 w-4 mr-1" />
                          Business Info
                        </TabsTrigger>
                        
                        {/* HR tabs */}
                        <TabsTrigger value="personal">
                          <User className="h-4 w-4 mr-1" />
                          Personal Info
                        </TabsTrigger>
                        <TabsTrigger value="documents">
                          <FileText className="h-4 w-4 mr-1" />
                          Documents
                        </TabsTrigger>
                        <TabsTrigger value="compensation">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Compensation
                        </TabsTrigger>
                        <TabsTrigger value="permissions">
                          <Lock className="h-4 w-4 mr-1" />
                          Permissions
                        </TabsTrigger>
                        <TabsTrigger value="onboarding">
                          <Calendar className="h-4 w-4 mr-1" />
                          On-/Offboarding
                        </TabsTrigger>
                      </TabsList>
                      
                      {/* Mobile Dropdown with multiple options - Visible only on small screens */}
                      <div className="md:hidden w-full">
                        <Select 
                          defaultValue="business" 
                          onValueChange={(value) => {
                            // Find the TabsTrigger for this value and click it
                            const tab = document.querySelector(`button[data-value="${value}"]`) as HTMLElement;
                            if (tab) tab.click();
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select section" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* All options */}
                            <SelectItem value="business">
                              <div className="flex items-center">
                                <Briefcase className="h-4 w-4 mr-2" />
                                <span>Business Info</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="personal">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                <span>Personal Info</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="documents">
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-2" />
                                <span>Documents</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="compensation">
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-2" />
                                <span>Compensation</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="permissions">
                              <div className="flex items-center">
                                <Lock className="h-4 w-4 mr-2" />
                                <span>Permissions</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="onboarding">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>On-/Offboarding</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  </div>
                </CardHeader>
              ) : null}
              <CardContent className={hasPermissionCached('hr', 'view') ? "" : "pt-6"}>
                {/* Business Info Tab */}
                <TabsContent value="business" className="space-y-6 mt-0">
                  <div>
                    <h3 className="text-lg font-medium">Position & Department</h3>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Job Title</p>
                        <p className="font-medium">{employee?.position || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Department</p>
                        <p className="font-medium">{employee?.department || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium">{employee?.location || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p className="font-medium">{getStatusText(employee?.status || 'inactive')}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium">Responsibilities</h3>
                    <p className="mt-2 text-gray-600">
                      {employee ? 
                        `As a ${employee?.position || 'team member'} in the ${employee?.department || 'company'} department, ${employee?.responsibilities || 'this employee is responsible for managing departmental tasks and collaborating with team members to achieve company goals.'}` 
                        : 'No responsibility information available.'
                      }
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium">Business Contact</h3>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {employee?.email && (
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{employee?.email || 'Not provided'}</p>
                        </div>
                      )}
                      {employee?.phone && (
                        <div>
                          <p className="text-sm text-gray-500">Business Phone</p>
                          <p className="font-medium">{employee?.phone || 'Not provided'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Personal Info Tab */}
                <TabsContent value="personal" className="space-y-6 mt-0">
                  <PermissionGuard area="hr" permission="view" showAlert={false}>
                    <div>
                      <h3 className="text-lg font-medium">Personal Details</h3>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Full Name</p>
                          <p className="font-medium">{employee?.name || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Personal Email</p>
                          <p className="font-medium">{employee?.email || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{employee?.phone || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="font-medium">{employee?.location || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium">Bio</h3>
                      <p className="mt-2 text-gray-600">
                        {employee?.bio || 'No bio information available for this employee.'}
                      </p>
                    </div>
                  </PermissionGuard>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-6 mt-0">
                  <PermissionGuard area="hr" permission="view" showAlert={false}>
                    <div className="text-center py-10">
                      <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium">No Documents Available</h3>
                      <p className="text-gray-500 mt-2">
                        There are no documents uploaded for this employee yet.
                      </p>
                    </div>
                  </PermissionGuard>
                </TabsContent>

                {/* Compensation Tab */}
                <TabsContent value="compensation" className="space-y-6 mt-0">
                  <PermissionGuard area="hr" permission="view" showAlert={false}>
                    <div className="text-center py-10">
                      <DollarSign className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium">Compensation Information</h3>
                      <p className="text-gray-500 mt-2">
                        Compensation details are not available in this view.
                        Contact HR for more information.
                      </p>
                    </div>
                  </PermissionGuard>
                </TabsContent>

                {/* Permissions Tab */}
                <TabsContent value="permissions" className="space-y-6 mt-0">
                  <PermissionGuard area="hr" permission="view" showAlert={false}>
                    <div className="text-center py-10">
                      <Lock className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium">Access Permissions</h3>
                      <p className="text-gray-500 mt-2">
                        System and application access permissions are not available in this view.
                        Contact the IT department for more information.
                      </p>
                    </div>
                  </PermissionGuard>
                </TabsContent>

                {/* On-/Offboarding Tab */}
                <TabsContent value="onboarding" className="space-y-6 mt-0">
                  <PermissionGuard area="hr" permission="view" showAlert={false}>
                    <div className="text-center py-10">
                      <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium">On-/Offboarding Status</h3>
                      <p className="text-gray-500 mt-2">
                        On-/Offboarding information is not available in this view.
                        Contact HR for more information.
                      </p>
                    </div>
                  </PermissionGuard>
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </div>
    </div>
  );
}