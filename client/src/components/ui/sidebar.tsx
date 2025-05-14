import * as React from "react"
import { cn } from "@/lib/utils"
import { Link, useLocation } from "wouter"
import { 
  TeamOutlined, 
  DashboardOutlined, 
  CalendarOutlined, 
  FileTextOutlined, 
  MessageOutlined,
  UserSwitchOutlined,
  LogoutOutlined,
  LinkOutlined,
  BarChartOutlined,
  PieChartOutlined
} from "@ant-design/icons"
import { useSidebar } from "@/hooks/use-sidebar"
import { Button } from "antd"
import { Avatar } from "antd"
import { useAuth } from "@/hooks/useAuth"
import blueEarthLogo from "@/assets/BlueEarth-Capital_white.png"
import { getNavItems } from "@/lib/routes"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const [location] = useLocation()
  const { isOpen, toggleSidebar } = useSidebar()
  const { user, logout, isSuperAdmin } = useAuth()

  // Define sidebar colors
  const sidebarBgColor = "#0e4a86"; // Deep blue from our theme
  const activeItemBgColor = "#1e63a5"; // Slightly lighter blue for active items
  const hoverBgColor = "rgba(255, 255, 255, 0.1)"; // Subtle white for hover
  const textColor = "#ffffff"; // White text

  // Get navigation items from centralized routes configuration
  const navItems = getNavItems(isSuperAdmin).map(item => {
    // Map the icon string to the corresponding Ant Design icon component
    const iconStyle = { fontSize: '20px', color: textColor };
    let icon;
    
    // Using Ant Design icons based on the icon name from routes
    switch (item.icon) {
      case 'Users':
        icon = <TeamOutlined style={iconStyle} />;
        break;
      case 'LayoutDashboard':
        icon = <DashboardOutlined style={iconStyle} />;
        break;
      case 'Calendar':
        icon = <CalendarOutlined style={iconStyle} />;
        break;
      case 'FileText':
        icon = <FileTextOutlined style={iconStyle} />;
        break;
      case 'GanttChart':
        icon = <BarChartOutlined style={iconStyle} />;
        break;
      case 'MessageSquare':
        icon = <MessageOutlined style={iconStyle} />;
        break;
      case 'Palette':
        icon = <PieChartOutlined style={iconStyle} />;
        break;
      case 'UserCog':
        icon = <UserSwitchOutlined style={iconStyle} />;
        break;
      case 'Link':
        icon = <LinkOutlined style={iconStyle} />;
        break;
      default:
        icon = <div style={{ width: '20px', height: '20px' }} />;
    }
    return {
      ...item,
      icon
    };
  });

  return (
    <>
      {/* Modal backdrop for mobile */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden",
          isOpen ? "block" : "hidden"
        )}
        onClick={toggleSidebar}
      ></div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 ease-in-out transform lg:translate-x-0 lg:relative lg:z-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
        style={{ 
          backgroundColor: sidebarBgColor, 
          color: textColor
        }}
        {...props}
      >
        {/* Logo area */}
        <div className="flex h-20 items-center justify-center px-4">
          <div className="flex items-center justify-center w-full">
            <img src={blueEarthLogo} alt="BlueEarth Capital" className="h-10" />
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    toggleSidebar()
                  }
                }}
              >
                <div
                  className={cn(
                    "flex items-center w-full px-4 py-2.5 rounded-md cursor-pointer transition-colors duration-150",
                  )}
                  style={{ 
                    backgroundColor: isActive ? activeItemBgColor : 'transparent',
                    color: textColor,
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = hoverBgColor;
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span className="text-sm font-medium">{item.title}</span>
                </div>
              </Link>
            )
          })}
        </nav>
        
        {/* User profile */}
        <div className="mt-auto p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="flex items-center">
            <Avatar 
              size={40} 
              src="/user-profile.jpg" 
              style={{ flexShrink: 0 }}
            >
              {user?.firstName?.charAt(0) || user?.username?.charAt(0) || "U"}
            </Avatar>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.username || "User"}
              </p>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {user?.role === "superadmin" 
                  ? "Super Admin" 
                  : user?.role === "admin" 
                  ? "Administrator" 
                  : user?.role === "manager" 
                  ? "Manager" 
                  : "User"}
              </p>
            </div>
            <Button 
              type="text"
              size="small"
              icon={<LogoutOutlined style={{ fontSize: '18px', color: textColor }} />}
              style={{ 
                minWidth: 32,
                height: 32,
                padding: 0,
                backgroundColor: 'transparent', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = hoverBgColor;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={() => logout.mutate()}
              title="Logout"
            />
          </div>
        </div>
      </aside>
    </>
  )
}
