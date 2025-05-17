import React from "react"
import { Sidebar } from "@/components/ui/sidebar"
import { MenuOutlined } from "@ant-design/icons"
import { Button } from "antd"
import { useSidebar } from "@/hooks/use-sidebar"
import blueEarthLogoBlue from "@/assets/BlueEarth-Capital_blue.png"

interface MainLayoutProps {
  children: React.ReactNode
}

/**
 * Main layout component that provides the application frame with sidebar
 * and main content area with proper spacing and overflow handling
 */
export default function MainLayout({ children }: MainLayoutProps) {
  const { toggleSidebar } = useSidebar()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile menu button - only visible on smaller screens */}
        <div className="lg:hidden flex items-center p-4 bg-white shadow-sm">
          <Button
            type="text"
            icon={<MenuOutlined style={{ fontSize: '20px' }} />}
            onClick={toggleSidebar}
            className="flex items-center justify-center"
            style={{ height: 40, width: 40 }}
            aria-label="Toggle menu"
          />
          <div className="flex justify-center flex-grow">
            <img 
              src={blueEarthLogoBlue} 
              alt="BlueEarth Capital" 
              className="h-8" 
            />
          </div>
          <div className="w-10"></div> {/* Spacer for balance */}
        </div>
        <main className="flex-1 overflow-auto bg-slate-100 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
