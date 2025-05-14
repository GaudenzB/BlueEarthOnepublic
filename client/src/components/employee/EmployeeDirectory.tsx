import React, { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useLocation } from "wouter"
import { SearchFilters } from "@/components/employee/SearchFilters"
import { 
  Pagination, 
  Empty, 
  Spin, 
  Result, 
  Button, 
  Skeleton, 
  Card
} from "antd"
import { ReloadOutlined } from "@ant-design/icons"
import { type Employee } from "@shared/schema"
// Import from centralized theme system
import { theme } from "@/lib/theme"
import { colors } from "@/lib/colors"
// Import shared UI components
import { EmployeeCard } from "@/components/ui"

export function EmployeeDirectory() {
  const [location, setLocation] = useLocation();
  
  // Parse existing query params from URL
  const getQueryParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      search: params.get('search') || '',
      department: params.get('department') || '',
      active: params.get('active') === 'true',
      sortBy: (params.get('sortBy') as "name" | "department" | null) || null,
      sortDirection: (params.get('sortDirection') as "asc" | "desc") || "asc",
      page: parseInt(params.get('page') || '1'),
    };
  };
  
  // Initialize state from URL query params
  const queryParams = getQueryParams();
  const [searchTerm, setSearchTerm] = useState(queryParams.search)
  const [department, setDepartment] = useState(queryParams.department)
  const [activeOnly, setActiveOnly] = useState(queryParams.active)
  const [sortBy, setSortBy] = useState<"name" | "department" | null>(queryParams.sortBy)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(queryParams.sortDirection)
  const [currentPage, setCurrentPage] = useState(queryParams.page)
  const itemsPerPage = 8
  
  // Update URL whenever filters change
  const updateQueryParams = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (department) params.set('department', department);
    if (activeOnly) params.set('active', 'true');
    if (sortBy) params.set('sortBy', sortBy);
    if (sortDirection !== 'asc') params.set('sortDirection', sortDirection);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    const queryString = params.toString();
    const newUrl = location + (queryString ? `?${queryString}` : '');
    
    // Update URL without causing full page reload
    window.history.replaceState(null, '', newUrl);
  };

  // Define the API response type
  interface ApiResponse {
    success: boolean;
    message: string;
    data: Employee[];
  }
  
  // Add a cache buster that doesn't change on every render
  const cacheBuster = React.useMemo(() => ({ _t: Date.now() }), []);
  
  // Query to fetch employees
  const { data: apiResponse, isLoading, isError, refetch } = useQuery<Employee[] | ApiResponse>({
    queryKey: ["/api/employees", cacheBuster], // Static query key that only changes on mount
    staleTime: 0, // Consider data immediately stale
    gcTime: 60 * 1000, // Keep in cache for 1 minute (gcTime replaces cacheTime in React Query v5)
  })
  
  // Extract employees from the response data structure
  // Handle both response formats: either direct array or wrapped in ApiResponse
  let employees: Employee[] = [];
  
  if (apiResponse) {
    console.log("API response received:", apiResponse);
    
    if (Array.isArray(apiResponse)) {
      // If the response is an array, use it directly
      employees = apiResponse;
      console.log("Direct array response, employees count:", employees.length);
    } else if (apiResponse.data) {
      // If the response is an object with data property, use that
      employees = apiResponse.data;
      console.log("Object response with data property, employees count:", employees.length);
    } else {
      console.error("Unexpected response format:", apiResponse);
    }
  }
  
  // Force refetch data on component mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
    setTimeout(updateQueryParams, 0) // Queue update to execute after state changes
  }

  const handleDepartmentFilter = (value: string) => {
    setDepartment(value)
    setCurrentPage(1)
    setTimeout(updateQueryParams, 0)
  }

  const handleStatusFilter = () => {
    setActiveOnly(!activeOnly)
    setCurrentPage(1)
    setTimeout(updateQueryParams, 0)
  }

  const handleSortBy = (sortType: "name" | "department") => {
    if (sortType === sortBy) {
      // If already sorting by this field, toggle direction
      setSortDirection(prevDirection => {
        const newDirection = prevDirection === "asc" ? "desc" : "asc";
        setTimeout(updateQueryParams, 0)
        return newDirection;
      })
    } else {
      // If sorting by a new field, set it and default to ascending
      setSortBy(sortType)
      setSortDirection("asc")
      setTimeout(updateQueryParams, 0)
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

  // Removed handlePreviousPage and handleNextPage
  // since we're using Ant Design's Pagination component instead

  // Reset to page 1 when filters change significantly
  useEffect(() => {
    setCurrentPage(1)
    setTimeout(updateQueryParams, 0)
  }, [searchTerm, department, activeOnly, sortBy])
  
  // Sync URL params to state when the component mounts or location changes
  useEffect(() => {
    updateQueryParams()
  }, [location, searchTerm, department, activeOnly, sortBy, sortDirection, currentPage])

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
          <Spin spinning={true} tip="Loading employees..." className="flex justify-center my-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, index) => (
                <Card key={index} className="overflow-hidden border border-border">
                  <div className="flex items-center">
                    <Skeleton.Avatar active size={48} shape="circle" />
                    <div className="ml-3 space-y-2">
                      <Skeleton.Input active style={{ width: 120 }} />
                      <Skeleton.Input active style={{ width: 90 }} />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Skeleton active paragraph={{ rows: 3 }} />
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex justify-between">
                    <Skeleton.Button active />
                    <div className="flex space-x-2">
                      <Skeleton.Button active shape="circle" />
                      <Skeleton.Button active shape="circle" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Spin>
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="py-6">
        <Result
          status="error"
          title="Failed to load employees"
          subTitle="There was an error loading the employee directory. Please try again."
          extra={[
            <Button 
              key="refresh" 
              type="primary" 
              onClick={() => window.location.reload()}
              style={{ backgroundColor: colors.primary.base }}
              icon={<ReloadOutlined />}
            >
              Try Again
            </Button>
          ]}
        />
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
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">No employees found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
            </div>
          }
        />
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
            <div className="mt-6 py-4 flex items-center justify-center">
              <Pagination
                current={currentPage}
                total={filteredEmployees.length}
                pageSize={itemsPerPage}
                onChange={(page) => {
                  setCurrentPage(page);
                  setTimeout(updateQueryParams, 0);
                }}
                showSizeChanger={false}
                showTotal={(total, range) => (
                  <span className="text-sm text-muted-foreground hidden md:inline-block mr-4">
                    Showing {range[0]}-{range[1]} of {total} employees
                  </span>
                )}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
