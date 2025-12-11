'use client'

import React, { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { categorizeTreatment } from '@/lib/treatmentCategories'
import { AlertCircle } from 'lucide-react'

export default function ClinicComparison() {
  const { state } = useDashboard()

  // Get all daily accounts data
  const getAllDailyAccounts = () => {
    const allData: any[] = []
    
    if (state.data?.dailyAccounts && Array.isArray(state.data.dailyAccounts)) {
      allData.push(...state.data.dailyAccounts)
    }
    
    if (state.data?.clinicData) {
      Object.values(state.data.clinicData).forEach((clinic: any) => {
        if (clinic?.dailyAccounts && Array.isArray(clinic.dailyAccounts)) {
          allData.push(...clinic.dailyAccounts)
        }
      })
    }
    
    return allData
  }

  // Helper to parse date
  const parseDate = (record: any): Date | null => {
    const dateStr = record.recordDate || record.visitDate || record.treatmentDate || record.accountingDate
    if (!dateStr) return null
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? null : date
  }

  // Get available clinics from data
  const availableClinics = useMemo(() => {
    const allData = getAllDailyAccounts()
    const clinics = new Set<string>()
    allData.forEach((r: any) => {
      const clinic = r.clinicName || 'その他'
      if (clinic) clinics.add(clinic)
    })
    return Array.from(clinics).sort()
  }, [state.data.dailyAccounts, state.data.clinicData])

  // Calculate revenue for a record
  const calculateRevenue = (record: any): number => {
    if (Array.isArray(record.paymentItems) && record.paymentItems.length > 0) {
      return record.paymentItems.reduce((sum: number, item: any) => sum + (item.priceWithTax || 0), 0)
    }
    return record.totalWithTax || 0
  }

  // Determine if record is beauty sales or other (piercing/products/anesthesia)
  const categorizeRevenue = (record: any): { beauty: number; other: number; piercing: number } => {
    const totalRevenue = calculateRevenue(record)
    let beauty = 0
    let other = 0
    let piercing = 0

    if (Array.isArray(record.paymentItems) && record.paymentItems.length > 0) {
      record.paymentItems.forEach((item: any) => {
        const amount = item.priceWithTax || 0
        const category = categorizeTreatment(item.category || '', item.name || '')
        
        if (category.specialty === 'other') {
          other += amount
          if (category.subcategory === 'ピアス') {
            piercing += amount
          }
        } else {
          beauty += amount
        }
      })
    } else {
      // Check payment tags or visitor name for piercing/products/anesthesia
      const paymentTags = record.paymentTags || ''
      const visitorName = record.visitorName || ''
      
      if (paymentTags.includes('ピアス') || visitorName.includes('ピアス')) {
        other += totalRevenue
        piercing += totalRevenue
      } else if (paymentTags.includes('物販') || visitorName.includes('物販')) {
        other += totalRevenue
      } else if (paymentTags.includes('麻酔') || paymentTags.includes('針') || paymentTags.includes('パック')) {
        other += totalRevenue
      } else {
        beauty += totalRevenue
      }
    }

    return { beauty, other, piercing }
  }

  // Determine patient type
  const determinePatientType = (record: any): 'new' | 'existing' => {
    if (record.isFirst === true || record.isFirstVisit === true) return 'new'
    return 'existing'
  }

  // Get consultation days for a month (unique dates)
  const getConsultationDays = (records: any[]): number => {
    const dates = new Set<string>()
    records.forEach(r => {
      const date = parseDate(r)
      if (date) {
        dates.add(date.toISOString().split('T')[0])
      }
    })
    return dates.size
  }

  // Calculate monthly data for all clinics
  const monthlyData = useMemo(() => {
    const allData = getAllDailyAccounts()
    if (allData.length === 0) return []

    const now = new Date()
    const months: { year: number; month: number; label: string }[] = []
    // Get last 24 months
    for (let i = 23; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        label: `${date.getFullYear()}年${date.getMonth() + 1}月`
      })
    }

    const clinicMap = new Map<string, any[]>()

    // Group records by clinic
    allData.forEach((r: any) => {
      const clinic = r.clinicName || 'その他'
      if (!clinicMap.has(clinic)) {
        clinicMap.set(clinic, [])
      }
      clinicMap.get(clinic)!.push(r)
    })

    return Array.from(clinicMap.entries()).map(([clinicName, clinicRecords]) => {
      const monthlyMetrics = months.map((m, idx) => {
        const monthData = clinicRecords.filter((r: any) => {
          const date = parseDate(r)
          if (!date) return false
          return date.getFullYear() === m.year && date.getMonth() === m.month
        })

        const newPatients = monthData.filter(r => determinePatientType(r) === 'new')
        const existingPatients = monthData.filter(r => determinePatientType(r) === 'existing')

        let beautyRevenue = 0
        let otherRevenue = 0
        let piercingRevenue = 0

        monthData.forEach(r => {
          const categorized = categorizeRevenue(r)
          beautyRevenue += categorized.beauty
          otherRevenue += categorized.other
          piercingRevenue += categorized.piercing
        })

        const totalRevenue = beautyRevenue + otherRevenue
        const consultationDays = getConsultationDays(monthData)
        const patientsPerDay = consultationDays > 0 ? monthData.length / consultationDays : 0

        // Calculate unit prices
        const newUnitPrice = newPatients.length > 0 
          ? newPatients.reduce((sum, r) => sum + calculateRevenue(r), 0) / newPatients.length 
          : 0
        const existingUnitPrice = existingPatients.length > 0 
          ? existingPatients.reduce((sum, r) => sum + calculateRevenue(r), 0) / existingPatients.length 
          : 0
        const totalUnitPrice = monthData.length > 0 ? totalRevenue / monthData.length : 0

        // Calculate unit price per day
        const newUnitPricePerDay = consultationDays > 0 && newPatients.length > 0
          ? (newPatients.reduce((sum, r) => sum + calculateRevenue(r), 0) / consultationDays)
          : 0
        const existingUnitPricePerDay = consultationDays > 0 && existingPatients.length > 0
          ? (existingPatients.reduce((sum, r) => sum + calculateRevenue(r), 0) / consultationDays)
          : 0

        // Get previous year same month data for comparison
        const prevYearMonthData = clinicRecords.filter((r: any) => {
          const date = parseDate(r)
          if (!date) return false
          return date.getFullYear() === m.year - 1 && date.getMonth() === m.month
        })

        let prevYearBeautyRevenue = 0
        let prevYearOtherRevenue = 0
        prevYearMonthData.forEach(r => {
          const categorized = categorizeRevenue(r)
          prevYearBeautyRevenue += categorized.beauty
          prevYearOtherRevenue += categorized.other
        })
        const prevYearTotalRevenue = prevYearBeautyRevenue + prevYearOtherRevenue

        // Calculate cumulative totals up to this month
        let cumulativeBeauty = 0
        let cumulativeOther = 0
        for (let i = 0; i <= idx; i++) {
          const prevMonthData = clinicRecords.filter((r: any) => {
            const date = parseDate(r)
            if (!date) return false
            return date.getFullYear() === months[i].year && date.getMonth() === months[i].month
          })
          prevMonthData.forEach(r => {
            const categorized = categorizeRevenue(r)
            cumulativeBeauty += categorized.beauty
            cumulativeOther += categorized.other
          })
        }
        const cumulativeTotal = cumulativeBeauty + cumulativeOther

        // Get previous year cumulative total
        let prevYearCumulativeBeauty = 0
        let prevYearCumulativeOther = 0
        for (let i = 0; i <= idx; i++) {
          const prevYearMonthData = clinicRecords.filter((r: any) => {
            const date = parseDate(r)
            if (!date) return false
            return date.getFullYear() === months[i].year - 1 && date.getMonth() === months[i].month
          })
          prevYearMonthData.forEach(r => {
            const categorized = categorizeRevenue(r)
            prevYearCumulativeBeauty += categorized.beauty
            prevYearCumulativeOther += categorized.other
          })
        }
        const prevYearCumulativeTotal = prevYearCumulativeBeauty + prevYearCumulativeOther

        return {
          year: m.year,
          month: m.month,
          label: m.label,
          beautyRevenue,
          otherRevenue,
          piercingRevenue,
          totalRevenue,
          cumulativeTotal,
          prevYearTotalRevenue,
          prevYearCumulativeTotal,
          monthlyYoY: prevYearTotalRevenue > 0 ? (totalRevenue / prevYearTotalRevenue) * 100 : 0,
          cumulativeYoY: prevYearCumulativeTotal > 0 ? (cumulativeTotal / prevYearCumulativeTotal) * 100 : 0,
          totalPatients: monthData.length,
          newPatients: newPatients.length,
          existingPatients: existingPatients.length,
          consultationDays,
          patientsPerDay,
          newUnitPrice,
          existingUnitPrice,
          totalUnitPrice,
          newUnitPricePerDay,
          existingUnitPricePerDay,
          // Calculate piercing unit price (only for patients who purchased piercing)
          piercingUnitPrice: (() => {
            const piercingPatients = monthData.filter(r => {
              const categorized = categorizeRevenue(r)
              return categorized.piercing > 0
            })
            return piercingPatients.length > 0 && piercingRevenue > 0
              ? piercingRevenue / piercingPatients.length
              : 0
          })()
        }
      })

      return {
        clinicName,
        monthlyMetrics
      }
    })
  }, [state.data.dailyAccounts, state.data.clinicData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ja-JP').format(Math.round(num))
  }

  const formatPercent = (num: number) => {
    return `${Math.round(num)}%`
  }

  const hasRealData = getAllDailyAccounts().length > 0

  if (!hasRealData) {
    return (
      <div className="p-6">
        <div className="p-8 text-center bg-white border rounded-lg shadow-sm">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-600">データがありません</p>
          <p className="mt-2 text-sm text-gray-500">APIに接続するかCSVファイルをインポートしてデータを表示してください</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-900">全院比較</h2>
      
      {monthlyData.map((clinicData) => {
        const isGunzan = clinicData.clinicName.includes('郡山') || clinicData.clinicName.includes('Gunzan')
        const months = clinicData.monthlyMetrics.map(m => m.label)
        const hasData = clinicData.monthlyMetrics.some(m => m.totalRevenue > 0 || m.totalPatients > 0)
        
        if (!hasData) return null

        return (
          <div key={clinicData.clinicName} className="p-4 bg-white border rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">{clinicData.clinicName}</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th rowSpan={2} className="sticky left-0 z-10 px-2 py-2 font-semibold text-left border border-gray-300 bg-gray-50">項目</th>
                    {months.map((month, idx) => {
                      const metric = clinicData.monthlyMetrics[idx]
                      if (metric.totalRevenue === 0 && metric.totalPatients === 0) return null
                      return (
                        <th key={idx} className="px-2 py-2 font-semibold text-center border border-gray-300">
                          {month}
                        </th>
                      )
                    })}
                    <th className="px-2 py-2 font-semibold text-center bg-gray-100 border border-gray-300">計</th>
                  </tr>
                  <tr>
                    {months.map((month, idx) => {
                      const metric = clinicData.monthlyMetrics[idx]
                      if (metric.totalRevenue === 0 && metric.totalPatients === 0) return null
                      return (
                        <th key={idx} className="px-2 py-2 text-xs text-gray-600 border border-gray-300">
                          {month}
                        </th>
                      )
                    })}
                    <th className="px-2 py-2 text-xs text-gray-600 bg-gray-100 border border-gray-300">計</th>
                  </tr>
                </thead>
                <tbody>
                  {/* 美容売上 */}
                  <tr>
                    <td className="sticky left-0 z-10 px-2 py-2 font-medium bg-white border border-gray-300">美容売上</td>
                    {clinicData.monthlyMetrics.map((metric, idx) => {
                      if (metric.totalRevenue === 0 && metric.totalPatients === 0) return null
                      return (
                        <td key={idx} className="px-2 py-2 text-right border border-gray-300">
                          {metric.beautyRevenue > 0 ? formatCurrency(metric.beautyRevenue) : '-'}
                        </td>
                      )
                    })}
                    <td className="px-2 py-2 font-semibold text-right border border-gray-300 bg-gray-50">
                      {formatCurrency(clinicData.monthlyMetrics.reduce((sum, m) => sum + m.beautyRevenue, 0))}
                    </td>
                  </tr>
                  
                  {/* その他収入 */}
                  <tr>
                    <td className="sticky left-0 z-10 px-2 py-2 font-medium bg-white border border-gray-300">その他収入</td>
                    {clinicData.monthlyMetrics.map((metric, idx) => {
                      if (metric.totalRevenue === 0 && metric.totalPatients === 0) return null
                      return (
                        <td key={idx} className="px-2 py-2 text-right border border-gray-300">
                          {metric.otherRevenue > 0 ? formatCurrency(metric.otherRevenue) : '-'}
                        </td>
                      )
                    })}
                    <td className="px-2 py-2 font-semibold text-right border border-gray-300 bg-gray-50">
                      {formatCurrency(clinicData.monthlyMetrics.reduce((sum, m) => sum + m.otherRevenue, 0))}
                    </td>
                  </tr>
                  
                  {/* 累計 */}
                  <tr>
                    <td className="sticky left-0 z-10 px-2 py-2 font-medium bg-white border border-gray-300">累計</td>
                    {clinicData.monthlyMetrics.map((metric, idx) => {
                      if (metric.totalRevenue === 0 && metric.totalPatients === 0) return null
                      return (
                        <td key={idx} className="px-2 py-2 text-right border border-gray-300">
                          {formatCurrency(metric.cumulativeTotal)}
                        </td>
                      )
                    })}
                    <td className="px-2 py-2 font-semibold text-right border border-gray-300 bg-gray-50">
                      {formatCurrency(clinicData.monthlyMetrics[clinicData.monthlyMetrics.length - 1]?.cumulativeTotal || 0)}
                    </td>
                  </tr>
                  
                  {/* 前年比(単月) */}
                  <tr>
                    <td className="sticky left-0 z-10 px-2 py-2 font-medium bg-white border border-gray-300">前年比(単月)</td>
                    {clinicData.monthlyMetrics.map((metric, idx) => {
                      if (metric.totalRevenue === 0 && metric.totalPatients === 0) return null
                      return (
                        <td key={idx} className="px-2 py-2 text-right border border-gray-300">
                          {metric.prevYearTotalRevenue > 0 ? formatPercent(metric.monthlyYoY) : '-'}
                        </td>
                      )
                    })}
                    <td className="px-2 py-2 text-right border border-gray-300 bg-gray-50">-</td>
                  </tr>
                  
                  {/* 前年比(累計) */}
                  <tr>
                    <td className="sticky left-0 z-10 px-2 py-2 font-medium bg-white border border-gray-300">前年比(累計)</td>
                    {clinicData.monthlyMetrics.map((metric, idx) => {
                      if (metric.totalRevenue === 0 && metric.totalPatients === 0) return null
                      return (
                        <td key={idx} className="px-2 py-2 text-right border border-gray-300">
                          {metric.prevYearCumulativeTotal > 0 ? formatPercent(metric.cumulativeYoY) : '-'}
                        </td>
                      )
                    })}
                    <td className="px-2 py-2 text-right border border-gray-300 bg-gray-50">-</td>
                  </tr>
                  
                  {/* 患者数 */}
                  <tr>
                    <td className="sticky left-0 z-10 px-2 py-2 font-medium bg-white border border-gray-300">患者数</td>
                    {clinicData.monthlyMetrics.map((metric, idx) => {
                      if (metric.totalRevenue === 0 && metric.totalPatients === 0) return null
                      return (
                        <td key={idx} className="px-2 py-2 text-right border border-gray-300">
                          {formatNumber(metric.totalPatients)}
                        </td>
                      )
                    })}
                    <td className="px-2 py-2 font-semibold text-right border border-gray-300 bg-gray-50">
                      {formatNumber(clinicData.monthlyMetrics.reduce((sum, m) => sum + m.totalPatients, 0))}
                    </td>
                  </tr>
                  
                  {/* 患者数（新規） */}
                  <tr>
                    <td className="sticky left-0 z-10 px-2 py-2 pl-4 font-medium bg-white border border-gray-300">患者数（新規）</td>
                    {clinicData.monthlyMetrics.map((metric, idx) => {
                      if (metric.totalRevenue === 0 && metric.totalPatients === 0) return null
                      return (
                        <td key={idx} className="px-2 py-2 text-right border border-gray-300">
                          {formatNumber(metric.newPatients)}
                        </td>
                      )
                    })}
                    <td className="px-2 py-2 font-semibold text-right border border-gray-300 bg-gray-50">
                      {formatNumber(clinicData.monthlyMetrics.reduce((sum, m) => sum + m.newPatients, 0))}
                    </td>
                  </tr>
                  
                  {/* 患者数（既存） */}
                  <tr>
                    <td className="sticky left-0 z-10 px-2 py-2 pl-4 font-medium bg-white border border-gray-300">患者数（既存）</td>
                    {clinicData.monthlyMetrics.map((metric, idx) => {
                      if (metric.totalRevenue === 0 && metric.totalPatients === 0) return null
                      return (
                        <td key={idx} className="px-2 py-2 text-right border border-gray-300">
                          {formatNumber(metric.existingPatients)}
                        </td>
                      )
                    })}
                    <td className="px-2 py-2 font-semibold text-right border border-gray-300 bg-gray-50">
                      {formatNumber(clinicData.monthlyMetrics.reduce((sum, m) => sum + m.existingPatients, 0))}
                    </td>
                  </tr>
                  
                  {/* 診療日数 */}
                  <tr>
                    <td className="sticky left-0 z-10 px-2 py-2 font-medium bg-white border border-gray-300">診療日数</td>
                    {clinicData.monthlyMetrics.map((metric, idx) => {
                      if (metric.totalRevenue === 0 && metric.totalPatients === 0) return null
                      return (
                        <td key={idx} className="px-2 py-2 text-right border border-gray-300">
                          {formatNumber(metric.consultationDays)}
                        </td>
                      )
                    })}
                    <td className="px-2 py-2 font-semibold text-right border border-gray-300 bg-gray-50">
                      {formatNumber(clinicData.monthlyMetrics.reduce((sum, m) => sum + m.consultationDays, 0))}
                    </td>
                  </tr>
                  
                  {/* 1日当たり患者数 */}
                  <tr>
                    <td className="sticky left-0 z-10 px-2 py-2 font-medium bg-white border border-gray-300">1日当たり患者数</td>
                    {clinicData.monthlyMetrics.map((metric, idx) => {
                      if (metric.totalRevenue === 0 && metric.totalPatients === 0) return null
                      return (
                        <td key={idx} className="px-2 py-2 text-right border border-gray-300">
                          {formatNumber(metric.patientsPerDay)}
                        </td>
                      )
                    })}
                    <td className="px-2 py-2 text-right border border-gray-300 bg-gray-50">-</td>
                  </tr>
                  
                  {/* 1人当り単価 */}
                  <tr>
                    <td className="sticky left-0 z-10 px-2 py-2 font-medium bg-white border border-gray-300">1人当り単価</td>
                    {clinicData.monthlyMetrics.map((metric, idx) => {
                      if (metric.totalRevenue === 0 && metric.totalPatients === 0) return null
                      return (
                        <td key={idx} className="px-2 py-2 text-right border border-gray-300">
                          {metric.totalUnitPrice > 0 ? formatCurrency(metric.totalUnitPrice) : '-'}
                        </td>
                      )
                    })}
                    <td className="px-2 py-2 text-right border border-gray-300 bg-gray-50">-</td>
                  </tr>
                  
                  {/* 1人当り単価（新規） */}
                  <tr>
                    <td className="sticky left-0 z-10 px-2 py-2 pl-4 font-medium bg-white border border-gray-300">1人当り単価（新規）</td>
                    {clinicData.monthlyMetrics.map((metric, idx) => {
                      if (metric.totalRevenue === 0 && metric.totalPatients === 0) return null
                      return (
                        <td key={idx} className="px-2 py-2 text-right border border-gray-300">
                          {metric.newUnitPrice > 0 ? formatCurrency(metric.newUnitPrice) : '-'}
                        </td>
                      )
                    })}
                    <td className="px-2 py-2 text-right border border-gray-300 bg-gray-50">-</td>
                  </tr>
                  
                  {/* 1人当り単価（既存） */}
                  <tr>
                    <td className="sticky left-0 z-10 px-2 py-2 pl-4 font-medium bg-white border border-gray-300">1人当り単価（既存）</td>
                    {clinicData.monthlyMetrics.map((metric, idx) => {
                      if (metric.totalRevenue === 0 && metric.totalPatients === 0) return null
                      return (
                        <td key={idx} className="px-2 py-2 text-right border border-gray-300">
                          {metric.existingUnitPrice > 0 ? formatCurrency(metric.existingUnitPrice) : '-'}
                        </td>
                      )
                    })}
                    <td className="px-2 py-2 text-right border border-gray-300 bg-gray-50">-</td>
                  </tr>
                  
                  {/* 1日当たり単価（新規） */}
                  <tr>
                    <td className="sticky left-0 z-10 px-2 py-2 pl-4 font-medium bg-white border border-gray-300">1日当たり単価（新規）</td>
                    {clinicData.monthlyMetrics.map((metric, idx) => {
                      if (metric.totalRevenue === 0 && metric.totalPatients === 0) return null
                      return (
                        <td key={idx} className="px-2 py-2 text-right border border-gray-300">
                          {metric.newUnitPricePerDay > 0 ? formatCurrency(metric.newUnitPricePerDay) : '-'}
                        </td>
                      )
                    })}
                    <td className="px-2 py-2 text-right border border-gray-300 bg-gray-50">-</td>
                  </tr>
                  
                  {/* 1日当たり単価（既存） */}
                  <tr>
                    <td className="sticky left-0 z-10 px-2 py-2 pl-4 font-medium bg-white border border-gray-300">1日当たり単価（既存）</td>
                    {clinicData.monthlyMetrics.map((metric, idx) => {
                      if (metric.totalRevenue === 0 && metric.totalPatients === 0) return null
                      return (
                        <td key={idx} className="px-2 py-2 text-right border border-gray-300">
                          {metric.existingUnitPricePerDay > 0 ? formatCurrency(metric.existingUnitPricePerDay) : '-'}
                        </td>
                      )
                    })}
                    <td className="px-2 py-2 text-right border border-gray-300 bg-gray-50">-</td>
                  </tr>
                  
                  {/* ピアス分売上（郡山のみ） */}
                  {isGunzan && (
                    <>
                      <tr>
                        <td className="sticky left-0 z-10 px-2 py-2 font-medium bg-white border border-gray-300">ピアス分売上</td>
                        {clinicData.monthlyMetrics.map((metric, idx) => {
                          if (metric.totalRevenue === 0 && metric.totalPatients === 0) return null
                          return (
                            <td key={idx} className="px-2 py-2 text-right border border-gray-300">
                              {metric.piercingRevenue > 0 ? formatCurrency(metric.piercingRevenue) : '-'}
                            </td>
                          )
                        })}
                        <td className="px-2 py-2 font-semibold text-right border border-gray-300 bg-gray-50">
                          {formatCurrency(clinicData.monthlyMetrics.reduce((sum, m) => sum + m.piercingRevenue, 0))}
                        </td>
                      </tr>
                      
                      {/* ピアス1人当り単価（郡山のみ） */}
                      <tr>
                        <td className="sticky left-0 z-10 px-2 py-2 font-medium bg-white border border-gray-300">ピアス1人当り単価</td>
                        {clinicData.monthlyMetrics.map((metric, idx) => {
                          if (metric.totalRevenue === 0 && metric.totalPatients === 0) return null
                          return (
                            <td key={idx} className="px-2 py-2 text-right border border-gray-300">
                              {metric.piercingUnitPrice > 0 ? formatCurrency(metric.piercingUnitPrice) : '-'}
                            </td>
                          )
                        })}
                        <td className="px-2 py-2 text-right border border-gray-300 bg-gray-50">-</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
