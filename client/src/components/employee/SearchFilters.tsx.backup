import React from "react"
import { Input, Select, Button, Card, Radio } from "antd"
import { 
  SearchOutlined, 
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
      style={{ 
        borderRadius: '8px',
        border: '1px solid #eaecf0',
        boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
        background: '#ffffff'
      }}
    >
      <div className="p-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Search Input */}
          <div className="md:col-span-2">
            <Input
              placeholder="Search by name, department, or position..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              prefix={<SearchOutlined style={{ color: '#64748b' as string }} />}
              style={{ 
                borderRadius: '6px',
                height: '40px',
                borderColor: '#d1d5db',
                boxShadow: 'none'
              }}
              allowClear
            />
          </div>
          
          {/* Department Filter */}
          <div>
            <Select
              value={department || "all"}
              onChange={onDepartmentFilter}
              placeholder="All Departments"
              style={{ 
                width: '100%', 
                height: '40px',
              }}
              suffixIcon={<FilterOutlined style={{ color: '#64748b' as string }} />}
              popupClassName="financial-select-dropdown"
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
        <div className="mt-5 flex flex-wrap gap-3">
          <Button 
            type={activeOnly ? "primary" : "default"}
            onClick={onStatusFilter}
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              height: '38px',
              backgroundColor: activeOnly ? colors.primary.base : '#f9fafb',
              borderColor: activeOnly ? colors.primary.base : '#d1d5db',
              borderRadius: '6px',
              boxShadow: activeOnly ? '0 1px 2px rgba(14, 74, 134, 0.05)' : 'none',
              fontWeight: 500 as number
            }}
            icon={<CheckCircleOutlined style={{ 
              color: activeOnly ? 'white' : '#10b981',
              fontSize: '16px'
            }} />}
          >
            <span style={{ marginLeft: '4px' }}>Active Only</span>
          </Button>
          
          <Radio.Group 
            value={sortBy ? `${sortBy}-${sortDirection}` : undefined} 
            buttonStyle="solid"
            className="ml-2"
            style={{
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              overflow: 'hidden'
            }}
          >
            <Radio.Button 
              value={`name-${sortDirection}`}
              onClick={onSortByName}
              style={{ 
                display: 'flex', 
                alignItems: 'center',
                height: '38px',
                borderRight: '1px solid #d1d5db',
                borderColor: '#d1d5db',
                fontWeight: 500 as number,
                background: sortBy === "name" ? '#f0f7ff' : '#ffffff',
                color: sortBy === "name" ? '#0e4a86' : '#64748b'
              }}
            >
              {sortBy === "name" && sortDirection === "desc" ? (
                <SortDescendingOutlined style={{ marginRight: '6px', fontSize: '14px' }} />
              ) : (
                <SortAscendingOutlined style={{ marginRight: '6px', fontSize: '14px' }} />
              )}
              Name
            </Radio.Button>
            
            <Radio.Button 
              value={`department-${sortDirection}`}
              onClick={onSortByDepartment}
              style={{ 
                display: 'flex', 
                alignItems: 'center',
                height: '38px',
                borderColor: '#d1d5db',
                fontWeight: 500 as number,
                background: sortBy === "department" ? '#f0f7ff' : '#ffffff',
                color: sortBy === "department" ? '#0e4a86' : '#64748b'
              }}
            >
              <BankOutlined style={{ marginRight: '6px', fontSize: '14px' }} />
              Department
            </Radio.Button>
          </Radio.Group>
        </div>
      </div>
    </Card>
  )
}
