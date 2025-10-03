'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import Dashboard from '@/components/Dashboard'
import ProgressModal from '@/components/ProgressModal'
import { DashboardProvider } from '@/contexts/DashboardContext'

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <DashboardProvider>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header onMenuClick={() => setSidebarOpen(true)} />
          
          {/* Dashboard Content */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
            <Dashboard />
          </main>
        </div>
        
        {/* Global Progress Modal */}
        <ProgressModal />
      </div>
    </DashboardProvider>
  )
}