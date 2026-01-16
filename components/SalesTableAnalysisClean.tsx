'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'

interface SalesTableAnalysisProps {
  dateRange: { start: Date, end: Date }
}

interface RecordRow {
  id: string
  recordDate: string
  clinicName: string
  visitorName: string
  age: string
  staffName: string
  treatmentCategory: string
  treatmentName: string
  amount: number
  paymentMethod: string
  referralSource: string
  reservationRoute: string
  notes: string
  status: string
}

export default function SalesTableAnalysisClean({ dateRange }: SalesTableAnalysisProps) {
  const { state } = useDashboard()
  
  // Extract available months from data
  const availableMonths = useMemo(() => {
    if (!state.data.dailyAccounts?.length) return []
    
    const months = new Set<string>()
    state.data.dailyAccounts.forEach(record => {
      const visitDate = record.visitDate || record.recordDate || record.accountingDate
      if (visitDate) {
        const date = new Date(visitDate)
        if (!isNaN(date.getTime())) {
          const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          months.add(month)
        }
      }
    })
    
    return Array.from(months).sort().reverse()
  }, [state.data.dailyAccounts])
  
  const [selectedMonth, setSelectedMonth] = useState<string>(availableMonths[0] || '')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedClinic, setSelectedClinic] = useState<string>('all')
  
  // Update selected month when available months change
  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0])
    }
  }, [availableMonths, selectedMonth])

  // Get unique clinics
  const availableClinics = useMemo(() => {
    if (!state.data.dailyAccounts?.length) return []
    
    const clinics = new Set<string>()
    state.data.dailyAccounts.forEach(record => {
      if (record.clinicName) {
        clinics.add(record.clinicName)
      }
    })
    
    return Array.from(clinics).sort()
  }, [state.data.dailyAccounts])

  // Process records into table rows
  const tableRows = useMemo((): RecordRow[] => {
    if (!state.data.dailyAccounts?.length || !selectedMonth) return []
    
    const targetMonthData = state.data.dailyAccounts.filter(record => {
      const visitDate = record.visitDate || record.recordDate || record.accountingDate
      if (!visitDate) return false
      
      const date = new Date(visitDate)
      if (isNaN(date.getTime())) return false
      
      const recordMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (recordMonth !== selectedMonth) return false
      
      // Filter by clinic
      if (selectedClinic !== 'all' && record.clinicName !== selectedClinic) return false
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const visitorName = (record.visitorName || '').toLowerCase()
        const treatmentName = (record.treatmentName || '').toLowerCase()
        const staffName = (record.staffName || '').toLowerCase()
        
        if (!visitorName.includes(searchLower) && 
            !treatmentName.includes(searchLower) && 
            !staffName.includes(searchLower)) {
          return false
        }
      }
      
      return true
    })

    return targetMonthData.map((record, index) => {
      const visitDate = record.visitDate || record.recordDate || record.accountingDate
      const date = visitDate ? new Date(visitDate) : null
      const dateStr = date && !isNaN(date.getTime()) 
        ? `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
        : '-'

      // Calculate age
      let age = '-'
      if (record.visitorBirthDate) {
        const birthDate = new Date(record.visitorBirthDate)
        if (!isNaN(birthDate.getTime()) && date) {
          const ageYears = Math.floor((date.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          age = `${ageYears}歳`
        }
      }

      // Determine status
      let status = '通常'
      if (record.isFirst === true || record.isFirstVisit === true) {
        status = '初来'
      } else if (record.paymentTags?.includes('物販') || record.visitorName?.includes('物販')) {
        status = '物販'
      }

      return {
        id: record.visitorId || `record-${index}`,
        recordDate: dateStr,
        clinicName: record.clinicName || '未設定',
        visitorName: record.visitorName || '不明',
        age,
        staffName: record.staffName || record.doctorName || '-',
        treatmentCategory: record.treatmentCategory || '-',
        treatmentName: record.treatmentName || '-',
        amount: record.totalWithTax || 0,
        paymentMethod: record.paymentMethod || '-',
        referralSource: record.visitorInflowSourceName || record.visitorInflowSourceLabel || '-',
        reservationRoute: record.reservationInflowPathLabel || record.reservationRoute || '-',
        notes: record.notes || record.memo || '',
        status
      }
    })
  }, [state.data.dailyAccounts, selectedMonth, selectedClinic, searchTerm])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate summary
  const summary = useMemo(() => {
    const total = tableRows.reduce((sum, row) => sum + row.amount, 0)
    const count = tableRows.length
    const avgAmount = count > 0 ? total / count : 0
    
    return {
      total,
      count,
      avgAmount
    }
  }, [tableRows])

  return (
    <div className="p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">売上表</h2>
      </div>

      {/* Filters */}
      <div className="p-4 mb-4 bg-white border rounded-lg shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">院:</label>
            <select
              value={selectedClinic}
              onChange={(e) => setSelectedClinic(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">すべて</option>
              {availableClinics.map(clinic => (
                <option key={clinic} value={clinic}>{clinic}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">月:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">月を選択してください</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {month.replace('-', '年')}月
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">検索:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="名前、施術、スタッフ"
              className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-3">
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">合計売上</div>
          <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.total)}</div>
        </div>
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">件数</div>
          <div className="text-2xl font-bold text-green-600">{summary.count}件</div>
        </div>
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">平均単価</div>
          <div className="text-2xl font-bold text-purple-600">{formatCurrency(summary.avgAmount)}</div>
        </div>
      </div>

      {/* Main Table */}
      {tableRows.length > 0 ? (
        <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
          <table className="min-w-full border-collapse text-xs">
            <thead>
              <tr className="bg-blue-100 border-b">
                <th className="px-3 py-2 text-left border-r border-gray-300 font-medium text-gray-900">日付</th>
                <th className="px-3 py-2 text-left border-r border-gray-300 font-medium text-gray-900">院</th>
                <th className="px-3 py-2 text-left border-r border-gray-300 font-medium text-gray-900">状態</th>
                <th className="px-3 py-2 text-left border-r border-gray-300 font-medium text-gray-900">名前</th>
                <th className="px-3 py-2 text-left border-r border-gray-300 font-medium text-gray-900">年齢</th>
                <th className="px-3 py-2 text-left border-r border-gray-300 font-medium text-gray-900">担当者</th>
                <th className="px-3 py-2 text-left border-r border-gray-300 font-medium text-gray-900">カテゴリー</th>
                <th className="px-3 py-2 text-left border-r border-gray-300 font-medium text-gray-900">施術名</th>
                <th className="px-3 py-2 text-right border-r border-gray-300 font-medium text-gray-900">金額</th>
                <th className="px-3 py-2 text-left border-r border-gray-300 font-medium text-gray-900">支払方法</th>
                <th className="px-3 py-2 text-left border-r border-gray-300 font-medium text-gray-900">知ったきっかけ</th>
                <th className="px-3 py-2 text-left border-r border-gray-300 font-medium text-gray-900">予約経路</th>
                <th className="px-3 py-2 text-left border-gray-300 font-medium text-gray-900">備考</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, index) => (
                <tr 
                  key={row.id} 
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 border-b`}
                >
                  <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">{row.recordDate}</td>
                  <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">{row.clinicName}</td>
                  <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">
                    <span className={`px-2 py-1 text-[10px] rounded ${
                      row.status === '初来' ? 'bg-green-100 text-green-800' :
                      row.status === '物販' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap font-medium">{row.visitorName}</td>
                  <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap text-center">{row.age}</td>
                  <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">{row.staffName}</td>
                  <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">{row.treatmentCategory}</td>
                  <td className="px-3 py-2 border-r border-gray-300">{row.treatmentName}</td>
                  <td className="px-3 py-2 border-r border-gray-300 text-right font-medium whitespace-nowrap">
                    {formatCurrency(row.amount)}
                  </td>
                  <td className="px-3 py-2 border-r border-gray-300 whitespace-nowrap">{row.paymentMethod}</td>
                  <td className="px-3 py-2 border-r border-gray-300">{row.referralSource}</td>
                  <td className="px-3 py-2 border-r border-gray-300">{row.reservationRoute}</td>
                  <td className="px-3 py-2 border-gray-300 text-gray-600 text-[10px]">
                    {row.notes ? row.notes.substring(0, 50) + (row.notes.length > 50 ? '...' : '') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-200 border-t-2 border-gray-400 font-bold">
                <td colSpan={8} className="px-3 py-2 text-right border-r border-gray-300">合計:</td>
                <td className="px-3 py-2 text-right border-r border-gray-300">{formatCurrency(summary.total)}</td>
                <td colSpan={4} className="px-3 py-2 text-left border-gray-300">
                  {summary.count}件 / 平均: {formatCurrency(summary.avgAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center bg-white border rounded-lg">
          <p className="text-lg text-gray-600">データがありません</p>
          <p className="mt-1 text-sm text-gray-500">
            フィルター条件を変更してください
          </p>
        </div>
      )}
    </div>
  )
}
