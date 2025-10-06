'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import Dashboard from '@/components/Dashboard'
import ProgressModal from '@/components/ProgressModal'
import { DashboardProvider, useDashboard } from '@/contexts/DashboardContext'

function MainContent() {
  const { state } = useDashboard()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [tabLoading, setTabLoading] = useState(false)

  const handleTabClick = async (tabId: string) => {
    if (tabId === activeTab) return
    
    setTabLoading(true)
    setActiveTab(tabId)
    
    // Simulate calculation time for data processing
    if (state.apiConnected) {
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
    
    setTabLoading(false)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={handleTabClick}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Dashboard Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <Dashboard activeTab={activeTab} tabLoading={tabLoading} />
        </main>
      </div>
      
      {/* Global Progress Modal */}
      <ProgressModal />
    </div>
  )
}

export default function Home() {
  return (
    <DashboardProvider>
      <MainContent />
    </DashboardProvider>
  )
}