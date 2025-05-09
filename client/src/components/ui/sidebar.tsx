import * as React from "react"
import { cn } from "@/lib/utils"
import { Link, useLocation } from "wouter"
import { 
  Users, 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Settings,
  UserCog,
  LogOut
} from "lucide-react"
import { useSidebar } from "@/hooks/use-sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/useAuth"
import blueEarthLogo from "@/assets/BlueEarth-Capital_white.png"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const [location] = useLocation()
  const { isOpen, toggleSidebar } = useSidebar()
  const { user, logout, isSuperAdmin } = useAuth()

  // Basic navigation items
  const baseNavItems = [
    {
      title: "Employee Directory",
      href: "/",
      icon: <Users className="mr-3 h-5 w-5" />,
    },
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="mr-3 h-5 w-5" />,
    },
    {
      title: "Calendar",
      href: "/calendar",
      icon: <Calendar className="mr-3 h-5 w-5" />,
    },
    {
      title: "Documents",
      href: "/documents",
      icon: <FileText className="mr-3 h-5 w-5" />,
    },
    {
      title: "Messages",
      href: "/messages",
      icon: <MessageSquare className="mr-3 h-5 w-5" />,
    },
  ]
  
  // Admin navigation items - only visible to superadmins
  const adminNavItems = isSuperAdmin ? [
    {
      title: "User Management",
      href: "/users",
      icon: <UserCog className="mr-3 h-5 w-5" />,
    }
  ] : []
  
  // Combine all navigation items
  const navItems = [...baseNavItems, ...adminNavItems]

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
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-[#1e3a6e] text-white transition-transform duration-300 ease-in-out transform lg:translate-x-0 lg:relative lg:z-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
        {...props}
      >
        <div className="flex h-20 items-center justify-center px-4 border-b border-white/10">
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
                      ? "bg-[#2A4A75] text-white" 
                      : "bg-transparent text-white hover:text-white hover:bg-[#2A4A75]"
                  )}
                >
                  {item.icon}
                  {item.title}
                </Button>
              </Link>
            )
          })}
        </nav>
        
        {/* User profile moved to bottom of sidebar */}
        <div className="mt-auto p-4 border-t border-white/10">
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
              <p className="text-xs text-white/70">
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
                className="text-white hover:text-white hover:bg-[#2A4A75] transition-colors duration-150"
                onClick={logout}
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
