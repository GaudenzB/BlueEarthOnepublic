import React from "react"
import { EmployeeDirectory } from "@/components/employee/EmployeeDirectory"
import { useQuery } from "@tanstack/react-query"
import { Button, Card, Row, Col, Avatar, Typography, Empty, Space } from "antd"
import { LoadingState, Employee } from "@/components/ui"
import { UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export default function EmployeeDirectoryPage() {
  const { data: employees, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/employees'],
    retry: 1,
  })

  console.log("EmployeeDirectoryPage query results:", { 
    employeesReceived: !!employees, 
    isArray: Array.isArray(employees), 
    count: Array.isArray(employees) ? employees.length : 0,
    sample: Array.isArray(employees) && employees.length > 0 ? employees[0] : null 
  })

  if (isLoading) {
    return <LoadingState size="large" text="Loading employees..." />
  }

  if (error) {
    return (
      <div className="p-6 border rounded-md bg-red-50">
        <h2 className="text-xl font-semibold mb-4 text-red-600">Error Loading Employees</h2>
        <p className="mb-4">{String(error)}</p>
        <Button type="primary" onClick={() => refetch()}>Try Again</Button>
      </div>
    )
  }

  // Simple direct rendering of employees for testing
  if (!Array.isArray(employees) || employees.length === 0) {
    return (
      <>
        <h1 className="text-2xl font-semibold mb-6">Employee Directory</h1>
        <Empty description="No employees found" />
        <div className="mt-4">
          <Button type="primary" onClick={() => refetch()}>Refresh</Button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Employee Directory</h1>
        <Button type="primary" onClick={() => refetch()}>Refresh</Button>
      </div>
      
      {/* Simple grid display of employees */}
      <Row gutter={[16, 16]}>
        {employees.map(employee => (
          <Col xs={24} sm={12} md={8} lg={6} key={employee.id}>
            <Card hoverable className="h-full">
              <div className="flex flex-col items-center text-center">
                <Avatar 
                  size={80} 
                  src={employee.avatarUrl} 
                  icon={<UserOutlined />} 
                  className="mb-4"
                />
                <Title level={5} className="mb-1">{employee.name}</Title>
                <Text type="secondary" className="mb-3">{employee.position || 'No position'}</Text>
                
                <div className="w-full text-left">
                  <Space direction="vertical" className="w-full">
                    <div className="flex items-center">
                      <MailOutlined className="mr-2 text-gray-400" />
                      <Text ellipsis>{employee.email || 'No email'}</Text>
                    </div>
                    <div className="flex items-center">
                      <PhoneOutlined className="mr-2 text-gray-400" />
                      <Text>{employee.phone || 'No phone'}</Text>
                    </div>
                    <Text type="secondary">{employee.department || 'No department'}</Text>
                  </Space>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Hidden but available for reference */}
      <div className="hidden">
        <EmployeeDirectory 
          employees={employees} 
          onRefresh={() => refetch()}
          useVirtualization={false}
        />
      </div>
    </>
  )
}
