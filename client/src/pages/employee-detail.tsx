import React, { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Employee } from "@shared/schema";
import { 
  Card, 
  Avatar, 
  Button, 
  Skeleton, 
  Tabs, 
  Select
  // Removed unused Tag, Result, Empty imports
} from "antd";
import { 
  ArrowLeftOutlined,
  CheckCircleOutlined,
  // Removed other unused icon imports
  ClockCircleOutlined,
  GlobalOutlined,
  StopOutlined
} from "@ant-design/icons";
import { colors } from "@/lib/colors";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { PermissionGuard } from "@/components/permissions/PermissionGuard";
import { ROUTES } from "@/lib/routes";
import { httpClient, ApiResponse, ApiError } from "@/lib/httpClient";

/**
 * Employee detail page component
 * Displays detailed information about an employee
 */
export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { hasPermissionCached } = usePermissionsContext();

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