'use client'

import React, { useState } from 'react'
import { Menu, User, Settings, Bell, BarChart3, Database, RefreshCw } from 'lucide-react'
import { useDashboard } from '@/contexts/DashboardContext'
import ApiConnection from './ApiConnection'
import ExternalApiConnection from './ExternalApiConnection'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { state, connectToApi, refreshData } = useDashboard()
  const [showApiModal, setShowApiModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (!state.apiConnected) return
    
    setRefreshing(true)
    try {
      await refreshData()
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      setRefreshing(false)
    }
  }
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md lg:hidden hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CliniCheck</h1>
                <p className="text-xs text-gray-500">MARKETING DASHBOARD</p>
              </div>
            </div>
          </div>
        </div>

        {/* Center */}
        <div className="items-center hidden space-x-4 md:flex">
          <div className="relative">
            <select className="text-sm font-medium text-gray-700 bg-transparent border-none appearance-none focus:outline-none">
              <option>MENU</option>
            </select>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* External API Connection Button */}
          <ExternalApiConnection />

          {/* API Connection Button */}
          {!state.apiConnected ? (
            <button
              onClick={() => setShowApiModal(true)}
              className="flex items-center px-3 py-2 space-x-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Database className="w-4 h-4" />
              <span>データ接続</span>
            </button>
          ) : (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-3 py-2 space-x-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>更新</span>
            </button>
          )}

          {/* Connection Status */}
          {state.apiConnected && (
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex flex-col">
                <span className="text-gray-600">
                  {state.dataSource === 'api' ? 'API接続済み' : 'CSV読み込み済み'}
                </span>
                {/* {state.tokenStatus && state.dataSource === 'api' && (
                  <span className="text-xs text-gray-500">
                    {state.tokenStatus.message}
                  </span>
                )} */}
              </div>
            </div>
          )}

          <button className="p-2 rounded-md hover:bg-gray-100">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">アリエル</p>
            </div>
            <button className="p-2 rounded-full hover:bg-gray-100">
              <User className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <button className="p-2 rounded-md hover:bg-gray-100">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* API Connection Modal */}
        <ApiConnection
          isOpen={showApiModal}
          onClose={() => setShowApiModal(false)}
          onConnect={connectToApi}
        />
      </div>
    </header>
  )
}