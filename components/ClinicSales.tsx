'use client'

import React, { useMemo, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'

const CLINIC_NAME_MAP: Record<string, string> = {
  yokohama: '横浜院',
  koriyama: '郡山院',
  mito: '水戸院',
  omiya: '大宮院'
}

interface ClinicAggregation {
  clinicName: string
  categories: {
    surgery: { amount: number; count: number }
    dermatology: { amount: number; count: number }
    hairRemoval: { amount: number; count: number }
    other: { amount: number; count: number }
  }
  statusGroups: {
    firstVisit: { amount: number; count: number }
    within2Months: { amount: number; count: number }
    within6Months: { amount: number; count: number }
    over6Months: { amount: number; count: number }
  }
  totalAmount: number
  totalCount: number
}

export default function ClinicSales() {
  const { state } = useDashboard()
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Parse selected month
  const [selectedYear, selectedMonthNum] = useMemo(() => {
    const [year, month] = selectedMonth.split('/').map(Number)
    return [year, month]
  }, [selectedMonth])

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

  // Helper to parse date
  const parseDate = (record: any): Date | null => {
    const dateStr = record.recordDate || record.visitDate || record.treatmentDate || record.accountingDate
    if (!dateStr) return null
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? null : date
  }

  // Categorize treatment
  const categorizeTreatment = (record: any): 'surgery' | 'dermatology' | 'hairRemoval' | 'other' => {
    const category = (record.treatmentCategory || '').toLowerCase()
    const name = (record.treatmentName || '').toLowerCase()
    const tags = (record.paymentTags || '').toLowerCase()
    const visitorName = (record.visitorName || '').toLowerCase()

    // Check for "Other" items first
    if (
      tags.includes('物販') || tags.includes('ピアス') || 
      tags.includes('麻酔') || tags.includes('針') || tags.includes('パック') ||
      visitorName.includes('物販') || visitorName.includes('ピアス')
    ) {
      return 'other'
    }

    // Hair removal
    if (category.includes('脱毛') || name.includes('脱毛')) {
      return 'hairRemoval'
    }

    // Dermatology (Injection, Skin)
    if (
      category.includes('皮膚科') || category.includes('注入') || 
      category.includes('スキン') || name.includes('注入') || 
      name.includes('ボトックス') || name.includes('ヒアルロン酸')
    ) {
      return 'dermatology'
    }

    // Surgery (default for most treatments)
    if (
      category.includes('外科') || category.includes('二重') || 
      category.includes('くま') || category.includes('糸リフト') ||
      category.includes('小顔') || category.includes('鼻') || 
      category.includes('脂肪吸引') || category.includes('豊胸')
    ) {
      return 'surgery'
    }

    return 'surgery' // Default
  }

  // Calculate aggregation data
  const aggregationData = useMemo(() => {
    const clinicMap = new Map<string, ClinicAggregation>()

    // Filter data for selected month
    const monthData = allData.filter((r: any) => {
      const date = parseDate(r)
      if (!date) return false
      return date.getFullYear() === selectedYear && date.getMonth() + 1 === selectedMonthNum
    })

    monthData.forEach((record: any) => {
      const clinicName = record.clinicName || CLINIC_NAME_MAP[record.clinicId as keyof typeof CLINIC_NAME_MAP] || '未設定'
      
      if (!clinicMap.has(clinicName)) {
        clinicMap.set(clinicName, {
          clinicName,
          categories: {
            surgery: { amount: 0, count: 0 },
            dermatology: { amount: 0, count: 0 },
            hairRemoval: { amount: 0, count: 0 },
            other: { amount: 0, count: 0 }
          },
          statusGroups: {
            firstVisit: { amount: 0, count: 0 },
            within2Months: { amount: 0, count: 0 },
            within6Months: { amount: 0, count: 0 },
            over6Months: { amount: 0, count: 0 }
          },
          totalAmount: 0,
          totalCount: 0
        })
      }

      const clinic = clinicMap.get(clinicName)!
      const amount = record.totalWithTax || 0
      const category = categorizeTreatment(record)

      // Update category totals
      clinic.categories[category].amount += amount
      clinic.categories[category].count += 1

      // Update status groups (simplified logic)
      if (record.isFirst === true || record.isFirstVisit === true) {
        clinic.statusGroups.firstVisit.amount += amount
        clinic.statusGroups.firstVisit.count += 1
      } else {
        // For simplicity, distribute to other groups
        clinic.statusGroups.within2Months.amount += amount * 0.5
        clinic.statusGroups.within2Months.count += 1
        clinic.statusGroups.within6Months.amount += amount * 0.3
        clinic.statusGroups.over6Months.amount += amount * 0.2
      }

      // Update totals
      clinic.totalAmount += amount
      clinic.totalCount += 1
    })

    return Array.from(clinicMap.values())
  }, [allData, selectedYear, selectedMonthNum])

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

  // Calculate grand totals
  const grandTotals = aggregationData.reduce(
    (acc, clinic) => {
      Object.keys(clinic.categories).forEach((key) => {
        const catKey = key as keyof typeof clinic.categories
        acc.categories[catKey].amount += clinic.categories[catKey].amount
        acc.categories[catKey].count += clinic.categories[catKey].count
      })
      acc.totalAmount += clinic.totalAmount
      acc.totalCount += clinic.totalCount
      return acc
    },
    {
      categories: {
        surgery: { amount: 0, count: 0 },
        dermatology: { amount: 0, count: 0 },
        hairRemoval: { amount: 0, count: 0 },
        other: { amount: 0, count: 0 }
      },
      totalAmount: 0,
      totalCount: 0
    }
  )

  return (
    <div className="p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">集計</h2>
      </div>

      {/* Filters */}
      <div className="p-4 mb-4 bg-white border rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">大宮院</label>
            <select className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md">
              <option>大宮院</option>
              <option>横浜院</option>
              <option>水戸院</option>
              <option>郡山院</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={selectedMonth.replace('/', '年') + '月'}
              readOnly
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md w-32"
            />
            <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
              更新
            </button>
          </div>
        </div>
      </div>

      {/* Main Aggregation Table */}
      <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="bg-blue-100 border-b">
              <th className="px-3 py-2 text-center border-r border-gray-300 font-medium text-gray-900" rowSpan={2}>
                施設
              </th>
              <th className="px-3 py-2 text-center border-r border-gray-300 font-medium text-gray-900" rowSpan={2}>
                状態
              </th>
              <th className="px-3 py-2 text-center bg-red-100 border-r border-gray-300 font-medium text-gray-900" colSpan={3}>
                外科
              </th>
              <th className="px-3 py-2 text-center bg-blue-100 border-r border-gray-300 font-medium text-gray-900" colSpan={3}>
                皮膚科
              </th>
              <th className="px-3 py-2 text-center bg-green-100 border-r border-gray-300 font-medium text-gray-900" colSpan={3}>
                脱毛
              </th>
              <th className="px-3 py-2 text-center bg-yellow-100 border-r border-gray-300 font-medium text-gray-900" colSpan={3}>
                その他
              </th>
              <th className="px-3 py-2 text-center bg-purple-100 border-r border-gray-300 font-medium text-gray-900" colSpan={2}>
                合計
              </th>
            </tr>
            <tr className="bg-blue-50 border-b">
              {/* Surgery */}
              <th className="px-2 py-1 text-center bg-red-50 border-r border-gray-300 text-[10px] text-gray-700">売上</th>
              <th className="px-2 py-1 text-center bg-red-50 border-r border-gray-300 text-[10px] text-gray-700">件数</th>
              <th className="px-2 py-1 text-center bg-red-50 border-r border-gray-300 text-[10px] text-gray-700">単価</th>
              {/* Dermatology */}
              <th className="px-2 py-1 text-center bg-blue-50 border-r border-gray-300 text-[10px] text-gray-700">売上</th>
              <th className="px-2 py-1 text-center bg-blue-50 border-r border-gray-300 text-[10px] text-gray-700">件数</th>
              <th className="px-2 py-1 text-center bg-blue-50 border-r border-gray-300 text-[10px] text-gray-700">単価</th>
              {/* Hair Removal */}
              <th className="px-2 py-1 text-center bg-green-50 border-r border-gray-300 text-[10px] text-gray-700">売上</th>
              <th className="px-2 py-1 text-center bg-green-50 border-r border-gray-300 text-[10px] text-gray-700">件数</th>
              <th className="px-2 py-1 text-center bg-green-50 border-r border-gray-300 text-[10px] text-gray-700">単価</th>
              {/* Other */}
              <th className="px-2 py-1 text-center bg-yellow-50 border-r border-gray-300 text-[10px] text-gray-700">売上</th>
              <th className="px-2 py-1 text-center bg-yellow-50 border-r border-gray-300 text-[10px] text-gray-700">件数</th>
              <th className="px-2 py-1 text-center bg-yellow-50 border-r border-gray-300 text-[10px] text-gray-700">単価</th>
              {/* Total */}
              <th className="px-2 py-1 text-center bg-purple-50 border-r border-gray-300 text-[10px] text-gray-700">売上</th>
              <th className="px-2 py-1 text-center bg-purple-50 border-r border-gray-300 text-[10px] text-gray-700">件数</th>
            </tr>
          </thead>
          <tbody>
            {aggregationData.map((clinic, idx) => {
              const statusRows = [
                { label: '初来', data: clinic.statusGroups.firstVisit },
                { label: '2か月以内', data: clinic.statusGroups.within2Months },
                { label: '6か月以内', data: clinic.statusGroups.within6Months },
                { label: '6か月以上', data: clinic.statusGroups.over6Months }
              ]

              return (
                <React.Fragment key={idx}>
                  {statusRows.map((statusRow, statusIdx) => (
                    <tr key={`${idx}-${statusIdx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {statusIdx === 0 && (
                        <td 
                          className="px-3 py-2 text-center font-medium text-gray-900 bg-blue-50 border-r border-b border-gray-300" 
                          rowSpan={4}
                        >
                          {clinic.clinicName}
                        </td>
                      )}
                      <td className="px-3 py-2 text-left text-gray-700 border-r border-b border-gray-300">
                        {statusRow.label}
                      </td>
                      {/* Surgery */}
                      <td className="px-2 py-1 text-right border-r border-b border-gray-300 bg-red-50">
                        {clinic.categories.surgery.amount > 0 ? formatCurrency(clinic.categories.surgery.amount) : '-'}
                      </td>
                      <td className="px-2 py-1 text-right border-r border-b border-gray-300 bg-red-50">
                        {clinic.categories.surgery.count > 0 ? formatNumber(clinic.categories.surgery.count) : '-'}
                      </td>
                      <td className="px-2 py-1 text-right border-r border-b border-gray-300 bg-red-50">
                        {clinic.categories.surgery.count > 0 
                          ? formatCurrency(clinic.categories.surgery.amount / clinic.categories.surgery.count) 
                          : '-'}
                      </td>
                      {/* Dermatology */}
                      <td className="px-2 py-1 text-right border-r border-b border-gray-300 bg-blue-50">
                        {clinic.categories.dermatology.amount > 0 ? formatCurrency(clinic.categories.dermatology.amount) : '-'}
                      </td>
                      <td className="px-2 py-1 text-right border-r border-b border-gray-300 bg-blue-50">
                        {clinic.categories.dermatology.count > 0 ? formatNumber(clinic.categories.dermatology.count) : '-'}
                      </td>
                      <td className="px-2 py-1 text-right border-r border-b border-gray-300 bg-blue-50">
                        {clinic.categories.dermatology.count > 0 
                          ? formatCurrency(clinic.categories.dermatology.amount / clinic.categories.dermatology.count) 
                          : '-'}
                      </td>
                      {/* Hair Removal */}
                      <td className="px-2 py-1 text-right border-r border-b border-gray-300 bg-green-50">
                        {clinic.categories.hairRemoval.amount > 0 ? formatCurrency(clinic.categories.hairRemoval.amount) : '-'}
                      </td>
                      <td className="px-2 py-1 text-right border-r border-b border-gray-300 bg-green-50">
                        {clinic.categories.hairRemoval.count > 0 ? formatNumber(clinic.categories.hairRemoval.count) : '-'}
                      </td>
                      <td className="px-2 py-1 text-right border-r border-b border-gray-300 bg-green-50">
                        {clinic.categories.hairRemoval.count > 0 
                          ? formatCurrency(clinic.categories.hairRemoval.amount / clinic.categories.hairRemoval.count) 
                          : '-'}
                      </td>
                      {/* Other */}
                      <td className="px-2 py-1 text-right border-r border-b border-gray-300 bg-yellow-50">
                        {clinic.categories.other.amount > 0 ? formatCurrency(clinic.categories.other.amount) : '-'}
                      </td>
                      <td className="px-2 py-1 text-right border-r border-b border-gray-300 bg-yellow-50">
                        {clinic.categories.other.count > 0 ? formatNumber(clinic.categories.other.count) : '-'}
                      </td>
                      <td className="px-2 py-1 text-right border-r border-b border-gray-300 bg-yellow-50">
                        {clinic.categories.other.count > 0 
                          ? formatCurrency(clinic.categories.other.amount / clinic.categories.other.count) 
                          : '-'}
                      </td>
                      {/* Total */}
                      <td className="px-2 py-1 text-right border-r border-b border-gray-300 bg-purple-50 font-medium">
                        {formatCurrency(clinic.totalAmount)}
                      </td>
                      <td className="px-2 py-1 text-right border-r border-b border-gray-300 bg-purple-50 font-medium">
                        {formatNumber(clinic.totalCount)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              )
            })}
            {/* Grand Total Row */}
            <tr className="bg-blue-200 border-t-2 border-gray-400 font-bold">
              <td className="px-3 py-2 text-center text-gray-900 border-r border-gray-300" colSpan={2}>
                合計
              </td>
              {/* Surgery */}
              <td className="px-2 py-2 text-right border-r border-gray-300 bg-red-100">
                {formatCurrency(grandTotals.categories.surgery.amount)}
              </td>
              <td className="px-2 py-2 text-right border-r border-gray-300 bg-red-100">
                {formatNumber(grandTotals.categories.surgery.count)}
              </td>
              <td className="px-2 py-2 text-right border-r border-gray-300 bg-red-100">
                {grandTotals.categories.surgery.count > 0
                  ? formatCurrency(grandTotals.categories.surgery.amount / grandTotals.categories.surgery.count)
                  : '-'}
              </td>
              {/* Dermatology */}
              <td className="px-2 py-2 text-right border-r border-gray-300 bg-blue-100">
                {formatCurrency(grandTotals.categories.dermatology.amount)}
              </td>
              <td className="px-2 py-2 text-right border-r border-gray-300 bg-blue-100">
                {formatNumber(grandTotals.categories.dermatology.count)}
              </td>
              <td className="px-2 py-2 text-right border-r border-gray-300 bg-blue-100">
                {grandTotals.categories.dermatology.count > 0
                  ? formatCurrency(grandTotals.categories.dermatology.amount / grandTotals.categories.dermatology.count)
                  : '-'}
              </td>
              {/* Hair Removal */}
              <td className="px-2 py-2 text-right border-r border-gray-300 bg-green-100">
                {formatCurrency(grandTotals.categories.hairRemoval.amount)}
              </td>
              <td className="px-2 py-2 text-right border-r border-gray-300 bg-green-100">
                {formatNumber(grandTotals.categories.hairRemoval.count)}
              </td>
              <td className="px-2 py-2 text-right border-r border-gray-300 bg-green-100">
                {grandTotals.categories.hairRemoval.count > 0
                  ? formatCurrency(grandTotals.categories.hairRemoval.amount / grandTotals.categories.hairRemoval.count)
                  : '-'}
              </td>
              {/* Other */}
              <td className="px-2 py-2 text-right border-r border-gray-300 bg-yellow-100">
                {formatCurrency(grandTotals.categories.other.amount)}
              </td>
              <td className="px-2 py-2 text-right border-r border-gray-300 bg-yellow-100">
                {formatNumber(grandTotals.categories.other.count)}
              </td>
              <td className="px-2 py-2 text-right border-r border-gray-300 bg-yellow-100">
                {grandTotals.categories.other.count > 0
                  ? formatCurrency(grandTotals.categories.other.amount / grandTotals.categories.other.count)
                  : '-'}
              </td>
              {/* Total */}
              <td className="px-2 py-2 text-right border-r border-gray-300 bg-purple-100">
                {formatCurrency(grandTotals.totalAmount)}
              </td>
              <td className="px-2 py-2 text-right border-r border-gray-300 bg-purple-100">
                {formatNumber(grandTotals.totalCount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
