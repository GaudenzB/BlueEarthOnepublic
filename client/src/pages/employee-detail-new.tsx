import React, { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Employee } from "@shared/schema";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { 
  Badge 
} from "@/components/ui/badge";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Building, 
  // Calendar removed - unused
  FileText, 
  // Loader2 removed - unused
  Mail, 
  MapPin, 
  Phone, 
  RefreshCw,
  User,
  Briefcase,
  // DollarSign removed - unused
  // Lock removed - unused
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { httpClient, ApiResponse } from "@/lib/httpClient"; // Removed unused ApiError import
import { usePermissionsContext } from "@/contexts/PermissionsContext";
// Removed unused LoadingState import

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { hasPermissionCached } = usePermissionsContext();

  // Auth token check is handled by the auth context - removing unused token variable
  
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
  }, [id, refetch, refreshData]);

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      case 'on_leave':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-100';
      case 'remote':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  // Get formatted status text
  const getStatusText = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  };

  // Get employee initials
  const getInitials = (name: string | undefined): string => {
    if (!name) return 'N/A';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  // Navigation back to directory
  const goBack = () => {
    setLocation(ROUTES.HOME);
  };

  // If the page is loading, show a loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={goBack}
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="md:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <div className="h-24 w-24 rounded-full bg-gray-200 animate-pulse mb-4"></div>
                <div className="h-6 w-36 bg-gray-200 animate-pulse mb-2"></div>
                <div className="h-4 w-28 bg-gray-200 animate-pulse mb-4"></div>
                <div className="h-6 w-16 bg-gray-200 animate-pulse mb-6"></div>
                <div className="space-y-4 w-full">
                  <div className="h-5 w-full bg-gray-200 animate-pulse"></div>
                  <div className="h-5 w-full bg-gray-200 animate-pulse"></div>
                  <div className="h-5 w-full bg-gray-200 animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <div className="h-10 w-full bg-gray-200 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-6 w-1/3 bg-gray-200 animate-pulse"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-gray-200 animate-pulse"></div>
                      <div className="h-6 w-40 bg-gray-200 animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-gray-200 animate-pulse"></div>
                      <div className="h-6 w-40 bg-gray-200 animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-gray-200 animate-pulse"></div>
                      <div className="h-6 w-40 bg-gray-200 animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-gray-200 animate-pulse"></div>
                      <div className="h-6 w-40 bg-gray-200 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // If there's an error or no employee data, show error state
  if (error || !employee) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={goBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
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
          <CardContent className="flex justify-center">
            <Button
              onClick={goBack}
              variant="default"
            >
              Return to Directory
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format avatar URL properly
  const avatarUrl = employee.avatarUrl?.startsWith('//') 
    ? `https:${employee.avatarUrl}` 
    : employee.avatarUrl;

  // Format department name
  const formattedDepartment = employee.department
    ? employee.department.charAt(0).toUpperCase() + employee.department.slice(1).replace(/_/g, ' ')
    : 'Not specified';

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={goBack}
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Directory
        </Button>
        
        <Button
          variant="outline"
          onClick={refreshData}
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
            <div className="mx-auto">
              <Avatar className="h-32 w-32 mx-auto">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={employee.name || 'Employee'} />}
                <AvatarFallback className="text-2xl bg-blue-50">
                  {getInitials(employee.name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="mt-4">{employee.name || 'Unknown'}</CardTitle>
            <CardDescription>{employee.position || 'No position'}</CardDescription>
            <Badge 
              variant="outline"
              className={`mt-2 ${getStatusColor(employee.status || 'inactive')}`}
            >
              {getStatusText(employee.status || 'inactive')}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employee.email && (
                <div className="flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-gray-500" />
                  <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline">
                    {employee.email}
                  </a>
                </div>
              )}
              {employee.phone && (
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-gray-500" />
                  <a href={`tel:${employee.phone}`} className="text-blue-600 hover:underline">
                    {employee.phone}
                  </a>
                </div>
              )}
              {employee.location && (
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{employee.location}</span>
                </div>
              )}
              {employee.department && (
                <div className="flex items-center">
                  <Building className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{formattedDepartment}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details Card with Tabs */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="overview" className="flex-1">
                    <User className="h-4 w-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="responsibilities" className="flex-1">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Responsibilities
                  </TabsTrigger>
                  {hasPermissionCached('hr', 'view') && (
                    <TabsTrigger value="documents" className="flex-1">
                      <FileText className="h-4 w-4 mr-2" />
                      Documents
                    </TabsTrigger>
                  )}
                </TabsList>

                <CardContent className="px-0 pt-4">
                  <TabsContent value="overview" className="mt-0 space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Employee Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                        <div>
                          <p className="text-sm text-muted-foreground">Full Name</p>
                          <p className="font-medium">{employee.name || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Position</p>
                          <p className="font-medium">{employee.position || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Department</p>
                          <p className="font-medium">{formattedDepartment}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <div className="font-medium flex items-center">
                            <Badge 
                              variant="outline"
                              className={getStatusColor(employee.status || 'inactive')}
                            >
                              {getStatusText(employee.status || 'inactive')}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Location</p>
                          <p className="font-medium">{employee.location || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">
                            <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline">
                              {employee.email || 'Not specified'}
                            </a>
                          </p>
                        </div>
                        {employee.phone && (
                          <div>
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <p className="font-medium">
                              <a href={`tel:${employee.phone}`} className="text-blue-600 hover:underline">
                                {employee.phone}
                              </a>
                            </p>
                          </div>
                        )}
                        {employee.updatedAt && (
                          <div>
                            <p className="text-sm text-muted-foreground">Last Updated</p>
                            <p className="font-medium">
                              {new Date(employee.updatedAt).toLocaleDateString('en-US', {
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="responsibilities" className="mt-0 space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Responsibilities</h3>
                      {employee.responsibilities ? (
                        <div className="prose max-w-none">
                          <p>{employee.responsibilities}</p>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          <p>No responsibilities information available</p>
                        </div>
                      )}
                    </div>
                    
                    {employee.bio && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Bio</h3>
                        <div className="prose max-w-none">
                          <p>{employee.bio}</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {hasPermissionCached('hr', 'view') && (
                    <TabsContent value="documents" className="mt-0">
                      <div className="text-center py-12 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="mb-4">No employee documents available</p>
                        <Button variant="outline" disabled>
                          Upload Document
                        </Button>
                      </div>
                    </TabsContent>
                  )}
                </CardContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}