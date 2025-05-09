import React from "react"
import { Sidebar } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Menu, Bell, HelpCircle } from "lucide-react"
import { useSidebar } from "@/hooks/use-sidebar"

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { toggleSidebar } = useSidebar()
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 bg-background border-b border-border md:py-4 md:px-6">
          {/* Mobile Menu Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden" 
            onClick={toggleSidebar}
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          {/* Empty div to keep the header aligned on desktop */}
          <div className="lg:block hidden">
            <span className="text-xl font-semibold">Employee Directory</span>
          </div>
          
          {/* Right-side actions */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto bg-muted p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
