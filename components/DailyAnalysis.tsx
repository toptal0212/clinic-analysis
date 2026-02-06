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
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [inputMonth, setInputMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

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

  // Get unique clinics
  const clinics = useMemo(() => {
    const clinicSet = new Set<string>()
    allData.forEach((r: any) => {
      const clinic = r.clinicName || 'その他'
      clinicSet.add(clinic)
    })
    return Array.from(clinicSet).sort()
  }, [allData])

  // Calculate data for each clinic
  const clinicData = useMemo(() => {
    return clinics.map(clinic => {
      const clinicRecords = allData.filter((r: any) => {
        const d = toDate(r.recordDate || r.visitDate || r.treatmentDate || r.accountingDate)
        if (!d) return false
        if (d.getFullYear() !== selectedYear || d.getMonth() + 1 !== selectedMonthNum) return false
        return (r.clinicName || 'その他') === clinic
      })

      // Calculate daily sales
      const dailySales = new Array(32).fill(0)
      const dailyExisting = new Array(32).fill(0)
      
      clinicRecords.forEach((r: any) => {
        const d = toDate(r.recordDate || r.visitDate || r.treatmentDate || r.accountingDate)
        if (!d) return
        const day = d.getDate()
        if (day >= 1 && day <= 31) {
          let amount = 0
          if (Array.isArray(r.paymentItems) && r.paymentItems.length > 0) {
            amount = r.paymentItems.reduce((s: number, it: any) => s + (it.priceWithTax || 0), 0)
          } else {
            amount = r.totalWithTax || 0
          }
          dailySales[day] += amount
          if (!r.isFirst) dailyExisting[day] += 1
        }
      })

      const totalRevenue = dailySales.reduce((a, b) => a + b, 0)
      const totalCount = clinicRecords.length
      const existingCount = clinicRecords.filter(r => !r.isFirst).length
      const firstHalfRevenue = dailySales.slice(1, 16).reduce((a, b) => a + b, 0)
      const secondHalfRevenue = dailySales.slice(16, daysInMonth + 1).reduce((a, b) => a + b, 0)

      return {
        name: clinic,
        dailySales,
        dailyExisting,
        totalRevenue,
        totalCount,
        existingCount,
        target: 0,
        dailyTarget: 0,
        firstHalfRevenue,
        secondHalfRevenue
      }
    })
  }, [clinics, allData, selectedYear, selectedMonthNum, daysInMonth])

  // Format number
  const formatNumber = (value: number) => {
    if (!value || value === 0) return ''
    return value.toLocaleString('ja-JP')
  }

  // Handle month change
  const handleMonthChange = () => {
    if (inputMonth) {
      const [year, month] = inputMonth.split('-')
      setSelectedMonth(`${year}/${month}`)
    }
  }

  // Show message if no data
  if (!state.apiConnected || allData.length === 0) {
    return (
      <div className="p-4">
        <div className="mb-3">
          <h2 className="text-xl font-bold">集計（日別）</h2>
        </div>
        <div className="p-6 text-center bg-white border rounded">
          <p className="mb-2 text-lg font-semibold">データが読み込まれていません</p>
          <p className="text-sm text-gray-600">APIに接続してデータを取得してください</p>
          <div className="mt-4 text-xs text-gray-500">
            <div>API接続: {state.apiConnected ? '接続済み' : '未接続'}</div>
            <div>データ件数: {allData.length}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-gray-50">
      {/* Controls */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b shrink-0">
        <select className="px-3 py-2 text-base border rounded">
          <option>大阪院</option>
          {clinics.map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input
          type="text"
          value={inputMonth}
          onChange={(e) => setInputMonth(e.target.value)}
          placeholder="2026/12"
          className="px-3 py-2 text-base border rounded w-36"
        />
        <button
          onClick={handleMonthChange}
          className="px-5 py-2 text-base font-medium text-white bg-green-500 rounded hover:bg-green-600"
        >
          転記
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-sm leading-tight border-collapse" style={{ minWidth: 'max-content' }}>
          <thead className="sticky top-0 z-10 bg-white">
            {/* Clinic names */}
            <tr>
              <th rowSpan={2} className="sticky left-0 bg-blue-200 border border-gray-300 px-2 py-2 text-sm font-semibold min-w-[60px] z-20 align-middle">
                日付
              </th>
              {clinicData.map(clinic => (
                <th
                  key={clinic.name}
                  colSpan={4}
                  className="px-3 py-2 text-base font-semibold bg-blue-200 border border-gray-300 whitespace-nowrap"
                >
                  {clinic.name}
                </th>
              ))}
            </tr>
            {/* Column headers */}
            <tr>
              {clinicData.map(clinic => (
                <React.Fragment key={clinic.name}>
                  <th className="bg-blue-100 border border-gray-300 px-2 py-1.5 text-sm font-normal min-w-[40px]">日</th>
                  <th className="bg-yellow-100 border border-gray-300 px-2 py-1.5 text-sm font-normal min-w-[90px]">目標上</th>
                  <th className="bg-blue-100 border border-gray-300 px-2 py-1.5 text-sm font-normal min-w-[100px]">実績・予約</th>
                  <th className="bg-yellow-100 border border-gray-300 px-2 py-1.5 text-sm font-normal min-w-[70px]">既存上</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Daily rows */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
              <tr key={day}>
                <td className="sticky left-0 bg-blue-100 border border-gray-300 px-2 py-1.5 text-center font-semibold text-sm z-10">
                  {day}日
                </td>
                {clinicData.map(clinic => {
                  const amount = clinic.dailySales[day]
                  const existing = clinic.dailyExisting[day]
                  const target = clinic.dailyTarget
                  
                  return (
                    <React.Fragment key={clinic.name}>
                      <td className="bg-blue-100 border border-gray-300 px-2 py-1.5 text-center text-sm">{day}</td>
                      <td className="bg-yellow-50 border border-gray-300 px-2 py-1.5 text-right text-sm tabular-nums">
                        {target > 0 ? formatNumber(target) : ''}
                      </td>
                      <td className="bg-white border border-gray-300 px-2 py-1.5 text-right text-sm tabular-nums font-semibold">
                        {amount > 0 ? formatNumber(amount) : ''}
                      </td>
                      <td className="bg-yellow-50 border border-gray-300 px-2 py-1.5 text-right text-sm">
                        {existing > 0 ? existing : ''}
                      </td>
                    </React.Fragment>
                  )
                })}
              </tr>
            ))}

            {/* Summary rows */}
            <tr className="bg-yellow-50">
              <td className="sticky left-0 bg-yellow-50 border border-gray-300 px-2 py-1.5 text-center font-bold text-sm z-10">目標</td>
              {clinicData.map(clinic => (
                <React.Fragment key={clinic.name}>
                  <td className="border border-gray-300 bg-yellow-50"></td>
                  <td className="bg-yellow-50 border border-gray-300 px-2 py-1.5 text-right text-sm font-bold">{formatNumber(clinic.target)}</td>
                  <td className="border border-gray-300 bg-yellow-50"></td>
                  <td className="border border-gray-300 bg-yellow-50"></td>
                </React.Fragment>
              ))}
            </tr>

            <tr className="bg-white">
              <td className="sticky left-0 bg-white border border-gray-300 px-2 py-1.5 text-center font-bold text-sm z-10">来院</td>
              {clinicData.map(clinic => (
                <React.Fragment key={clinic.name}>
                  <td className="bg-white border border-gray-300"></td>
                  <td className="bg-yellow-50 border border-gray-300 px-2 py-1.5 text-right text-sm">{clinic.totalCount || ''}</td>
                  <td className="bg-white border border-gray-300 px-2 py-1.5 text-right text-sm font-bold">{formatNumber(clinic.totalRevenue)}</td>
                  <td className="bg-yellow-50 border border-gray-300 px-2 py-1.5 text-right text-sm">{clinic.existingCount || ''}</td>
                </React.Fragment>
              ))}
            </tr>

            <tr className="bg-blue-200">
              <td className="sticky left-0 bg-blue-200 border border-gray-300 px-2 py-1.5 text-center font-bold text-sm z-10">日標率(%/日)</td>
              {clinicData.map(clinic => (
                <React.Fragment key={clinic.name}>
                  <td className="bg-blue-200 border border-gray-300"></td>
                  <td className="bg-blue-200 border border-gray-300 px-2 py-1.5 text-right text-sm">
                    {clinic.target > 0 ? ((clinic.totalRevenue / clinic.target) * 100).toFixed(1) + '%' : ''}
                  </td>
                  <td className="bg-blue-200 border border-gray-300"></td>
                  <td className="bg-blue-200 border border-gray-300"></td>
                </React.Fragment>
              ))}
            </tr>

            <tr className="bg-blue-200">
              <td className="sticky left-0 bg-blue-200 border border-gray-300 px-2 py-1.5 text-center font-bold text-sm z-10">月前半(1~15日)</td>
              {clinicData.map(clinic => (
                <React.Fragment key={clinic.name}>
                  <td className="bg-blue-200 border border-gray-300"></td>
                  <td className="bg-blue-200 border border-gray-300"></td>
                  <td className="bg-blue-200 border border-gray-300 px-2 py-1.5 text-right text-sm">{formatNumber(clinic.firstHalfRevenue)}</td>
                  <td className="bg-blue-200 border border-gray-300"></td>
                </React.Fragment>
              ))}
            </tr>

            <tr className="bg-blue-200">
              <td className="sticky left-0 bg-blue-200 border border-gray-300 px-2 py-1.5 text-center font-bold text-sm z-10">月後半(16~末日)</td>
              {clinicData.map(clinic => (
                <React.Fragment key={clinic.name}>
                  <td className="bg-blue-200 border border-gray-300"></td>
                  <td className="bg-blue-200 border border-gray-300"></td>
                  <td className="bg-blue-200 border border-gray-300 px-2 py-1.5 text-right text-sm">{formatNumber(clinic.secondHalfRevenue)}</td>
                  <td className="bg-blue-200 border border-gray-300"></td>
                </React.Fragment>
              ))}
            </tr>

            {['アップセル', '施術付帯', 'アップセル付帯', '売店', '次来', '先週来店約束', 'CS次来', '当日来店', '全体'].map(label => (
              <tr key={label} className="bg-white">
                <td className="sticky left-0 bg-white border border-gray-300 px-2 py-1.5 text-center font-bold text-sm z-10">{label}</td>
                {clinicData.map(clinic => (
                  <React.Fragment key={clinic.name}>
                    <td className="bg-white border border-gray-300"></td>
                    <td className="border border-gray-300 bg-yellow-50"></td>
                    <td className="bg-white border border-gray-300"></td>
                    <td className="border border-gray-300 bg-yellow-50"></td>
                  </React.Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
