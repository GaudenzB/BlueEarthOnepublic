import React, { createContext, useContext, useState, useEffect } from "react"

interface SidebarContextType {
  isOpen: boolean
  toggleSidebar: () => void
}

// Create context with default values to avoid undefined check
const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  toggleSidebar: () => {}
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleSidebar = () => {
    setIsOpen(prev => !prev)
  }

  // Close sidebar when window is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const value = { isOpen, toggleSidebar };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext);
}

export default function SidebarProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      {children}
    </SidebarProvider>
  )
}
