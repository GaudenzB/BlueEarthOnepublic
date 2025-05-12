import React from "react"
import { Link } from "wouter"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Building, MapPin, Mail, User, MessageSquare } from "lucide-react"
import { Employee } from "@blueearth/core/schemas"
import { ROUTES } from "@blueearth/core/utils"

// Define safe status mapping with bracket notation
const statusColors = {
  ['ACTIVE']: { variant: "success" as const, dot: "bg-green-500" },
  ['ON_LEAVE']: { variant: "warning" as const, dot: "bg-amber-500" },
  ['TERMINATED']: { variant: "danger" as const, dot: "bg-red-500" },
  ['INACTIVE']: { variant: "default" as const, dot: "bg-gray-500" },
  ['CONTRACT']: { variant: "warning" as const, dot: "bg-purple-500" },
  ['INTERN']: { variant: "default" as const, dot: "bg-blue-500" },
  ['REMOTE']: { variant: "success" as const, dot: "bg-blue-400" },
  // Default fallback
  ['DEFAULT']: { variant: "default" as const, dot: "bg-gray-500" }
}

interface EmployeeCardProps {
  employee: Employee
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  // Extract first and last name from the name field
  const nameParts = (employee.name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  const fullName = employee.name || '';
  
  // Create initials from name parts
  const initials = nameParts.length > 1
    ? `${nameParts[0][0]}${nameParts[1][0]}`
    : (nameParts[0]?.substring(0, 2) || 'N/A');
  
  // Get status in a type-safe way with fallbacks
  const statusKey = employee.status?.toUpperCase() || 'INACTIVE';
  
  // Use type-safe approach with explicit key checking
  const getStatusConfig = (key: string) => {
    if (key in statusColors) {
      return statusColors[key as keyof typeof statusColors];
    }
    return statusColors['DEFAULT'];
  };
  
  const statusConfig = getStatusConfig(statusKey);
  const formattedStatus = statusKey.replace('_', ' ');
  
  return (
    <Card className="overflow-hidden border border-border hover:shadow-md transition-shadow duration-300">
      <Link href={ROUTES.EMPLOYEE_DETAIL(employee.id)} className="block cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center">
            <Avatar className="h-12 w-12">
              {employee.avatarUrl && <AvatarImage src={employee.avatarUrl} alt={fullName} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <h3 className="text-base font-semibold text-foreground">{fullName}</h3>
              <p className="text-sm text-muted-foreground">{employee.position}</p>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center text-sm">
              <Building className="text-muted-foreground h-4 w-4 mr-2" />
              <span>{employee.department} Department</span>
            </div>
            {employee.location && (
              <div className="flex items-center text-sm">
                <MapPin className="text-muted-foreground h-4 w-4 mr-2" />
                <span>{employee.location}</span>
              </div>
            )}
            <div className="flex items-center text-sm">
              <Mail className="text-muted-foreground h-4 w-4 mr-2" />
              <span>{employee.email}</span>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-border flex justify-between">
            <Badge variant={statusConfig.variant} className="flex items-center">
              <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${statusConfig.dot}`}></span>
              {formattedStatus}
            </Badge>
            <div>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="View Profile">
                <User className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 ml-1" title="Send Message">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}