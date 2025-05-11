import React, { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { SearchFilters } from "@/components/employee/SearchFilters"
import { EmployeeCard } from "@/components/employee/EmployeeCard"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { type Employee } from "@shared/schema"

export function EmployeeDirectory() {
  const [searchTerm, setSearchTerm] = useState("")
  const [department, setDepartment] = useState("")
  const [activeOnly, setActiveOnly] = useState(false)
  const [sortBy, setSortBy] = useState<"name" | "department" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Query to fetch employees
  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/employees"],
  })
  
  // Extract employees from the response data structure
  const employees = data?.data || []

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleDepartmentFilter = (value: string) => {
    setDepartment(value)
    setCurrentPage(1)
  }

  const handleStatusFilter = () => {
    setActiveOnly(!activeOnly)
    setCurrentPage(1)
  }

  const handleSortBy = (sortType: "name" | "department") => {
    if (sortType === sortBy) {
      // If already sorting by this field, toggle direction
      setSortDirection(prevDirection => prevDirection === "asc" ? "desc" : "asc")
    } else {
      // If sorting by a new field, set it and default to ascending
      setSortBy(sortType)
      setSortDirection("asc")
    }
    setCurrentPage(1)
  }

  // Filter and sort employees
  const filteredEmployees = React.useMemo(() => {
    if (!employees) return []
    
    let filtered: Employee[] = [...employees]
    
    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        employee => 
          employee.name.toLowerCase().includes(search) ||
          employee.position.toLowerCase().includes(search) ||
          employee.department.toLowerCase().includes(search)
      )
    }
    
    // Filter by department
    if (department && department !== "all") {
      filtered = filtered.filter(employee => employee.department === department)
    }
    
    // Filter by active status
    if (activeOnly) {
      filtered = filtered.filter(employee => employee.status === "active")
    }
    
    // Sort employees
    if (sortBy === "name") {
      filtered.sort((a, b) => {
        const comparison = a.name.localeCompare(b.name);
        return sortDirection === "asc" ? comparison : -comparison;
      });
    } else if (sortBy === "department") {
      filtered.sort((a, b) => {
        const comparison = a.department.localeCompare(b.department);
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }
    
    return filtered
  }, [employees, searchTerm, department, activeOnly, sortBy, sortDirection])

  // Calculate pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }

  // Reset to page 1 when filters change significantly
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, department, activeOnly, sortBy])

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <SearchFilters 
          onSearch={handleSearch}
          onDepartmentFilter={handleDepartmentFilter}
          onStatusFilter={handleStatusFilter}
          onSortByName={() => handleSortBy("name")}
          onSortByDepartment={() => handleSortBy("department")}
          searchTerm={searchTerm}
          department={department}
          activeOnly={activeOnly}
          sortBy={sortBy}
          sortDirection={sortDirection}
        />
        
        <div className="directory-container overflow-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, index) => (
              <div key={index} className="bg-background rounded-lg shadow-sm border border-border p-4">
                <div className="flex items-center">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="ml-3 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                </div>
                <div className="mt-4 pt-3 border-t border-border flex justify-between">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-background rounded-lg shadow-sm p-6 text-center">
        <h3 className="text-lg font-semibold text-destructive mb-2">Failed to load employees</h3>
        <p className="text-muted-foreground mb-4">There was an error loading the employee directory.</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SearchFilters 
        onSearch={handleSearch}
        onDepartmentFilter={handleDepartmentFilter}
        onStatusFilter={handleStatusFilter}
        onSortByName={() => handleSortBy("name")}
        onSortByDepartment={() => handleSortBy("department")}
        searchTerm={searchTerm}
        department={department}
        activeOnly={activeOnly}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
      
      {filteredEmployees.length === 0 ? (
        <div className="bg-background rounded-lg shadow-sm p-8 text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">No employees found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <>
          <div className="directory-container overflow-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedEmployees.map(employee => (
                <EmployeeCard key={employee.id} employee={employee} />
              ))}
            </div>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="hidden md:block">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredEmployees.length)}</span> of{" "}
                  <span className="font-medium">{filteredEmployees.length}</span> employees
                </p>
              </div>
              <div className="flex justify-center md:justify-end space-x-1">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handlePreviousPage} 
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  let pageNum: number;
                  
                  if (totalPages <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage <= 2) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 1) {
                    pageNum = totalPages - 2 + i;
                  } else {
                    pageNum = currentPage - 1 + i;
                  }
                  
                  return (
                    <Button 
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleNextPage} 
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
