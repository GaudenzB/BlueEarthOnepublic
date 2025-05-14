import React from "react"
import { Input, Select, Button, Card, Radio } from "antd"
import { 
  SearchOutlined, 
  UserOutlined, 
  SortAscendingOutlined, 
  SortDescendingOutlined, 
  BankOutlined,
  FilterOutlined,
  CheckCircleOutlined
} from "@ant-design/icons"
import { colors } from "@/lib/colors"

const { Option } = Select

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
    <Card 
      className="shadow-sm mb-6" 
      style={{ borderRadius: '8px', borderColor: 'var(--border)' }}
    >
      <div className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Search Input */}
          <div className="md:col-span-2">
            <Input
              placeholder="Search by name, department, or position..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              prefix={<SearchOutlined style={{ color: 'var(--muted-foreground)' }} />}
              style={{ borderRadius: '6px' }}
              allowClear
            />
          </div>
          
          {/* Department Filter */}
          <div>
            <Select
              value={department || "all"}
              onChange={onDepartmentFilter}
              placeholder="All Departments"
              style={{ width: '100%', borderRadius: '6px' }}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="all">All Departments</Option>
              <Option value="engineering">Engineering</Option>
              <Option value="marketing">Marketing</Option>
              <Option value="design">Design</Option>
              <Option value="product">Product</Option>
              <Option value="hr">HR</Option>
              <Option value="sales">Sales</Option>
              <Option value="operations">Operations</Option>
              <Option value="finance">Finance</Option>
            </Select>
          </div>
        </div>
        
        {/* Additional Filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button 
            type={activeOnly ? "primary" : "default"}
            onClick={onStatusFilter}
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              height: '36px',
              backgroundColor: activeOnly ? colors.primary.base : undefined,
              borderRadius: '6px'
            }}
            icon={<CheckCircleOutlined style={{ color: activeOnly ? 'white' : '#22c55e' }} />}
          >
            Active Only
          </Button>
          
          <Radio.Group 
            value={sortBy ? `${sortBy}-${sortDirection}` : undefined} 
            buttonStyle="solid"
            className="ml-2"
          >
            <Radio.Button 
              value={`name-${sortDirection}`}
              onClick={onSortByName}
              style={{ 
                display: 'flex', 
                alignItems: 'center',
                height: '36px',
                borderRadius: sortBy === "name" ? '6px' : undefined
              }}
            >
              {sortBy === "name" && sortDirection === "desc" ? (
                <SortDescendingOutlined style={{ marginRight: '4px' }} />
              ) : (
                <SortAscendingOutlined style={{ marginRight: '4px' }} />
              )}
              Name
            </Radio.Button>
            
            <Radio.Button 
              value={`department-${sortDirection}`}
              onClick={onSortByDepartment}
              style={{ 
                display: 'flex', 
                alignItems: 'center',
                height: '36px',
                borderRadius: sortBy === "department" ? '6px' : undefined
              }}
            >
              <BankOutlined style={{ marginRight: '4px' }} />
              Department
            </Radio.Button>
          </Radio.Group>
        </div>
      </div>
    </Card>
  )
}
