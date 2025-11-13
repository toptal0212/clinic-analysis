'use client'

import { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'

interface DataTableProps {
  data?: any[]
}

export default function DataTable({ data }: DataTableProps) {
  const { state } = useDashboard()
  const [sortField, setSortField] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'summary' | 'patients' | 'accounting'>('summary')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage] = useState<number>(10)

  // Generate monthly summary data from daily accounts API
  const monthlyData = useMemo(() => {
    if (!state.apiConnected || !state.data.dailyAccounts.length) {
      return []
    }

    // Group daily accounts data by month
    const monthlyGroups = new Map<string, {
      period: string
      records: any[]
    }>()

    state.data.dailyAccounts.forEach(record => {
      const recordDate = new Date(record.recordDate)
      const monthKey = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`
      const periodLabel = recordDate.toLocaleDateString('ja-JP', { month: 'short', year: '2-digit' })
      
      if (!monthlyGroups.has(monthKey)) {
        monthlyGroups.set(monthKey, {
          period: periodLabel,
          records: []
        })
      }
      monthlyGroups.get(monthKey)!.records.push(record)
    })

    // Convert to array and calculate metrics
    return Array.from(monthlyGroups.entries())
      .map(([key, group]) => {
        const visits = group.records.length
        const revenue = group.records.reduce((sum, record) => sum + (record.totalWithTax || 0), 0)
        const avgPrice = visits > 0 ? revenue / visits : 0

        // Calculate new vs returning patients
        const newPatients = group.records.filter(record => record.isFirst).length
        const returningPatients = visits - newPatients
        const newPatientRate = visits > 0 ? (newPatients / visits) * 100 : 0
        const returningPatientRate = visits > 0 ? (returningPatients / visits) * 100 : 0

        return {
          period: group.period,
          periodKey: key, // Store the monthKey for easier sorting (format: "YYYY-MM")
          visits,
          revenue,
          avgPrice,
          newPatients,
          returningPatients,
          newPatientRate,
          returningPatientRate
        }
      })
      .sort((a, b) => {
        // Sort by periodKey (YYYY-MM format) for accurate date sorting
        return a.periodKey.localeCompare(b.periodKey)
      })
  }, [state.apiConnected, state.data.dailyAccounts])

  // Apply sorting to table data
  const sortedData = useMemo(() => {
    if (!sortField) return monthlyData

    return [...monthlyData].sort((a, b) => {
      // Special handling for period/date sorting
      if (sortField === 'period') {
        // Use periodKey (YYYY-MM format) for accurate date sorting
        if (a.periodKey && b.periodKey) {
          return sortDirection === 'asc' 
            ? a.periodKey.localeCompare(b.periodKey)
            : b.periodKey.localeCompare(a.periodKey)
        }
        // Fallback to period string comparison if periodKey is not available
        return sortDirection === 'asc' 
          ? a.period.localeCompare(b.period)
          : b.period.localeCompare(a.period)
      }
      
      const aValue = a[sortField as keyof typeof a]
      const bValue = b[sortField as keyof typeof b]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' 
          ? aValue - bValue
          : bValue - aValue
      }
      
      return 0
    })
  }, [monthlyData, sortField, sortDirection])

  // Sort patients and accounting data
  const sortedPatientsData = useMemo(() => {
    const patients = state.data.dailyAccounts || []
    if (!sortField || viewMode !== 'patients') return patients

    return [...patients].sort((a, b) => {
      // Handle clinic sorting
      if (sortField === 'clinic' || sortField === 'clinicName') {
        const aClinic = a.clinicName || 'その他'
        const bClinic = b.clinicName || 'その他'
        return sortDirection === 'asc' 
          ? aClinic.localeCompare(bClinic, 'ja')
          : bClinic.localeCompare(aClinic, 'ja')
      }
      
      // Handle date sorting
      if (sortField === 'recordDate' || sortField === 'date') {
        const aDate = new Date(a.recordDate || 0)
        const bDate = new Date(b.recordDate || 0)
        return sortDirection === 'asc' 
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime()
      }
      
      const aValue = a[sortField as keyof typeof a]
      const bValue = b[sortField as keyof typeof b]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue, 'ja')
          : bValue.localeCompare(aValue, 'ja')
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' 
          ? aValue - bValue
          : bValue - aValue
      }
      
      return 0
    })
  }, [state.data.dailyAccounts, sortField, sortDirection, viewMode])

  const sortedAccountingData = useMemo(() => {
    const accounting = state.data.dailyAccounts || []
    if (!sortField || viewMode !== 'accounting') return accounting

    return [...accounting].sort((a, b) => {
      // Handle clinic sorting
      if (sortField === 'clinic' || sortField === 'clinicName') {
        const aClinic = a.clinicName || 'その他'
        const bClinic = b.clinicName || 'その他'
        return sortDirection === 'asc' 
          ? aClinic.localeCompare(bClinic, 'ja')
          : bClinic.localeCompare(aClinic, 'ja')
      }
      
      // Handle date sorting
      if (sortField === 'recordDate' || sortField === 'date') {
        const aDate = new Date(a.recordDate || 0)
        const bDate = new Date(b.recordDate || 0)
        return sortDirection === 'asc' 
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime()
      }
      
      const aValue = a[sortField as keyof typeof a]
      const bValue = b[sortField as keyof typeof b]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue, 'ja')
          : bValue.localeCompare(aValue, 'ja')
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' 
          ? aValue - bValue
          : bValue - aValue
      }
      
      return 0
    })
  }, [state.data.dailyAccounts, sortField, sortDirection, viewMode])

  // Get data source based on view mode
  const getDataSource = () => {
    switch (viewMode) {
      case 'summary':
        return sortedData
      case 'patients':
        return sortedPatientsData
      case 'accounting':
        return sortedAccountingData
      default:
        return []
    }
  }

  // Pagination calculations
  const dataSource = getDataSource()
  const totalItems = dataSource.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = dataSource.slice(startIndex, endIndex)

  // Reset to first page when view mode changes
  const handleViewModeChange = (mode: 'summary' | 'patients' | 'accounting') => {
    setViewMode(mode)
    setCurrentPage(1)
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setCurrentPage(1) // Reset to first page when sorting
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const formatCurrency = (value: number) => {
    if (value === 0) return '-'
    return `¥${value.toLocaleString()}`
  }

  const formatPercentage = (value: number) => {
    if (value === 0) return '-'
    return `${value}%`
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) return '↕️'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="card">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="pl-5 text-lg font-semibold text-gray-900">データ分析</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewModeChange('summary')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              viewMode === 'summary'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            月次サマリー
          </button>
          <button
            onClick={() => handleViewModeChange('patients')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              viewMode === 'patients'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            患者データ
          </button>
          <button
            onClick={() => handleViewModeChange('accounting')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              viewMode === 'accounting'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            会計データ
          </button>
        </div>
      </div>

      {/* Data Display */}
      {viewMode === 'summary' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('period')}
                >
                  期間 {getSortIcon('period')}
                </th>
                <th 
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('visits')}
                >
                  来院数 {getSortIcon('visits')}
                </th>
                <th 
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('revenue')}
                >
                  売上 {getSortIcon('revenue')}
                </th>
                <th 
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('avgPrice')}
                >
                  会計単価 {getSortIcon('avgPrice')}
                </th>
                <th 
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('newPatients')}
                >
                  新規患者数 {getSortIcon('newPatients')}
                </th>
                <th 
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('returningPatients')}
                >
                  既存患者数 {getSortIcon('returningPatients')}
                </th>
                <th 
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('newPatientRate')}
                >
                  新規患者率 {getSortIcon('newPatientRate')}
                </th>
                <th 
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('returningPatientRate')}
                >
                  既存患者率 {getSortIcon('returningPatientRate')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.length > 0 ? (
                paginatedData.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {row.period}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {row.visits.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {formatCurrency(row.revenue)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {formatCurrency(row.avgPrice)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {row.newPatients.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {row.returningPatients.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {formatPercentage(row.newPatientRate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {formatPercentage(row.returningPatientRate)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-sm text-center text-gray-500">
                    {state.apiConnected ? 'データがありません' : 'データ接続が必要です'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Patient Data View */}
      {viewMode === 'patients' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  来院者ID
                </th>
                <th 
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('clinicName')}
                >
                  院 {getSortIcon('clinicName')}
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  氏名
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  年齢
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  性別
                </th>
                <th 
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('recordDate')}
                >
                  来院日 {getSortIcon('recordDate')}
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  初診/再診
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  流入元
                </th>
                <th 
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('totalWithTax')}
                >
                  売上 {getSortIcon('totalWithTax')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.apiConnected && paginatedData.length > 0 ? (
                paginatedData.map((record, index) => (
                  <tr key={record.visitorId || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {record.visitorId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {record.clinicName || 'その他'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {record.visitorName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {record.visitorAge || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {record.visitorGender || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {new Date(record.recordDate).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {record.isFirst ? '初診' : '再診'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {record.visitorInflowSourceName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {formatCurrency(record.totalWithTax || 0)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-sm text-center text-gray-500">
                    {state.apiConnected ? 'データがありません' : 'データ接続が必要です'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Accounting Data View */}
      {viewMode === 'accounting' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  来院者ID
                </th>
                <th 
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('clinicName')}
                >
                  院 {getSortIcon('clinicName')}
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  氏名
                </th>
                <th 
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('totalWithTax')}
                >
                  総額（税込） {getSortIcon('totalWithTax')}
                </th>
                <th 
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('netTotal')}
                >
                  総額（税抜） {getSortIcon('netTotal')}
                </th>
                <th 
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('recordDate')}
                >
                  来院日 {getSortIcon('recordDate')}
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  支払い方法
                </th>
                <th 
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('otherDiscountPrice')}
                >
                  割引額 {getSortIcon('otherDiscountPrice')}
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  備考
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.apiConnected && paginatedData.length > 0 ? (
                paginatedData.map((record, index) => (
                  <tr key={record.visitorId || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {record.visitorId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {record.clinicName || 'その他'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {record.visitorName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {formatCurrency(record.totalWithTax || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {formatCurrency(record.netTotal || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {new Date(record.recordDate).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {Object.keys(record.methodPrice || {}).join(', ') || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {formatCurrency(record.otherDiscountPrice || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {record.note || 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-sm text-center text-gray-500">
                    {state.apiConnected ? 'データがありません' : 'データ接続が必要です'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 mt-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center text-sm text-gray-700">
            <span>
              {startIndex + 1} - {Math.min(endIndex, totalItems)} / {totalItems} 件
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Previous Button */}
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              前へ
            </button>
            
            {/* Page Numbers */}
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber
                if (totalPages <= 5) {
                  pageNumber = i + 1
                } else if (currentPage <= 3) {
                  pageNumber = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i
                } else {
                  pageNumber = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === pageNumber
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                )
              })}
            </div>
            
            {/* Next Button */}
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              次へ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}