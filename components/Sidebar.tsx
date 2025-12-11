'use client'

import { useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Users, 
  Target,
  RefreshCw,
  AlertTriangle,
  Home,
  Package,
  X,
  Download,
  MousePointer,
  Stethoscope,
  Building2,
  Table,
  Database,
  Settings as SettingsIcon
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  activeTab: string
  onTabChange: (tabId: string) => void
}

  const menuItems = [
    { id: 'overview', label: '概要', icon: Home },
    { id: 'clinic-sales', label: '院別　集計', icon: Building2 },
    { id: 'daily', label: '院別　集計　（日別）', icon: Calendar },
    { id: 'sales-table', label: '院別　売り上げ表', icon: Table },
    { id: 'staff-sales', label: 'スタッフ別売り上げ', icon: Users },
    { id: 'doctor-sales', label: '医師別売り上げ', icon: Stethoscope },
    { id: 'clinic-comparison', label: '全院比較', icon: Building2 },
    { id: 'treatment-trend', label: '治療別傾向分析', icon: Stethoscope },
    { id: 'sales-analysis', label: '売上分析', icon: BarChart3 },
    { id: 'treatment-sales', label: '治療売上推移', icon: TrendingUp },
    { id: 'annual-sales', label: '年間売上推移', icon: TrendingUp },
    { id: 'cancellation', label: '予約キャンセル', icon: Calendar },
    { id: 'repeat-analysis', label: 'リ ピー 卜分析', icon: RefreshCw },
    { id: 'cross-sell', label: 'クロスセル', icon: BarChart3 },
    { id: 'sales-comparison', label: '売上比較', icon: TrendingUp },
    { id: 'customer-attributes', label: '顧客属性分析', icon: Users },
    { id: 'monthly-progress', label: '今月進捗', icon: Calendar },
    { id: 'patients', label: '来院者情報', icon: Users },
    { id: 'goals', label: '目標達成率', icon: Target },
    { id: 'advertising', label: '広告分析', icon: MousePointer },
    { id: 'settings', label: '設定', icon: SettingsIcon },
  ]

export default function Sidebar({ isOpen, onClose, activeTab, onTabChange }: SidebarProps) {
  const { state } = useDashboard()
  const [filters, setFilters] = useState({
    dateLevel: 'month',
    period: 'past1',
    clinic: 'all',
    conversionThreshold: 5000
  })

  const handleExportCSV = () => {
    try {
      // CSV export: Only exports data, does not include sidebar (data-only export)
      const data = state.data.dailyAccounts || []
      if (data.length === 0) {
        alert('エクスポートするデータがありません')
        return
      }

      // Create CSV headers from first record
      const headers = Object.keys(data[0] || {})
      const csvRows = [
        headers.join(','),
        ...data.map(record => 
          headers.map(header => {
            const value = record[header]
            if (value === null || value === undefined) return '""'
            if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`
            return `"${String(value).replace(/"/g, '""')}"`
          }).join(',')
        )
      ]

      const csvContent = csvRows.join('\n')
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      
      const now = new Date()
      const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-')
      link.setAttribute('download', `dashboard_export_${timestamp}.csv`)
      
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      alert(`CSVファイルをエクスポートしました: ${data.length}件のレコード`)
    } catch (error) {
      console.error('CSV export error:', error)
      alert('CSVエクスポートに失敗しました')
    }
  }

  const handleExportJPG = async () => {
    try {
      // Capture ONLY dashboard content (main element) - WITHOUT sidebar and header
      const mainContentArea = document.querySelector('main') || 
                              document.querySelector('[role="main"]') ||
                              document.body
      
      if (!mainContentArea) {
        alert('エクスポートするコンテンツが見つかりません')
        return
      }

      // Find and temporarily hide sidebar and header during capture
      const sidebar = document.querySelector('div.fixed.inset-y-0, div[class*="sidebar"], aside') as HTMLElement
      const header = document.querySelector('header') as HTMLElement
      const sidebarOriginalDisplay = sidebar?.style.display || ''
      const sidebarOriginalVisibility = sidebar?.style.visibility || ''
      const headerOriginalDisplay = header?.style.display || ''
      const headerOriginalVisibility = header?.style.visibility || ''
      
      if (sidebar) {
        sidebar.style.display = 'none'
        sidebar.style.visibility = 'hidden'
      }
      if (header) {
        header.style.display = 'none'
        header.style.visibility = 'hidden'
      }

        try {
          // Use html2canvas to capture the page
          if (typeof window !== 'undefined') {
            
            // Save original scroll position and overflow styles
            const originalScrollTop = window.pageYOffset || document.documentElement.scrollTop
            const originalScrollLeft = window.pageXOffset || document.documentElement.scrollLeft
            const mainElement = mainContentArea as HTMLElement
            const originalOverflow = mainElement.style.overflow || ''
            const originalOverflowX = mainElement.style.overflowX || ''
            const originalOverflowY = mainElement.style.overflowY || ''
            
            // Temporarily remove overflow restrictions to capture full content
            mainElement.style.overflow = 'visible'
            mainElement.style.overflowX = 'visible'
            mainElement.style.overflowY = 'visible'
            
            // Scroll to top-left to capture from beginning
            window.scrollTo(0, 0)
            if (mainContentArea instanceof HTMLElement) {
              mainContentArea.scrollTop = 0
              mainContentArea.scrollLeft = 0
            }
            
            // Wait a bit for scroll to complete
            await new Promise(resolve => setTimeout(resolve, 100))
            
            // Get full scrollable dimensions (full page capture)
            const fullWidth = Math.max(
              mainContentArea.scrollWidth,
              (mainContentArea as HTMLElement).offsetWidth,
              document.documentElement.scrollWidth,
              window.innerWidth
            )
            const fullHeight = Math.max(
              mainContentArea.scrollHeight,
              (mainContentArea as HTMLElement).offsetHeight,
              document.documentElement.scrollHeight,
              window.innerHeight
            )
            
            // Capture full page with html2canvas
            const canvas = await html2canvas(mainContentArea as HTMLElement, {
              scale: 1,
              width: fullWidth,
              height: fullHeight,
              useCORS: true,
              logging: false,
              windowWidth: fullWidth,
              windowHeight: fullHeight,
              scrollX: 0,
              scrollY: 0,
              allowTaint: true,
              backgroundColor: '#f9fafb', // Match bg-gray-50
              ignoreElements: (element: Element) => {
                // Ignore sidebar, header, and overlay elements
                if (!(element instanceof HTMLElement)) return false;
                return element.tagName === 'HEADER' ||
                       (element.classList.contains('fixed') && 
                        (element.classList.contains('inset-y-0') || 
                         element.classList.contains('inset-0') ||
                         (element.getAttribute('class')?.includes('sidebar') ?? false)))
              }
            })
            
            // Restore original scroll position and overflow styles
            window.scrollTo(originalScrollLeft, originalScrollTop)
            if (mainContentArea instanceof HTMLElement) {
              mainContentArea.scrollTop = originalScrollTop
              mainContentArea.scrollLeft = originalScrollLeft
            }
            mainElement.style.overflow = originalOverflow
            mainElement.style.overflowX = originalOverflowX
            mainElement.style.overflowY = originalOverflowY
          
          // Create image with exact dimensions
          const link = document.createElement('a')
          link.download = `dashboard_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.jpg`
          link.href = canvas.toDataURL('image/jpeg', 0.95) // High quality JPEG
          link.click()
          alert(`JPGファイルをエクスポートしました (${fullWidth}x${fullHeight}px)`)
        }
      } finally {
        // Restore sidebar and header visibility
        if (sidebar) {
          sidebar.style.display = sidebarOriginalDisplay
          sidebar.style.visibility = sidebarOriginalVisibility
        }
        if (header) {
          header.style.display = headerOriginalDisplay
          header.style.visibility = headerOriginalVisibility
        }
      }
    } catch (error) {
      console.error('JPG export error:', error)
      alert('JPGエクスポートに失敗しました。ブラウザの印刷機能を使用してください。')
    }
  }

  const handleExportPDF = async () => {
    try {
      // Use jsPDF and html2canvas to create PDF
      if (typeof window !== 'undefined') {
        
        // Capture ONLY dashboard content (main element) - WITHOUT sidebar and header
        const mainContentArea = document.querySelector('main') || 
                               document.querySelector('[role="main"]') ||
                               document.body
        
        if (!mainContentArea) {
          alert('エクスポートするコンテンツが見つかりません')
          return
        }

        // Find and temporarily hide sidebar and header during capture
        const sidebar = document.querySelector('div.fixed.inset-y-0, div[class*="sidebar"], aside') as HTMLElement
        const header = document.querySelector('header') as HTMLElement
        const sidebarOriginalDisplay = sidebar?.style.display || ''
        const sidebarOriginalVisibility = sidebar?.style.visibility || ''
        const headerOriginalDisplay = header?.style.display || ''
        const headerOriginalVisibility = header?.style.visibility || ''
        
        if (sidebar) {
          sidebar.style.display = 'none'
          sidebar.style.visibility = 'hidden'
        }
        if (header) {
          header.style.display = 'none'
          header.style.visibility = 'hidden'
        }

        try {
          // Save original scroll position and overflow styles
          const originalScrollTop = window.pageYOffset || document.documentElement.scrollTop
          const originalScrollLeft = window.pageXOffset || document.documentElement.scrollLeft
          const mainElement = mainContentArea as HTMLElement
          const originalOverflow = mainElement.style.overflow || ''
          const originalOverflowX = mainElement.style.overflowX || ''
          const originalOverflowY = mainElement.style.overflowY || ''
          
          // Temporarily remove overflow restrictions to capture full content
          mainElement.style.overflow = 'visible'
          mainElement.style.overflowX = 'visible'
          mainElement.style.overflowY = 'visible'
          
          // Scroll to top-left to capture from beginning
          window.scrollTo(0, 0)
          if (mainContentArea instanceof HTMLElement) {
            mainContentArea.scrollTop = 0
            mainContentArea.scrollLeft = 0
          }
          
          // Wait a bit for scroll to complete
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Get full scrollable dimensions (full page capture)
          const fullWidth = Math.max(
            mainContentArea.scrollWidth,
            (mainContentArea as HTMLElement).offsetWidth,
            document.documentElement.scrollWidth,
            window.innerWidth
          )
          const fullHeight = Math.max(
            mainContentArea.scrollHeight,
            (mainContentArea as HTMLElement).offsetHeight,
            document.documentElement.scrollHeight,
            window.innerHeight
          )

          const canvas = await html2canvas(mainContentArea as HTMLElement, {
            scale: 1,
            width: fullWidth,
            height: fullHeight,
            useCORS: true,
            logging: false,
            windowWidth: fullWidth,
            windowHeight: fullHeight,
            scrollX: 0,
            scrollY: 0,
            allowTaint: true,
            backgroundColor: '#f9fafb', // Match bg-gray-50
            ignoreElements: (element: Element) => {
              // Ignore sidebar, header, and overlay elements
              if (!(element instanceof HTMLElement)) return false;
              return element.tagName === 'HEADER' ||
                     (element.classList.contains('fixed') && 
                      (element.classList.contains('inset-y-0') || 
                       element.classList.contains('inset-0') ||
                       (element.getAttribute('class')?.includes('sidebar') ?? false)))
            }
          })
          
          // Restore original scroll position and overflow styles
          window.scrollTo(originalScrollLeft, originalScrollTop)
          if (mainContentArea instanceof HTMLElement) {
            mainContentArea.scrollTop = originalScrollTop
            mainContentArea.scrollLeft = originalScrollLeft
          }
          mainElement.style.overflow = originalOverflow
          mainElement.style.overflowX = originalOverflowX
          mainElement.style.overflowY = originalOverflowY
          
          const imgData = canvas.toDataURL('image/png', 1.0)
          
          // Convert pixels to mm (1 inch = 25.4mm, standard DPI is 96)
          const pxToMm = 25.4 / 96
          const pdfWidth = fullWidth * pxToMm
          const pdfHeight = fullHeight * pxToMm
          
          // Create PDF with exact dimensions matching the display
          const pdf = new jsPDF({
            orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [pdfWidth, pdfHeight] // Custom size matching display
          })
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')
          
          pdf.save(`dashboard_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`)
          alert(`PDFファイルをエクスポートしました (${Math.round(pdfWidth)}x${Math.round(pdfHeight)}mm)`)
        } finally {
          // Restore sidebar and header visibility
          if (sidebar) {
            sidebar.style.display = sidebarOriginalDisplay
            sidebar.style.visibility = sidebarOriginalVisibility
          }
          if (header) {
            header.style.display = headerOriginalDisplay
            header.style.visibility = headerOriginalVisibility
          }
        }
      }
    } catch (error) {
      console.error('PDF export error:', error)
      alert('PDFエクスポートに失敗しました。ブラウザの印刷機能を使用してください。')
    }
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-600">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">CliniCheck</h1>
                <p className="text-xs text-gray-500">MARKETING DASHBOARD</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-md lg:hidden hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onTabChange(item.id)}
                      className={`
                        w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors
                        ${isActive 
                          ? 'bg-primary-600 text-white' 
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Filters */}
          <div className="hidden p-4 space-y-4 border-t border-gray-200">
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">
                DateLevel
              </label>
              <select
                value={filters.dateLevel}
                onChange={(e) => setFilters({...filters, dateLevel: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="month">Month</option>
                <option value="week">Week</option>
                <option value="day">Day</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">
                期間選択
              </label>
              <select
                value={filters.period}
                onChange={(e) => setFilters({...filters, period: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="past1">過去1...</option>
                <option value="past3">過去3ヶ月</option>
                <option value="past6">過去6ヶ月</option>
                <option value="past12">過去12ヶ月</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">
                院選択
              </label>
              <select
                value={filters.clinic}
                onChange={(e) => setFilters({...filters, clinic: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">(すべて)</option>
                <option value="omiya">大宮院</option>
                <option value="yokohama">横浜院</option>
                <option value="mito">水戸院</option>
                <option value="koriyama">郡山院</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">
                成約閾値
              </label>
              <input
                type="number"
                value={filters.conversionThreshold}
                onChange={(e) => setFilters({...filters, conversionThreshold: parseInt(e.target.value)})}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Export Buttons */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <button 
                onClick={handleExportCSV}
                className="flex-1 py-2 text-xs btn btn-outline hover:bg-gray-100"
                title="CSV形式でデータをエクスポート"
              >
                <Download className="w-4 h-4 mr-1" />
                CSV
              </button>
              <button 
                onClick={handleExportJPG}
                className="flex-1 py-2 text-xs btn btn-outline hover:bg-gray-100"
                title="JPG形式でスクリーンショットをエクスポート"
              >
                <Download className="w-4 h-4 mr-1" />
                JPG
              </button>
              <button 
                onClick={handleExportPDF}
                className="flex-1 py-2 text-xs btn btn-outline hover:bg-gray-100"
                title="PDF形式でエクスポート"
              >
                <Download className="w-4 h-4 mr-1" />
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}