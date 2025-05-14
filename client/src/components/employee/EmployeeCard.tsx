import React from "react"
import { Link } from "wouter"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { 
  BankOutlined, 
  EnvironmentOutlined, 
  MailOutlined, 
  UserOutlined, 
  MessageOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  StopOutlined
} from "@ant-design/icons"
import { Tag } from "antd"
import { type Employee } from "@shared/schema"
import { ROUTES } from "@/lib/routes"
import { colors } from "@/lib/colors"

const statusConfig: Record<string, { color: string, icon: React.ReactNode }> = {
  active: { 
    color: "success", 
    icon: <CheckCircleOutlined /> 
  },
  on_leave: { 
    color: "warning", 
    icon: <ClockCircleOutlined /> 
  },
  remote: { 
    color: "processing", 
    icon: <GlobalOutlined /> 
  },
  inactive: { 
    color: "default", 
    icon: <StopOutlined /> 
  }
}

interface EmployeeCardProps {
  employee: Employee
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  // Add null safety for name property
  const nameParts = (employee.name || '').split(' ')
  const initials = nameParts.length > 1 && nameParts[0] && nameParts[nameParts.length - 1]
    ? `${nameParts[0]?.[0] || ''}${nameParts[nameParts.length - 1]?.[0] || ''}` 
    : nameParts[0]?.substring(0, 2) || '??'
  
  // Add null safety for status property
  const status = employee.status || 'inactive'
  const config = statusConfig[status.toLowerCase()] || statusConfig['inactive']
  const formattedStatus = status.replace('_', ' ')
  
  // Safely create the detail URL with id validation
  const getEmployeeDetailUrl = (id: number | undefined) => {
    if (id === undefined) {
      return '/'; // Fallback to home if no ID
    }
    return ROUTES.EMPLOYEES.DETAIL(id);
  };
  
  return (
    <Card className="overflow-hidden border border-border hover:shadow-md transition-all duration-300">
      <Link href={getEmployeeDetailUrl(employee.id)} className="block cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center">
            <Avatar className="h-12 w-12">
              {employee.avatarUrl && <AvatarImage src={employee.avatarUrl} alt={employee.name || 'Employee'} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <h3 className="text-base font-semibold text-foreground">{employee.name || 'Unknown'}</h3>
              <p className="text-sm text-muted-foreground">{employee.position || 'No position'}</p>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center text-sm">
              <BankOutlined className="mr-2 text-muted-foreground" style={{ fontSize: '16px' }} />
              <span>{employee.department 
                ? `${employee.department.charAt(0).toUpperCase()}${employee.department.slice(1)} Department` 
                : 'Unknown Department'}</span>
            </div>
            {employee.location && (
              <div className="flex items-center text-sm">
                <EnvironmentOutlined className="mr-2 text-muted-foreground" style={{ fontSize: '16px' }} />
                <span>{employee.location}</span>
              </div>
            )}
            <div className="flex items-center text-sm">
              <MailOutlined className="mr-2 text-muted-foreground" style={{ fontSize: '16px' }} />
              <span className="truncate">{employee.email || 'No email'}</span>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
            <Tag 
              icon={config?.icon} 
              color={config?.color || "default"}
              className="flex items-center h-6 leading-6"
            >
              {formattedStatus.charAt(0).toUpperCase() + formattedStatus.slice(1)}
            </Tag>
            <div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors" 
                title="View Profile"
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.hover;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <UserOutlined style={{ fontSize: '16px' }} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 ml-1 text-muted-foreground hover:text-foreground transition-colors" 
                title="Send Message"
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.hover;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <MessageOutlined style={{ fontSize: '16px' }} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}