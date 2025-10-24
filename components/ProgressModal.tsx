'use client'

import { useEffect } from 'react'
import { useDashboard } from '../contexts/DashboardContext'

export default function ProgressModal() {
  const { state } = useDashboard()

  // Lock body scroll when modal is active
  useEffect(() => {
    if (state.progress.isActive) {
      // Save current scroll position
      const scrollY = window.scrollY
      
      // Lock body scroll
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
      
      // Cleanup function to restore scroll
      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [state.progress.isActive])

  if (!state.progress.isActive) {
    return null
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 select-none"
      onClick={(e) => e.preventDefault()}
      onMouseDown={(e) => e.preventDefault()}
      onMouseUp={(e) => e.preventDefault()}
      onKeyDown={(e) => e.preventDefault()}
      style={{ 
        pointerEvents: 'auto',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      <div 
        className="w-full max-w-md p-8 mx-4 bg-white rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        {/* Progress Header */}
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
            <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">データ取得中</h3>
          <p className="text-sm text-gray-600">2年間のデータを取得しています...</p>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">進捗</span>
            <span className="text-sm font-medium text-blue-600">{state.progress.percentage}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full">
            <div 
              className="h-3 transition-all duration-500 ease-out bg-blue-600 rounded-full"
              style={{ width: `${state.progress.percentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Progress Details */}
        <div className="text-center">
          <p className="mb-2 text-sm font-medium text-gray-800">{state.progress.currentStep}</p>
          <p className="text-xs text-gray-500">
            ステップ {state.progress.currentStepNumber} / {state.progress.totalSteps}
          </p>
        </div>
        
        {/* Warning Message */}
        <div className="p-3 mt-6 border border-yellow-200 rounded-md bg-yellow-50">
          <p className="text-xs text-center text-yellow-800">
            ⚠️ データ取得中は他の操作を行わないでください
          </p>
        </div>
      </div>
    </div>
  )
}
