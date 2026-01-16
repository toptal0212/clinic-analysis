'use client'

import React, { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts'
import { loadGoalsFromStorage } from '@/lib/goalStorage'

interface DailyAnalysisProps {
  dateRange: { start: Date, end: Date }
}

function toDate(v: any) {
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

export default function DailyAnalysis({ dateRange }: DailyAnalysisProps) {
  const { state } = useDashboard()
  const [selectedClinic, setSelectedClinic] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const goals = useMemo(() => loadGoalsFromStorage(), [])

  // Get all daily accounts
  const allData = useMemo(() => {
    const all: any[] = []
    if (state.data.dailyAccounts?.length) all.push(...state.data.dailyAccounts)
    if (state.data.clinicData) {
      Object.values(state.data.clinicData).forEach((c: any) => {
        if (c?.dailyAccounts?.length) all.push(...c.dailyAccounts)
      })
    }
    return all
  }, [state.data.dailyAccounts, state.data.clinicData])

  // Parse selected month
  const [selectedYear, selectedMonthNum] = useMemo(() => {
    const [year, month] = selectedMonth.split('/').map(Number)
    return [year, month]
  }, [selectedMonth])

  // Get days in month
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonthNum, 0).getDate()
  }, [selectedYear, selectedMonthNum])

  // Get unique clinics/staff
  const entities = useMemo(() => {
    const clinicSet = new Set<string>()
    const staffSet = new Set<string>()
    
    allData.forEach((r: any) => {
      const clinic = r.clinicName || 'その他'
      clinicSet.add(clinic)
      
      if (Array.isArray(r.paymentItems) && r.paymentItems.length > 0) {
        r.paymentItems.forEach((it: any) => {
          const staff = it.mainStaffName || it.staffName || r.staffName || 'その他'
          if (staff) staffSet.add(staff)
        })
      } else {
        const staff = r.staffName || r.doctorName || 'その他'
        if (staff) staffSet.add(staff)
      }
    })
    
    return {
      clinics: Array.from(clinicSet).sort(),
      staff: Array.from(staffSet).sort()
    }
  }, [allData])

  // Calculate data for each entity (clinic or staff)
  const entityData = useMemo(() => {
    const entitiesToProcess = selectedClinic === 'all' 
      ? [...entities.clinics, ...entities.staff]
      : [selectedClinic]

    return entitiesToProcess.map(entity => {
      // Filter data for this entity
      const isClinic = entities.clinics.includes(entity)
      const entityRecords = allData.filter((r: any) => {
        const d = toDate(r.recordDate || r.visitDate || r.treatmentDate || r.accountingDate)
        if (!d) return false
        if (d.getFullYear() !== selectedYear || d.getMonth() + 1 !== selectedMonthNum) return false
        
        if (isClinic) {
          return (r.clinicName || 'その他') === entity
        } else {
          // Staff
          if (Array.isArray(r.paymentItems) && r.paymentItems.length > 0) {
            return r.paymentItems.some((it: any) => 
              (it.mainStaffName || it.staffName || r.staffName) === entity
            )
          }
          return (r.staffName || r.doctorName || 'その他') === entity
        }
      })

      // Calculate daily sales (1日-30日)
      const dailySales = new Array(31).fill(0) // 0-indexed, 1-30 used
      entityRecords.forEach((r: any) => {
        const d = toDate(r.recordDate || r.visitDate || r.treatmentDate || r.accountingDate)
        if (!d) return
        const day = d.getDate()
        if (day >= 1 && day <= 30) {
          let amount = 0
          if (Array.isArray(r.paymentItems) && r.paymentItems.length > 0) {
            amount = r.paymentItems.reduce((s: number, it: any) => s + (it.priceWithTax || 0), 0)
          } else {
            amount = r.totalWithTax || 0
          }
          dailySales[day] += amount
        }
      })

      // Calculate totals
      const totalRevenue = entityRecords.reduce((sum: number, r: any) => {
        if (Array.isArray(r.paymentItems) && r.paymentItems.length > 0) {
          return sum + r.paymentItems.reduce((s: number, it: any) => s + (it.priceWithTax || 0), 0)
        }
        return sum + (r.totalWithTax || 0)
      }, 0)

      const totalCount = entityRecords.length
      const existingCount = entityRecords.filter((r: any) => !r.isFirst).length
      const existingRatio = totalCount > 0 ? (existingCount / totalCount) * 100 : 0

      // Get target from goals
      const goal = goals.find(g => g.staffName === entity || g.staffName === `${entity}院`)
      const target = goal?.targetAmount || 45000000 // Default target
      const dailyTarget = target / daysInMonth
      const achievementDaily = totalRevenue / daysInMonth

      // Calculate second half of month (16日-末日)
      const secondHalfStart = 16
      const secondHalfRevenue = dailySales.slice(secondHalfStart).reduce((a, b) => a + b, 0)
      const secondHalfDays = daysInMonth - secondHalfStart + 1
      const secondHalfTarget = (target / daysInMonth) * secondHalfDays
      const secondHalfAchievementDaily = secondHalfRevenue / secondHalfDays

      // Calculate upsell (simplified - you may need to adjust based on actual data structure)
      const consultationCount = entityRecords.length
      const upsellCount = entityRecords.filter((r: any) => {
        // Check if record has multiple payment items or additional services
        return Array.isArray(r.paymentItems) && r.paymentItems.length > 1
      }).length
      const upsellRatio = consultationCount > 0 ? (upsellCount / consultationCount) * 100 : 0

      // Calculate treatment request ratio (simplified)
      const consultedCount = entityRecords.length
      const csNextWeekCount = entityRecords.filter((r: any) => {
        // Placeholder logic - adjust based on actual data
        return r.appointmentDate && new Date(r.appointmentDate) > new Date(r.recordDate)
      }).length
      const sameDayCount = entityRecords.filter((r: any) => {
        const recordDate = toDate(r.recordDate || r.visitDate)
        const appointmentDate = toDate(r.appointmentDate)
        if (!recordDate || !appointmentDate) return false
        return recordDate.toISOString().split('T')[0] === appointmentDate.toISOString().split('T')[0]
      }).length
      const overallCount = consultedCount

      return {
        name: entity,
        dailySales,
        totalRevenue,
        totalCount,
        existingCount,
        existingRatio,
        target,
        dailyTarget,
        achievementDaily,
        secondHalfRevenue,
        secondHalfTarget,
        secondHalfAchievementDaily,
        consultationCount,
        upsellCount,
        upsellRatio,
        consultedCount,
        csNextWeekCount,
        sameDayCount,
        overallCount
      }
    })
  }, [allData, selectedClinic, selectedYear, selectedMonthNum, daysInMonth, goals, entities])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ja-JP').format(num)
  }

  if (!state.apiConnected || allData.length === 0) {
    return (
      <div className="p-6">
        <div className="p-8 text-center bg-white border rounded-lg shadow-sm">
          <p className="text-lg text-gray-600">データがありません</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">集計（日別）</h2>
      </div>

      {/* Filters */}
      <div className="p-4 mb-4 bg-white border rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="clinic-select" className="text-sm font-medium text-gray-700">大宮院</label>
            <select
              id="clinic-select"
              value={selectedClinic}
              onChange={(e) => setSelectedClinic(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">すべて</option>
              {entities.clinics.map(clinic => (
                <option key={clinic} value={clinic}>{clinic}</option>
              ))}
              {entities.staff.map(staff => (
                <option key={staff} value={staff}>{staff}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={selectedMonth.replace('/', '年') + '月'}
              readOnly
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md w-32"
            />
            <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
              移行
            </button>
          </div>
        </div>
      </div>

      {/* Main Table - Horizontal Scroll for Multiple Entities */}
      <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="bg-blue-100 border-b">
              <th className="sticky left-0 z-10 px-2 py-2 text-center bg-blue-100 border-r border-gray-300 font-medium text-gray-900" rowSpan={3}>
                
              </th>
              {entityData.map((entity, idx) => (
                <th 
                  key={idx} 
                  className="px-3 py-2 text-center bg-blue-200 border-r border-gray-300 font-semibold text-gray-900 min-w-[180px]"
                  colSpan={3}
                >
                  {entity.name}
                </th>
              ))}
            </tr>
            <tr className="bg-blue-50 border-b">
              {entityData.map((entity, idx) => (
                <React.Fragment key={idx}>
                  <th className="px-2 py-1 text-center bg-yellow-50 border-r border-gray-300 font-medium text-gray-700">目標</th>
                  <th className="px-2 py-1 text-center bg-yellow-50 border-r border-gray-300 font-medium text-gray-700">実績・予約</th>
                  <th className="px-2 py-1 text-center bg-yellow-50 border-r border-gray-300 font-medium text-gray-700">既存割合</th>
                </React.Fragment>
              ))}
            </tr>
            <tr className="bg-blue-50 border-b">
              {entityData.map((entity, idx) => (
                <React.Fragment key={idx}>
                  <th className="px-2 py-1 text-right bg-white border-r border-gray-300 text-[10px] text-gray-600">
                    {(entity.target / 10000).toFixed(0)}万
                  </th>
                  <th className="px-2 py-1 text-right bg-white border-r border-gray-300 text-[10px] text-gray-600">
                    {(entity.totalRevenue / 10000).toFixed(0)}万
                  </th>
                  <th className="px-2 py-1 text-right bg-white border-r border-gray-300 text-[10px] text-gray-600">
                    {entity.existingRatio.toFixed(0)}%
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
              <tr key={day} className={day % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="sticky left-0 z-10 px-3 py-1 text-center font-medium text-gray-900 bg-blue-100 border-r border-b border-gray-300">
                  {day}日
                </td>
                {entityData.map((entity, idx) => {
                  const dailyAmount = entity.dailySales[day] || 0
                  const dailyTarget = entity.dailyTarget
                  const achievementRate = dailyTarget > 0 ? (dailyAmount / dailyTarget) * 100 : 0
                  const bgColor = dailyAmount === 0 ? 'bg-white' : 
                                achievementRate >= 100 ? 'bg-green-50' : 
                                achievementRate >= 80 ? 'bg-yellow-50' : 'bg-orange-50'
                  
                  return (
                    <React.Fragment key={idx}>
                      <td className={`px-2 py-1 text-right border-r border-b border-gray-300 ${bgColor}`}>
                        <div className="text-[10px] text-gray-600">
                          {(dailyTarget / 10000).toFixed(0)}万
                        </div>
                      </td>
                      <td className={`px-2 py-1 text-right border-r border-b border-gray-300 ${bgColor}`}>
                        <div className="font-medium text-gray-900">
                          {dailyAmount > 0 ? (dailyAmount / 10000).toFixed(0) + '万' : '-'}
                        </div>
                        {dailyAmount > 0 && (
                          <div className="text-[9px] text-gray-500">
                            {achievementRate.toFixed(0)}%
                          </div>
                        )}
                      </td>
                      <td className={`px-2 py-1 text-center border-r border-b border-gray-300 ${bgColor}`}>
                        <div className="text-[10px] text-gray-600">
                          全体
                        </div>
                      </td>
                    </React.Fragment>
                  )
                })}
              </tr>
            ))}
            {/* Summary Row */}
            <tr className="bg-blue-100 border-t-2 border-gray-400 font-bold">
              <td className="sticky left-0 z-10 px-3 py-2 text-center text-gray-900 bg-blue-100 border-r border-gray-300">
                合計
              </td>
              {entityData.map((entity, idx) => (
                <React.Fragment key={idx}>
                  <td className="px-2 py-2 text-right bg-blue-100 border-r border-gray-300">
                    {(entity.target / 10000).toFixed(0)}万
                  </td>
                  <td className="px-2 py-2 text-right bg-blue-100 border-r border-gray-300">
                    {(entity.totalRevenue / 10000).toFixed(0)}万
                  </td>
                  <td className="px-2 py-2 text-right bg-blue-100 border-r border-gray-300">
                    {entity.existingRatio.toFixed(0)}%
                  </td>
                </React.Fragment>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
