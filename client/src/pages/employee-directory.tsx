import React from "react"
import { EmployeeDirectory } from "@/components/employee/EmployeeDirectory"
import { useQuery } from "@tanstack/react-query"
import { Button } from "antd"
import { LoadingState } from "@/components/ui"

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

  return (
    <>
      <h1 className="text-2xl font-semibold mb-6">Employee Directory</h1>
      <EmployeeDirectory 
        employees={Array.isArray(employees) ? employees : []} 
        onRefresh={() => refetch()}
      />
    </>
  )
}
