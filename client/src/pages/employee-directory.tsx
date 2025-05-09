import React from "react"
import { EmployeeDirectory } from "@/components/employee/EmployeeDirectory"

export default function EmployeeDirectoryPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold mb-6">Employee Directory</h1>
      <EmployeeDirectory />
    </>
  )
}
