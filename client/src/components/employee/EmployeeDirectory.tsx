import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { FixedSizeGrid, FixedSizeList, areEqual } from 'react-window';
import { Col, Row, Input, Select, Empty, Typography, Space, Button, Spin } from 'antd';
import { SearchOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { Employee, EmployeeCard, SkipLink, LoadingState } from '@/components/ui';
import { useWindowSize } from '@/hooks/useWindowSize';
import { useDebounce } from '@/hooks/useDebounce';
import { tokens } from '@/theme/tokens';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * Props for EmployeeDirectory component
 */
export interface EmployeeDirectoryProps {
  /**
   * Array of employees to display
   */
  employees: Employee[];
  
  /**
   * Whether the data is currently loading
   */
  isLoading?: boolean;
  
  /**
   * Error message, if any
   */
  error?: string | null;
  
  /**
   * Function to reload employee data
   */
  onRefresh?: () => void;
  
  /**
   * Function called when an employee card is clicked
   */
  onEmployeeSelect?: (employee: Employee) => void;
  
  /**
   * Function called when edit action is triggered
   */
  onEmployeeEdit?: (employee: Employee) => void;
  
  /**
   * Function called when delete action is triggered
   */
  onEmployeeDelete?: (employee: Employee) => void;
  
  /**
   * ID of currently selected employee, if any
   */
  selectedEmployeeId?: string;
  
  /**
   * Directory title
   */
  title?: string;
  
  /**
   * Whether to use virtualization for performance
   */
  useVirtualization?: boolean;
  
  /**
   * Whether to show action buttons on cards
   */
  showCardActions?: boolean;
  
  /**
   * Card size
   */
  cardSize?: 'small' | 'default' | 'large';
  
  /**
   * Directory layout
   * - grid: Displays employees in a grid of cards
   * - list: Displays employees in a vertical list with detailed cards
   */
  layout?: 'grid' | 'list';
  
  /**
   * Whether to show the search and filter bar
   */
  showControls?: boolean;
  
  /**
   * Whether the cards are selectable
   */
  selectableCards?: boolean;
  
  /**
   * Custom CSS class name
   */
  className?: string;
}

// Item renderer for react-window grid (memoized)
const GridItemRenderer = React.memo(({ 
  data, 
  columnIndex, 
  rowIndex, 
  style 
}: { 
  data: {
    employees: Employee[];
    columnCount: number;
    onEmployeeSelect?: (employee: Employee) => void;
    onEmployeeEdit?: (employee: Employee) => void;
    onEmployeeDelete?: (employee: Employee) => void;
    selectedEmployeeId?: string;
    showCardActions?: boolean;
    cardSize?: 'small' | 'default' | 'large';
    selectableCards?: boolean;
  };
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
}) => {
  const { 
    employees, 
    columnCount, 
    onEmployeeSelect, 
    onEmployeeEdit, 
    onEmployeeDelete,
    selectedEmployeeId,
    showCardActions,
    cardSize,
    selectableCards
  } = data;
  
  // Calculate the index in the flattened array
  const index = rowIndex * columnCount + columnIndex;
  
  // If index is out of bounds or employees is not properly initialized, render empty cell
  if (!employees || !Array.isArray(employees) || index >= employees.length) {
    return <div style={style} />;
  }
  
  const employee = employees[index];
  
  return (
    <div style={{
      ...style,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '16px'
    }}>
      <EmployeeCard
        employee={employee}
        onClick={onEmployeeSelect}
        onEdit={onEmployeeEdit}
        onDelete={onEmployeeDelete}
        showActions={showCardActions}
        size={cardSize}
        selectable={selectableCards}
        isSelected={selectedEmployeeId === employee.id}
      />
    </div>
  );
}, areEqual);

// Item renderer for react-window list (memoized)
const ListItemRenderer = React.memo(({ 
  data, 
  index, 
  style 
}: { 
  data: {
    employees: Employee[];
    onEmployeeSelect?: (employee: Employee) => void;
    onEmployeeEdit?: (employee: Employee) => void;
    onEmployeeDelete?: (employee: Employee) => void;
    selectedEmployeeId?: string;
    showCardActions?: boolean;
    selectableCards?: boolean;
  };
  index: number;
  style: React.CSSProperties;
}) => {
  const { 
    employees, 
    onEmployeeSelect, 
    onEmployeeEdit, 
    onEmployeeDelete,
    selectedEmployeeId,
    showCardActions,
    selectableCards
  } = data;
  
  const employee = employees[index];
  
  return (
    <div style={{
      ...style,
      display: 'flex',
      justifyContent: 'center',
      padding: '12px 24px'
    }}>
      <EmployeeCard
        employee={employee}
        onClick={onEmployeeSelect}
        onEdit={onEmployeeEdit}
        onDelete={onEmployeeDelete}
        showActions={showCardActions}
        size="large"
        detailed
        selectable={selectableCards}
        isSelected={selectedEmployeeId === employee.id}
      />
    </div>
  );
}, areEqual);

/**
 * EmployeeDirectory Component
 * 
 * A high-performance, virtualized employee directory component that
 * efficiently displays large lists of employees with search and filtering
 * functionality.
 * 
 * Features:
 * - Virtualized rendering for superior performance with large datasets
 * - Responsive grid and list layouts
 * - Search and filter functionality
 * - Keyboard accessibility
 * - Loading states and error handling
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <EmployeeDirectory 
 *   employees={employees} 
 *   isLoading={isLoading}
 *   onEmployeeSelect={handleEmployeeSelect}
 * />
 * 
 * // With all options
 * <EmployeeDirectory 
 *   employees={employees}
 *   isLoading={isLoading}
 *   error={error}
 *   onRefresh={refetchEmployees}
 *   onEmployeeSelect={handleEmployeeSelect}
 *   onEmployeeEdit={handleEmployeeEdit}
 *   onEmployeeDelete={handleEmployeeDelete}
 *   selectedEmployeeId={selectedEmployeeId}
 *   title="Company Directory"
 *   useVirtualization={true}
 *   showCardActions={true}
 *   cardSize="default"
 *   layout="grid"
 *   showControls={true}
 *   selectableCards={true}
 * />
 * ```
 */
export const EmployeeDirectory: React.FC<EmployeeDirectoryProps> = ({
  employees,
  isLoading = false,
  error = null,
  onRefresh,
  onEmployeeSelect,
  onEmployeeEdit,
  onEmployeeDelete,
  selectedEmployeeId,
  title = 'Employee Directory',
  useVirtualization = true,
  showCardActions = false,
  cardSize = 'default',
  layout = 'grid',
  showControls = true,
  selectableCards = false,
  className = ''
}) => {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<FixedSizeGrid>(null);
  const listRef = useRef<FixedSizeList>(null);
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  
  // Use the debounced search query for filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Window size for responsive calculations
  const { width: windowWidth } = useWindowSize();
  
  // Calculate grid dimensions based on container width and card size
  const getGridDimensions = useCallback(() => {
    if (!containerRef.current) {
      return { columnCount: 3, columnWidth: 300, rowHeight: 350 };
    }
    
    const containerWidth = containerRef.current.offsetWidth;
    
    let cardWidth: number;
    let rowHeight: number;
    
    switch (cardSize) {
      case 'small':
        cardWidth = 240;
        rowHeight = 300;
        break;
      case 'large':
        cardWidth = 320;
        rowHeight = 400;
        break;
      case 'default':
      default:
        cardWidth = 280;
        rowHeight = 350;
        break;
    }
    
    // Add padding for each card
    const cardWidthWithPadding = cardWidth + 32; // 16px padding on each side
    
    // Calculate how many columns can fit
    const columnCount = Math.max(1, Math.floor(containerWidth / cardWidthWithPadding));
    
    // Calculate actual column width to distribute space evenly
    const columnWidth = Math.floor(containerWidth / columnCount);
    
    return { columnCount, columnWidth, rowHeight };
  }, [cardSize]);
  
  // Calculate initial grid dimensions
  const [gridDimensions, setGridDimensions] = useState(getGridDimensions());
  
  // Update grid dimensions when window or container resizes
  useEffect(() => {
    const updateDimensions = () => {
      setGridDimensions(getGridDimensions());
    };
    
    // Initial calculation
    updateDimensions();
    
    // Add resize listener
    window.addEventListener('resize', updateDimensions);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [getGridDimensions, windowWidth]);
  
  // Filter employees based on search query and filters
  const filteredEmployees = useMemo(() => {
    if (!employees || !Array.isArray(employees)) {
      return [];
    }
    
    return employees.filter(employee => {
      // Apply search filter
      if (debouncedSearchQuery) {
        const searchText = debouncedSearchQuery.toLowerCase();
        const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
        
        // Check if search query matches name, email, position, or department
        const matchesSearch = 
          fullName.includes(searchText) ||
          (employee.email && employee.email.toLowerCase().includes(searchText)) ||
          (employee.position && employee.position.toLowerCase().includes(searchText)) ||
          (employee.department && employee.department.toLowerCase().includes(searchText));
        
        if (!matchesSearch) return false;
      }
      
      // Apply status filter
      if (statusFilter !== 'all' && employee.status !== statusFilter) {
        return false;
      }
      
      // Apply department filter
      if (departmentFilter !== 'all' && employee.department !== departmentFilter) {
        return false;
      }
      
      return true;
    });
  }, [employees, debouncedSearchQuery, statusFilter, departmentFilter]);
  
  // Extract unique departments for filter dropdown
  const departments = useMemo(() => {
    const departmentSet = new Set<string>();
    
    if (!employees || !Array.isArray(employees)) {
      return [];
    }
    
    employees.forEach(employee => {
      if (employee.department) {
        departmentSet.add(employee.department);
      }
    });
    
    return Array.from(departmentSet).sort();
  }, [employees]);
  
  // Handle filter changes
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);
  
  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
  }, []);
  
  const handleDepartmentFilterChange = useCallback((value: string) => {
    setDepartmentFilter(value);
  }, []);
  
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setDepartmentFilter('all');
  }, []);
  
  // Reset virtualization scroll position when filters change
  useEffect(() => {
    if (layout === 'grid' && gridRef.current) {
      gridRef.current.scrollTo({ scrollLeft: 0, scrollTop: 0 });
    } else if (layout === 'list' && listRef.current) {
      listRef.current.scrollTo(0);
    }
  }, [filteredEmployees, layout]);
  
  // Item data for grid virtualization
  const gridItemData = useMemo(() => ({
    employees: filteredEmployees || [],
    columnCount: gridDimensions.columnCount,
    onEmployeeSelect,
    onEmployeeEdit,
    onEmployeeDelete,
    selectedEmployeeId,
    showCardActions,
    cardSize,
    selectableCards
  }), [
    filteredEmployees,
    gridDimensions.columnCount,
    onEmployeeSelect,
    onEmployeeEdit,
    onEmployeeDelete,
    selectedEmployeeId,
    showCardActions,
    cardSize,
    selectableCards
  ]);
  
  // Item data for list virtualization
  const listItemData = useMemo(() => ({
    employees: filteredEmployees || [],
    onEmployeeSelect,
    onEmployeeEdit,
    onEmployeeDelete,
    selectedEmployeeId,
    showCardActions,
    selectableCards
  }), [
    filteredEmployees,
    onEmployeeSelect,
    onEmployeeEdit,
    onEmployeeDelete,
    selectedEmployeeId,
    showCardActions,
    selectableCards
  ]);
  
  // Render grid of employee cards (virtualized)
  const renderVirtualizedGrid = useCallback(() => {
    if (!filteredEmployees || !Array.isArray(filteredEmployees) || filteredEmployees.length === 0) {
      return (
        <Empty description="No employees found" />
      );
    }
    
    const { columnCount, columnWidth, rowHeight } = gridDimensions;
    const rowCount = Math.ceil(filteredEmployees.length / columnCount);
    
    return (
      <FixedSizeGrid
        ref={gridRef}
        columnCount={columnCount}
        columnWidth={columnWidth}
        rowCount={rowCount}
        rowHeight={rowHeight}
        height={600}
        width="100%"
        itemData={gridItemData}
      >
        {GridItemRenderer}
      </FixedSizeGrid>
    );
  }, [filteredEmployees.length, gridDimensions, gridItemData]);
  
  // Render list of employee cards (virtualized)
  const renderVirtualizedList = useCallback(() => {
    if (!filteredEmployees || !Array.isArray(filteredEmployees) || filteredEmployees.length === 0) {
      return (
        <Empty description="No employees found" />
      );
    }
    
    return (
      <FixedSizeList
        ref={listRef}
        height={600}
        width="100%"
        itemCount={filteredEmployees.length}
        itemSize={120}
        itemData={listItemData}
      >
        {ListItemRenderer}
      </FixedSizeList>
    );
  }, [filteredEmployees.length, listItemData]);
  
  // Render grid of employee cards (non-virtualized)
  const renderStaticGrid = useCallback(() => {
    if (!filteredEmployees || !Array.isArray(filteredEmployees) || filteredEmployees.length === 0) {
      return (
        <Empty description="No employees found" />
      );
    }
    
    return (
      <Row gutter={[16, 24]} justify="start">
        {filteredEmployees.map(employee => (
          <Col key={employee.id} xs={24} sm={12} md={8} lg={6} xl={6} xxl={4} style={{ display: 'flex', justifyContent: 'center' }}>
            <EmployeeCard
              employee={employee}
              onClick={onEmployeeSelect}
              onEdit={onEmployeeEdit}
              onDelete={onEmployeeDelete}
              showActions={showCardActions}
              size={cardSize}
              selectable={selectableCards}
              isSelected={selectedEmployeeId === employee.id}
            />
          </Col>
        ))}
      </Row>
    );
  }, [
    filteredEmployees,
    onEmployeeSelect,
    onEmployeeEdit,
    onEmployeeDelete,
    showCardActions,
    cardSize,
    selectableCards,
    selectedEmployeeId
  ]);
  
  // Render list of employee cards (non-virtualized)
  const renderStaticList = useCallback(() => {
    if (!filteredEmployees || !Array.isArray(filteredEmployees) || filteredEmployees.length === 0) {
      return (
        <Empty description="No employees found" />
      );
    }
    
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {filteredEmployees.map(employee => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            onClick={onEmployeeSelect}
            onEdit={onEmployeeEdit}
            onDelete={onEmployeeDelete}
            showActions={showCardActions}
            size="large"
            detailed
            selectable={selectableCards}
            isSelected={selectedEmployeeId === employee.id}
          />
        ))}
      </Space>
    );
  }, [
    filteredEmployees,
    onEmployeeSelect,
    onEmployeeEdit,
    onEmployeeDelete,
    showCardActions,
    selectableCards,
    selectedEmployeeId
  ]);
  
  // Render employee grid or list based on prop settings
  const renderEmployeeCards = useCallback(() => {
    if (filteredEmployees.length === 0) {
      return (
        <Empty 
          description="No employees found" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }
    
    if (useVirtualization) {
      return layout === 'grid' ? renderVirtualizedGrid() : renderVirtualizedList();
    } else {
      return layout === 'grid' ? renderStaticGrid() : renderStaticList();
    }
  }, [
    filteredEmployees.length,
    useVirtualization,
    layout,
    renderVirtualizedGrid,
    renderVirtualizedList,
    renderStaticGrid,
    renderStaticList
  ]);
  
  // Render search and filter controls
  const renderControls = useCallback(() => {
    if (!showControls) return null;
    
    return (
      <div style={{ marginBottom: tokens.spacing[5] }}>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={handleSearchChange}
              prefix={<SearchOutlined />}
              allowClear
              aria-label="Search employees"
            />
          </Col>
          
          <Col>
            <Space wrap>
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                style={{ minWidth: '140px' }}
                aria-label="Filter by status"
              >
                <Option value="all">All Statuses</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="on_leave">On Leave</Option>
                <Option value="remote">Remote</Option>
              </Select>
              
              {departments.length > 0 && (
                <Select
                  value={departmentFilter}
                  onChange={handleDepartmentFilterChange}
                  style={{ minWidth: '160px' }}
                  aria-label="Filter by department"
                >
                  <Option value="all">All Departments</Option>
                  {departments.map(dept => (
                    <Option key={dept} value={dept}>{dept}</Option>
                  ))}
                </Select>
              )}
              
              <Button 
                onClick={handleClearFilters}
                disabled={searchQuery === '' && statusFilter === 'all' && departmentFilter === 'all'}
                aria-label="Clear all filters"
              >
                Clear
              </Button>
              
              {onRefresh && (
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={onRefresh}
                  aria-label="Refresh employee list"
                >
                  Refresh
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </div>
    );
  }, [
    showControls,
    searchQuery,
    statusFilter,
    departmentFilter,
    departments,
    handleSearchChange, 
    handleStatusFilterChange,
    handleDepartmentFilterChange,
    handleClearFilters,
    onRefresh
  ]);
  
  // Render error state
  const renderError = useCallback(() => {
    if (!error) return null;
    
    return (
      <div style={{ textAlign: 'center', padding: tokens.spacing[6] }}>
        <Text type="danger" style={{ fontSize: tokens.typography.fontSize.lg }}>
          {error}
        </Text>
        {onRefresh && (
          <div style={{ marginTop: tokens.spacing[4] }}>
            <Button onClick={onRefresh} icon={<ReloadOutlined />}>
              Try Again
            </Button>
          </div>
        )}
      </div>
    );
  }, [error, onRefresh]);
  
  // Render loading state
  const renderLoading = useCallback(() => {
    if (!isLoading) return null;
    
    return (
      <LoadingState 
        variant="result" 
        message="Loading employees..." 
      />
    );
  }, [isLoading]);
  
  // Render content
  const renderContent = useCallback(() => {
    if (isLoading) {
      return renderLoading();
    }
    
    if (error) {
      return renderError();
    }
    
    return renderEmployeeCards();
  }, [isLoading, error, renderLoading, renderError, renderEmployeeCards]);
  
  // Render the component
  return (
    <div className={`employee-directory ${className}`} ref={containerRef}>
      <SkipLink targetId="directory-content" text="Skip to employee list" />
      
      <header style={{ marginBottom: tokens.spacing[4] }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3}>{title}</Title>
          </Col>
          
          <Col>
            <Text type="secondary">
              {filteredEmployees ? filteredEmployees.length : 0} {filteredEmployees && filteredEmployees.length === 1 ? 'employee' : 'employees'} found
            </Text>
          </Col>
        </Row>
      </header>
      
      {renderControls()}
      
      <div id="directory-content" tabIndex={-1} className="directory-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default EmployeeDirectory;