import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { SearchOutlined, UserOutlined, SortAscendingOutlined, SortDescendingOutlined, BankOutlined } from "@ant-design/icons"

interface SearchFiltersProps {
  onSearch: (value: string) => void
  onDepartmentFilter: (value: string) => void
  onStatusFilter: () => void
  onSortByName: () => void
  onSortByDepartment: () => void
  searchTerm: string
  department: string
  activeOnly: boolean
  sortBy: "name" | "department" | null
  sortDirection?: "asc" | "desc"
}

export function SearchFilters({
  onSearch,
  onDepartmentFilter,
  onStatusFilter,
  onSortByName,
  onSortByDepartment,
  searchTerm,
  department,
  activeOnly,
  sortBy,
  sortDirection = "asc"
}: SearchFiltersProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <SearchOutlined style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--muted-foreground)' }} />
            <Input
              className="pl-10"
              placeholder="Search by name, department, or position..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
          
          {/* Department Filter */}
          <div>
            <Select value={department} onValueChange={onDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Additional Filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button 
            variant={activeOnly ? "default" : "outline"} 
            size="sm"
            onClick={onStatusFilter}
            className="h-9"
          >
            <UserOutlined style={{ fontSize: '16px', marginRight: '8px', color: '#22c55e' }} />
            Active Only
          </Button>
          
          <Button 
            variant={sortBy === "name" ? "default" : "outline"} 
            size="sm"
            onClick={onSortByName}
            className="h-9"
          >
            {sortBy === "name" && sortDirection === "desc" ? (
              <SortDescendingOutlined style={{ fontSize: '16px', marginRight: '8px' }} />
            ) : (
              <SortAscendingOutlined style={{ fontSize: '16px', marginRight: '8px' }} />
            )}
            Sort by Name
          </Button>
          
          <Button 
            variant={sortBy === "department" ? "default" : "outline"} 
            size="sm"
            onClick={onSortByDepartment}
            className="h-9"
          >
            {sortBy === "department" && sortDirection === "desc" ? (
              <SortDescendingOutlined style={{ fontSize: '16px', marginRight: '8px' }} />
            ) : (
              <BankOutlined style={{ fontSize: '16px', marginRight: '8px' }} />
            )}
            Sort by Department
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
