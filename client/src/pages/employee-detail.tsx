import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Employee } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Mail, Phone, MapPin, SquareUser, Building, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { colors } from "@/lib/colors";

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: employee, isLoading, error } = useQuery<Employee>({
    queryKey: ['/api/employees', id],
    enabled: !!id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'on_leave':
        return 'bg-orange-100 text-orange-800';
      case 'remote':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'on_leave':
        return 'On Leave';
      case 'remote':
        return 'Remote';
      default:
        return 'Unknown';
    }
  };

  const goBack = () => {
    setLocation('/');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={goBack}
            className="mr-4"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-32 w-32 rounded-full mx-auto" />
              <Skeleton className="h-6 w-32 mx-auto mt-4" />
              <Skeleton className="h-4 w-24 mx-auto mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-full" />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-full" />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !employee) {
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
              Could not load employee data. The employee may not exist or there was a server error.
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
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={goBack}
          className="mr-4"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Directory
        </Button>
        <h1 className="text-3xl font-bold">Employee Profile</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader className="text-center">
            <Avatar className="h-32 w-32 mx-auto">
              {employee?.avatarUrl && <AvatarImage src={employee.avatarUrl} alt={employee.name} />}
              <AvatarFallback className="text-2xl">
                {employee?.name ? employee.name.split(' ').map(n => n[0]).join('') : 'EM'}
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

        {/* Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Employee Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">About</h3>
                <p className="mt-2 text-gray-600">
                  {employee?.bio || 'No bio information available for this employee.'}
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium">Responsibilities</h3>
                <p className="mt-2 text-gray-600">
                  {employee ? 
                    `As a ${employee.position || 'team member'} in the ${employee.department || 'company'} department, ${employee.responsibilities || 'this employee is responsible for managing departmental tasks and collaborating with team members to achieve company goals.'}` 
                    : 'No responsibility information available.'
                  }
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium">Contact Information</h3>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employee?.email && (
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{employee.email}</p>
                    </div>
                  )}
                  {employee?.phone && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{employee.phone}</p>
                    </div>
                  )}
                  {employee?.location && (
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{employee.location}</p>
                    </div>
                  )}
                  {employee?.department && (
                    <div>
                      <p className="text-sm text-gray-500">Department</p>
                      <p className="font-medium">{employee.department}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}