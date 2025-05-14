import * as React from "react"
import { cn } from "@/lib/utils"
import { Link, useLocation } from "wouter"
import { 
  TeamOutlined, 
  DashboardOutlined, 
  CalendarOutlined, 
  FileTextOutlined, 
  MessageOutlined,
  SettingOutlined,
  UserSwitchOutlined,
  LogoutOutlined,
  LinkOutlined,
  BarChartOutlined,
  PieChartOutlined
} from "@ant-design/icons"
import { useSidebar } from "@/hooks/use-sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/useAuth"
import blueEarthLogo from "@/assets/BlueEarth-Capital_white.png"
import { colors } from "@/lib/colors"
import { getNavItems } from "@/lib/routes"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const [location] = useLocation()
  const { isOpen, toggleSidebar } = useSidebar()
  const { user, logout, isSuperAdmin } = useAuth()

  // Get navigation items from centralized routes configuration
  const navItems = getNavItems(isSuperAdmin).map(item => {
    // Map the icon string to the corresponding Ant Design icon component
    const iconStyle = { fontSize: '20px' };
    let icon;
    
    // Using Ant Design icons based on the icon name from routes
    switch (item.icon) {
      case 'Users':
        icon = <TeamOutlined className="mr-3" style={iconStyle} />;
        break;
      case 'LayoutDashboard':
        icon = <DashboardOutlined className="mr-3" style={iconStyle} />;
        break;
      case 'Calendar':
        icon = <CalendarOutlined className="mr-3" style={iconStyle} />;
        break;
      case 'FileText':
        icon = <FileTextOutlined className="mr-3" style={iconStyle} />;
        break;
      case 'GanttChart':
        icon = <BarChartOutlined className="mr-3" style={iconStyle} />;
        break;
      case 'MessageSquare':
        icon = <MessageOutlined className="mr-3" style={iconStyle} />;
        break;
      case 'Palette':
        icon = <PieChartOutlined className="mr-3" style={iconStyle} />;
        break;
      case 'UserCog':
        icon = <UserSwitchOutlined className="mr-3" style={iconStyle} />;
        break;
      case 'Link':
        icon = <LinkOutlined className="mr-3" style={iconStyle} />;
        break;
      default:
        icon = <div className="mr-3" style={{ width: '20px', height: '20px' }} />;
    }
    return {
      ...item,
      icon
    };
  });

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden",
          isOpen ? "block" : "hidden"
        )}
        onClick={toggleSidebar}
      ></div>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 ease-in-out transform lg:translate-x-0 lg:relative lg:z-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
        style={{ backgroundColor: colors.background.sidebar, color: colors.text.primary }}
        {...props}
      >
        <div className="flex h-20 items-center justify-center px-4">
          <div className="flex items-center justify-center w-full">
            <img src={blueEarthLogo} alt="BlueEarth Capital" className="h-10" />
          </div>
        </div>

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
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start px-4 py-2.5 text-sm font-medium transition-colors duration-150",
                    isActive 
                      ? "text-white" 
                      : "bg-transparent text-white hover:text-white"
                  )}
                  style={{ 
                    backgroundColor: isActive ? colors.primary.hover : 'transparent',
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = colors.primary.hover;
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {item.icon}
                  {item.title}
                </Button>
              </Link>
            )
          })}
        </nav>
        
        {/* User profile moved to bottom of sidebar */}
        <div className="mt-auto p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="flex items-center">
            <Avatar>
              <AvatarImage src="/user-profile.jpg" alt={user?.username || "User"} />
              <AvatarFallback>
                {user?.firstName?.charAt(0) || ""}{user?.lastName?.charAt(0) || user?.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.username || "User"}
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {user?.role === "superadmin" 
                  ? "Super Admin" 
                  : user?.role === "admin" 
                  ? "Administrator" 
                  : user?.role === "manager" 
                  ? "Manager" 
                  : "User"}
              </p>
            </div>
            <div className="flex ml-auto">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white transition-colors duration-150"
                style={{ 
                  backgroundColor: 'transparent', 
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primary.hover;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onClick={() => logout.mutate()}
                title="Logout"
              >
                <LogoutOutlined style={{ fontSize: '20px' }} />
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
