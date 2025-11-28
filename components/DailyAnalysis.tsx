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
    <div className="space-y-6">
      {/* Filters */}
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="clinic-select" className="text-sm font-medium text-gray-700">院:</label>
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
            <label htmlFor="month-select" className="text-sm font-medium text-gray-700">月:</label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {(() => {
                const options = []
                const now = new Date()
                for (let i = 11; i >= 0; i--) {
                  const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                  const value = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`
                  options.push(
                    <option key={value} value={value}>{value}</option>
                  )
                }
                return options
              })()}
            </select>
          </div>
          <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
            使用
          </button>
        </div>
      </div>

      {/* Entity Blocks - Horizontal Scroll */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          {entityData.map((entity, idx) => (
            <div key={idx} className="flex-shrink-0 w-80 p-4 bg-white border rounded-lg shadow-sm">
              {/* Header */}
              <div className="mb-3">
                <h3 className="text-base font-semibold text-gray-900">{entity.name}</h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-600">日別売上</span>
                  <span className="text-xs font-medium text-gray-900">
                    既存の割合: {Math.round(entity.existingRatio)}%
                  </span>
                </div>
              </div>

              {/* Overall Summary */}
              <div className="mb-3 p-2 bg-gray-50 rounded-md">
                <div className="text-xs font-semibold text-gray-700 mb-1.5">全体</div>
                <div className="space-y-0.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">目標:</span>
                    <span className="font-medium">{formatCurrency(entity.target)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">実績:</span>
                    <span className="font-medium">{formatCurrency(entity.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">目標達成額(日):</span>
                    <span className="font-medium">
                      {formatCurrency(entity.achievementDaily)}
                      {entity.achievementDaily >= entity.dailyTarget && (
                        <span className="ml-1 text-green-600">達成</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Daily Breakdown */}
              <div className="mb-3">
                <div className="text-xs font-semibold text-gray-700 mb-1.5">
                  1日 - {daysInMonth}日 / -日
                </div>
                <div className="grid grid-cols-6 gap-0.5 text-[10px] max-h-48 overflow-y-auto">
                  {Array.from({ length: Math.min(30, daysInMonth) }, (_, i) => i + 1).map(day => (
                    <div key={day} className="p-0.5 text-center border border-gray-200 rounded">
                      <div className="text-gray-500 text-[9px]">{day}</div>
                      <div className="font-medium text-gray-900 text-[9px] leading-tight">
                        {entity.dailySales[day] > 0 
                          ? (entity.dailySales[day] / 10000).toFixed(0) + '万'
                          : '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mid-Month Summary */}
              <div className="mb-3 p-2 bg-gray-50 rounded-md">
                <div className="text-xs font-semibold text-gray-700 mb-1.5">月後半(16-末日)</div>
                <div className="space-y-0.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">目標:</span>
                    <span className="font-medium">{formatCurrency(entity.secondHalfTarget)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">実績:</span>
                    <span className="font-medium">{formatCurrency(entity.secondHalfRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">目標達成額(日):</span>
                    <span className="font-medium">
                      {formatCurrency(entity.secondHalfAchievementDaily)}
                      {entity.secondHalfAchievementDaily >= (entity.secondHalfTarget / (daysInMonth - 15)) && (
                        <span className="ml-1 text-green-600">達成</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Upsell */}
              <div className="mb-3 p-2 bg-gray-50 rounded-md">
                <div className="text-xs font-semibold text-gray-700 mb-1.5">アップセル</div>
                <div className="space-y-0.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">相談件数:</span>
                    <span className="font-medium">{formatNumber(entity.consultationCount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">アップセル件数:</span>
                    <span className="font-medium">{formatNumber(entity.upsellCount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">割合:</span>
                    <span className="font-medium">{Math.round(entity.upsellRatio)}%</span>
                  </div>
                </div>
              </div>

              {/* Treatment Request Ratio */}
              <div className="p-2 bg-gray-50 rounded-md">
                <div className="text-xs font-semibold text-gray-700 mb-1.5">処置希望割合</div>
                <div className="space-y-0.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">相談済み:</span>
                    <span className="font-medium">
                      {formatNumber(entity.consultedCount)}/{formatNumber(entity.consultedCount)} ({entity.consultedCount > 0 ? 100 : 0}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">CS次週:</span>
                    <span className="font-medium">
                      {formatNumber(entity.csNextWeekCount)}/{formatNumber(entity.consultedCount)} ({entity.consultedCount > 0 ? Math.round((entity.csNextWeekCount / entity.consultedCount) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">当日希望:</span>
                    <span className="font-medium">
                      {formatNumber(entity.sameDayCount)}/{formatNumber(entity.consultedCount)} ({entity.consultedCount > 0 ? Math.round((entity.sameDayCount / entity.consultedCount) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">全体:</span>
                    <span className="font-medium">
                      {formatNumber(entity.overallCount)}/{formatNumber(entity.overallCount)} ({entity.overallCount > 0 ? 100 : 0}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
