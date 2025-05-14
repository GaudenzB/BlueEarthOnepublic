import React, { useState, useEffect, useRef, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useLocation } from "wouter"
import { SearchFilters } from "@/components/employee/SearchFilters"
import { 
  Pagination, 
  Empty, 
  Spin, 
  Result, 
  Button,
  Row,
  Col
} from "antd"
import { FixedSizeGrid as Grid } from 'react-window'
import { ReloadOutlined } from "@ant-design/icons"
import { type Employee } from "@shared/schema"
// Import from centralized theme system
import { colors } from "@/lib/colors"
// Import shared UI components
import { EmployeeCard } from "@/components/ui"
// Import theme tokens
import { tokens } from "@/theme/tokens"

// VirtualizedEmployeeGrid component
interface VirtualizedEmployeeGridProps {
  employees: Employee[];
}

// This component will render a virtualized grid of employee cards
const VirtualizedEmployeeGrid: React.FC<VirtualizedEmployeeGridProps> = ({ employees }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  
  // Calculate the number of columns based on container width
  const columnCount = useMemo(() => {
    if (dimensions.width < 640) return 1;      // xs: 1 column
    if (dimensions.width < 1024) return 2;     // sm-md: 2 columns
    if (dimensions.width < 1280) return 3;     // lg: 3 columns
    return 4;                                  // xl: 4 columns
  }, [dimensions.width]);

  // Calculate item dimensions
  const columnWidth = useMemo(() => {
    const gap = 24; // gap-6 in Tailwind is 24px
    return Math.floor((dimensions.width - (gap * (columnCount - 1))) / columnCount);
  }, [dimensions.width, columnCount]);
  
  const rowHeight = 280; // Fixed height for employee cards
  
  // Update dimensions on resize
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: window.innerHeight - 300 // Approximate height minus headers and filters
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);
  
  // If there are no employees or dimensions aren't set, return traditional grid
  if (employees.length === 0 || dimensions.width === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {employees.map(employee => (
          employee && (
            <EmployeeCard 
              key={employee.id} 
              employee={employee} 
              variant="detailed" 
            />
          )
        ))}
      </div>
    );
  }
  
  // Cell renderer for the grid
  const Cell = ({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
    const index = rowIndex * columnCount + columnIndex;
    
    if (index >= employees.length) {
      return <div style={style} />; // Empty cell
    }
    
    const employee = employees[index];
    
    if (!employee) {
      return <div style={style} />; // Safety check
    }
    
    // Apply gap using padding in the style
    const cellStyle = {
      ...style,
      padding: '12px',
    };
    
    return (
      <div style={cellStyle}>
        <EmployeeCard 
          key={employee.id} 
          employee={employee} 
          variant="detailed" 
        />
      </div>
    );
  };
  
  // Calculate the number of rows
  const rowCount = Math.ceil(employees.length / columnCount);
  
  return (
    <div ref={containerRef} style={{ width: '100%', height: dimensions.height }}>
      <Grid
        columnCount={columnCount}
        columnWidth={columnWidth}
        height={dimensions.height}
        rowCount={rowCount}
        rowHeight={rowHeight}
        width={dimensions.width}
      >
        {Cell}
      </Grid>
    </div>
  );
};

export function EmployeeDirectory() {
  const [location] = useLocation();
  
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
        
        <div 
          className="directory-container overflow-auto"
          style={{
            position: 'relative',
            minHeight: '400px'
          }}
        >
          <Spin 
            spinning={true} 
            tip={
              <div style={{ 
                marginTop: '12px', 
                color: '#64748b',
                fontSize: '14px',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                Loading employee data...
              </div>
            } 
            className="flex justify-center my-4"
            style={{
              maxWidth: '100%'
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array(8).fill(0).map((_, index) => (
                <EmployeeCard 
                  key={index} 
                  employee={{} as Employee} 
                  loading={true}
                  variant="detailed" 
                />
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
      <div 
        style={{ 
          padding: '48px 24px', 
          marginTop: '24px',
          borderRadius: '8px',
          border: '1px solid #fee2e2',
          background: '#fef2f2'
        }}
      >
        <Result
          status="error"
          title={
            <div style={{ 
              color: '#b91c1c', 
              fontSize: '22px', 
              fontWeight: 600,
              marginBottom: '8px',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              Failed to load employees
            </div>
          }
          subTitle={
            <div style={{ 
              color: '#ef4444', 
              fontSize: '14px',
              marginBottom: '24px',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              There was an error loading the employee directory. Please try again.
            </div>
          }
          extra={[
            <Button 
              key="refresh" 
              type="primary" 
              onClick={() => window.location.reload()}
              style={{ 
                backgroundColor: colors.primary.base,
                borderColor: colors.primary.base,
                boxShadow: '0 1px 2px rgba(14, 74, 134, 0.05)',
                height: '40px',
                borderRadius: '6px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 20px',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
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
        <div 
          style={{ 
            padding: '48px 24px', 
            textAlign: 'center', 
            background: '#f9fafc',
            borderRadius: '8px',
            border: '1px solid #eaecf0',
            marginTop: '16px'
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            imageStyle={{ marginBottom: '24px', opacity: 0.8 }}
            description={
              <div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  color: '#1e293b', 
                  marginBottom: '8px',
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  No employees found
                </h3>
                <p style={{ 
                  color: '#64748b', 
                  fontSize: '14px',
                  maxWidth: '320px',
                  margin: '0 auto',
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  Try adjusting your search or filter criteria to find the employees you're looking for
                </p>
              </div>
            }
          />
        </div>
      ) : (
        <>
          <div className="directory-container overflow-hidden" style={{ padding: tokens.spacing[4] }}>
            <VirtualizedEmployeeGrid employees={paginatedEmployees} />
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 pt-6 pb-4 flex items-center justify-center border-t border-gray-100">
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
                  <span 
                    className="text-sm hidden md:inline-block mr-4"
                    style={{ 
                      color: '#64748b', 
                      fontWeight: 500,
                      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                  >
                    Showing {range[0]}-{range[1]} of {total} employees
                  </span>
                )}
                style={{
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
