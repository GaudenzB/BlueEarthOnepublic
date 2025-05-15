import React, { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/ui"
import { Search, Building, FilterX, RefreshCw } from "lucide-react"

// Define the Employee type to match the API response
interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
  location: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  responsibilities?: string;
  status: string;
  updatedAt?: string;
  syncedAt?: string;
}

export default function EmployeeDirectoryPage() {
  // Direct query to /api/employees which returns array of employees
  const { data: employees = [], isLoading, error, refetch } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    retry: 1,
  })

  // State for filters
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'name' | 'department' | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Get unique departments from employee data
  const departments = React.useMemo(() => {
    if (!employees || !Array.isArray(employees)) return []
    
    const departmentSet = new Set<string>()
    employees.forEach(employee => {
      if (employee.department) {
        departmentSet.add(employee.department)
      }
    })
    
    return Array.from(departmentSet).sort()
  }, [employees])

  // Get unique statuses from employee data
  const statuses = React.useMemo(() => {
    if (!employees || !Array.isArray(employees)) return []
    
    const statusSet = new Set<string>()
    employees.forEach(employee => {
      if (employee.status) {
        statusSet.add(employee.status)
      }
    })
    
    return Array.from(statusSet).sort()
  }, [employees])

  // Filter and sort employees
  const filteredEmployees = React.useMemo(() => {
    if (!employees || !Array.isArray(employees)) return []

    console.log("Filtering employees:", {
      totalEmployees: employees.length,
      filterStatus: statusFilter,
      filterDepartment: departmentFilter,
      searchTerm: searchTerm
    })
    
    let filtered = [...employees]
    
    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(employee => 
        (employee.name?.toLowerCase().includes(search)) ||
        (employee.position?.toLowerCase().includes(search)) ||
        (employee.department?.toLowerCase().includes(search)) ||
        (employee.email?.toLowerCase().includes(search))
      )
    }
    
    // Filter by department
    if (departmentFilter && departmentFilter !== 'all') {
      filtered = filtered.filter(employee => employee.department === departmentFilter)
    }
    
    // Filter by status
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(employee => 
        employee.status?.toLowerCase() === statusFilter.toLowerCase()
      )
    }
    
    // Sort employees
    if (sortBy) {
      filtered.sort((a, b) => {
        const aValue = sortBy === 'name' ? a.name || '' : a.department || '';
        const bValue = sortBy === 'name' ? b.name || '' : b.department || '';
        
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      })
    }
    
    return filtered
  }, [employees, searchTerm, departmentFilter, statusFilter, sortBy, sortDirection])

  // Load initial filter values from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlSearch = params.get('search')
    const urlDepartment = params.get('department')
    const urlStatus = params.get('status')
    const urlSortBy = params.get('sortBy') as 'name' | 'department' | null
    const urlSortDirection = params.get('sortDirection') as 'asc' | 'desc'
    
    if (urlSearch) setSearchTerm(urlSearch)
    if (urlDepartment) setDepartmentFilter(urlDepartment)
    if (urlStatus) setStatusFilter(urlStatus)
    if (urlSortBy) setSortBy(urlSortBy)
    if (urlSortDirection) setSortDirection(urlSortDirection)
  }, [])

  // Update URL with filter params
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (departmentFilter !== 'all') params.set('department', departmentFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (sortBy) params.set('sortBy', sortBy)
    if (sortDirection !== 'asc') params.set('sortDirection', sortDirection)
    
    const queryString = params.toString()
    const newUrl = window.location.pathname + (queryString ? `?${queryString}` : '')
    
    window.history.replaceState(null, '', newUrl)
  }, [searchTerm, departmentFilter, statusFilter, sortBy, sortDirection])

  // Handle sorting
  const handleSortBy = (field: 'name' | 'department') => {
    if (sortBy === field) {
      // Toggle direction if already sorting by this field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDirection('asc')
    }
  }

  // Handle clearing all filters
  const clearFilters = () => {
    setSearchTerm('')
    setDepartmentFilter('all')
    setStatusFilter('all')
    setSortBy(null)
    setSortDirection('asc')
  }

  // Count filtered employees
  const filteredCount = filteredEmployees.length
  const totalCount = Array.isArray(employees) ? employees.length : 0

  if (isLoading) {
    return <LoadingState size="large" text="Loading employees..." />
  }

  if (error) {
    return (
      <div className="p-6 border rounded-md bg-red-50">
        <h2 className="text-xl font-semibold mb-4 text-red-600">Error Loading Employees</h2>
        <p className="mb-4">{String(error)}</p>
        <Button variant="default" onClick={() => refetch()}>Try Again</Button>
      </div>
    )
  }

  if (!Array.isArray(employees) || employees.length === 0) {
    return (
      <>
        <h1 className="text-2xl font-semibold mb-6">Employee Directory</h1>
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-muted-foreground mb-4">No employees found</p>
          <Button variant="default" onClick={() => refetch()}>Refresh</Button>
        </div>
      </>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Employee Directory</h1>
        <Button variant="outline" onClick={() => refetch()} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>
      
      {/* Search and filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-4">
            {/* Search input */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Search by name, email, position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Department filter */}
            <div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>
                      {dept.charAt(0).toUpperCase() + dept.slice(1).replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Status filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Sort buttons */}
            <Button 
              variant={sortBy === 'name' ? 'default' : 'outline'} 
              onClick={() => handleSortBy('name')}
              className="text-xs"
              size="sm"
            >
              Sort by Name {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </Button>
            
            <Button 
              variant={sortBy === 'department' ? 'default' : 'outline'} 
              onClick={() => handleSortBy('department')}
              className="text-xs"
              size="sm"
            >
              <Building className="h-4 w-4 mr-1" /> Sort by Dept. {sortBy === 'department' && (sortDirection === 'asc' ? '↑' : '↓')}
            </Button>
            
            {/* Clear filters button - only show if any filters are active */}
            {(searchTerm || departmentFilter !== 'all' || statusFilter !== 'all' || sortBy) && (
              <Button 
                variant="ghost" 
                onClick={clearFilters}
                className="ml-auto text-xs"
                size="sm"
              >
                <FilterX className="h-4 w-4 mr-1" /> Clear Filters
              </Button>
            )}
          </div>
          
          {/* Show filter count */}
          {filteredCount < totalCount && (
            <div className="mt-3 text-sm text-muted-foreground">
              Showing {filteredCount} of {totalCount} employees
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredEmployees.map(employee => (
          <Card key={employee.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-medium">{employee.name}</h3>
                  <p className="text-sm text-muted-foreground">{employee.position}</p>
                </div>
                <Badge 
                  variant={employee.status === 'active' ? 'default' : 'outline'}
                  className={
                    employee.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                    employee.status === 'inactive' ? 'bg-gray-100 text-gray-800 hover:bg-gray-100' :
                    employee.status === 'on_leave' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' :
                    'bg-blue-100 text-blue-800 hover:bg-blue-100'
                  }
                >
                  {employee.status.charAt(0).toUpperCase() + employee.status.slice(1).replace(/_/g, ' ')}
                </Badge>
              </div>
              
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Building className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{employee.department.charAt(0).toUpperCase() + employee.department.slice(1).replace(/_/g, ' ')}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2 flex-shrink-0"><path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z"></path><polyline points="15,9 18,9 18,11"></polyline><path d="M6 10h4"></path><path d="M6 14h2"></path><rect x="6" y="17" width="12" height="5"></rect></svg>
                  <span className="truncate">{employee.email}</span>
                </div>
                {employee.location && (
                  <div className="flex items-center text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2 flex-shrink-0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span className="truncate">{employee.location}</span>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2 flex-shrink-0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    <span className="truncate">{employee.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Empty state for filtered results */}
      {filteredEmployees.length === 0 && (
        <div className="bg-background rounded-lg shadow-sm p-8 text-center mt-4">
          <h3 className="text-lg font-medium text-foreground mb-2">No employees found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
          <Button variant="outline" onClick={clearFilters} className="mt-4">
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  )
}
