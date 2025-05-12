import React from "react"
import { Link } from "wouter"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Building, MapPin, Mail, User, MessageSquare } from "lucide-react"
import { type Employee } from "@shared/schema"
import { ROUTES } from "@/lib/routes"

const statusColors: Record<string, { variant: "success" | "warning" | "danger" | "default", dot: string }> = {
  active: { variant: "success", dot: "bg-green-500" },
  on_leave: { variant: "warning", dot: "bg-amber-500" },
  remote: { variant: "danger", dot: "bg-red-500" },
  inactive: { variant: "default", dot: "bg-gray-500" }
}

interface EmployeeCardProps {
  employee: Employee
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  const nameParts = employee.name.split(' ')
  const initials = nameParts.length > 1 && nameParts[0] && nameParts[nameParts.length - 1]
    ? `${nameParts[0]?.[0] || ''}${nameParts[nameParts.length - 1]?.[0] || ''}` 
    : nameParts[0]?.substring(0, 2) || '??'
  
  const statusConfig = statusColors[employee.status] || statusColors['inactive']
  const formattedStatus = employee.status.replace('_', ' ')
  
  return (
    <Card className="overflow-hidden border border-border hover:shadow-md transition-shadow duration-300">
      <Link href={ROUTES.EMPLOYEES.DETAIL(employee.id)} className="block cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center">
            <Avatar className="h-12 w-12">
              {employee.avatarUrl && <AvatarImage src={employee.avatarUrl} alt={employee.name} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <h3 className="text-base font-semibold text-foreground">{employee.name}</h3>
              <p className="text-sm text-muted-foreground">{employee.position}</p>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center text-sm">
              <Building className="text-muted-foreground h-4 w-4 mr-2" />
              <span>{employee.department.charAt(0).toUpperCase() + employee.department.slice(1)} Department</span>
            </div>
            <div className="flex items-center text-sm">
              <MapPin className="text-muted-foreground h-4 w-4 mr-2" />
              <span>{employee.location}</span>
            </div>
            <div className="flex items-center text-sm">
              <Mail className="text-muted-foreground h-4 w-4 mr-2" />
              <span>{employee.email}</span>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-border flex justify-between">
            <Badge variant={statusConfig?.variant || 'default'} className="flex items-center">
              <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${statusConfig?.dot || 'bg-gray-500'}`}></span>
              {formattedStatus.charAt(0).toUpperCase() + formattedStatus.slice(1)}
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