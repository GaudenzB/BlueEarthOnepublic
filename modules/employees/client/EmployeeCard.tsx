import React from "react"
import { Link } from "wouter"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Building, MapPin, Mail, User, MessageSquare } from "lucide-react"
import { Employee } from "@blueearth/core/schemas"
import { ROUTES } from "@blueearth/core/utils"

const statusColors: Record<string, { variant: "success" | "warning" | "danger" | "default", dot: string }> = {
  ACTIVE: { variant: "success", dot: "bg-green-500" },
  ON_LEAVE: { variant: "warning", dot: "bg-amber-500" },
  TERMINATED: { variant: "danger", dot: "bg-red-500" },
  INACTIVE: { variant: "default", dot: "bg-gray-500" },
  CONTRACT: { variant: "warning", dot: "bg-purple-500" },
  INTERN: { variant: "default", dot: "bg-blue-500" }
}

interface EmployeeCardProps {
  employee: Employee
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  const firstName = employee.firstName || '';
  const lastName = employee.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  
  const initials = firstName && lastName 
    ? `${firstName[0]}${lastName[0]}` 
    : (firstName.substring(0, 2) || 'N/A');
  
  const statusKey = employee.status?.toUpperCase() || 'INACTIVE';
  const statusConfig = statusColors[statusKey] || statusColors['INACTIVE'];
  const formattedStatus = statusKey.replace('_', ' ');
  
  return (
    <Card className="overflow-hidden border border-border hover:shadow-md transition-shadow duration-300">
      <Link href={ROUTES.EMPLOYEE_DETAIL(employee.id)} className="block cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center">
            <Avatar className="h-12 w-12">
              {employee.profileImage && <AvatarImage src={employee.profileImage} alt={fullName} />}
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
            {employee.city && (
              <div className="flex items-center text-sm">
                <MapPin className="text-muted-foreground h-4 w-4 mr-2" />
                <span>{employee.city}</span>
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