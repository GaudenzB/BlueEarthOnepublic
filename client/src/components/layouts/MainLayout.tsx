import React from "react"
import { Sidebar } from "@/components/ui/sidebar"
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
        <main className="flex-1 overflow-auto bg-slate-100 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
