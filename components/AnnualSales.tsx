'use client'

import React, { useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'
import { Chart } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

function useAllAccounts() {
  const { state } = useDashboard()
  return useMemo(() => {
    const all: any[] = []
    if (state.data.dailyAccounts?.length) all.push(...state.data.dailyAccounts)
    if (state.data.clinicData) {
      Object.values(state.data.clinicData).forEach((c: any) => {
        if (c?.dailyAccounts?.length) all.push(...c.dailyAccounts)
      })
    }
    return all
  }, [state.data.dailyAccounts, state.data.clinicData])
}

function toYmd(d: any) {
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return null
  return { y: dt.getFullYear(), m: dt.getMonth() + 1 }
}

function currency(n: number) {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(n || 0)
}

export default function AnnualSales() {
  const all = useAllAccounts()

  // Years present in data
  const years = useMemo(() => {
    const set = new Set<number>()
    all.forEach(r => {
      const d = toYmd(r.recordDate || r.visitDate || r.treatmentDate || r.accountingDate)
      if (d) set.add(d.y)
    })
    return Array.from(set).sort()
  }, [all])

  // Monthly series (for current and previous years)
  const monthlySeries = useMemo(() => {
    const map = new Map<string, number>() // key: yyyy-mm
    all.forEach(r => {
      const d = toYmd(r.recordDate || r.visitDate || r.treatmentDate || r.accountingDate)
      if (!d) return
      const key = `${d.y}-${String(d.m).padStart(2, '0')}`
      map.set(key, (map.get(key) || 0) + (r.totalWithTax || 0))
    })
    // Build labels for 12 months
    const months = Array.from({ length: 12 }, (_, i) => i + 1)
    const datasets = years.map((y, idx) => {
      const data = months.map(m => map.get(`${y}-${String(m).padStart(2, '0')}`) || 0)
      const palette = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
      return {
        label: String(y),
        data,
        borderColor: palette[idx % palette.length],
        backgroundColor: palette[idx % palette.length],
        tension: 0.3,
        pointRadius: 2
      }
    })
    return { labels: months.map(m => `${m}月`), datasets }
  }, [all, years])

  // Heatmap helpers
  function buildHeatmap(groupKey: (r: any) => string, title: string) {
    const mat = new Map<string, number>() // key: group|year
    all.forEach(r => {
      const d = toYmd(r.recordDate || r.visitDate || r.treatmentDate || r.accountingDate)
      if (!d) return
      const g = groupKey(r) || 'その他'
      const key = `${g}|${d.y}`
      mat.set(key, (mat.get(key) || 0) + (r.totalWithTax || 0))
    })
    const groups = Array.from(new Set(Array.from(mat.keys()).map(k => k.split('|')[0])))
    const values = Array.from(mat.values())
    const max = values.length ? Math.max(...values) : 1
    return { title, groups, years, mat, max }
  }

  const byClinic = useMemo(() => buildHeatmap(r => r.clinicName, '院別'), [all, years])
  // Prefer paymentItems category/name used across the app, then fall back
  const byCategory = useMemo(
    () => buildHeatmap(
      (r: any) => r.paymentItems?.[0]?.category || r.treatmentCategory || r.category || '未分類',
      'カテゴリ別'
    ),
    [all, years]
  )
  const bySource = useMemo(
    () => buildHeatmap(
      (r: any) =>
        r.visitorInflowSourceName ||
        r.visitorInflowSourceLabel ||
        r.referralSource ||
        r.leadSource ||
        r.mediaSource ||
        r.appointmentRoute ||
        '未分類',
      '流入経路'
    ),
    [all, years]
  )

  const renderHeatmap = (h: ReturnType<typeof buildHeatmap>) => (
    <div className="p-4 bg-white border rounded-lg shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">{h.title}</h3>
      <div className="overflow-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left text-gray-600">項目</th>
              {h.years.map(y => (
                <th key={y} className="px-2 py-1 text-right text-gray-600">{y}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {h.groups.map(g => (
              <tr key={g} className="border-t">
                <td className="px-2 py-1 whitespace-nowrap">{g || 'その他'}</td>
                {h.years.map(y => {
                  const v = h.mat.get(`${g}|${y}`) || 0
                  const ratio = v / (h.max || 1)
                  const bg = `rgba(37, 99, 235, ${0.15 + ratio * 0.6})`
                  return (
                    <td key={y} className="px-2 py-1 text-right" style={{ backgroundColor: bg }}>
                      {currency(v)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left: yearly multi-line trend */}
        <div className="p-4 bg-white border rounded-lg shadow-sm xl:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">年間時系列</h3>
          <div className="h-80">
            <Chart type="line" data={monthlySeries as any} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } }, tooltip: { mode: 'index', intersect: false } },
              scales: { y: { ticks: { callback: (v: any) => `¥${(Number(v)/1000000).toFixed(0)}M` } } }
            }} />
          </div>
        </div>
        {/* Right: clinic/year heatmap */}
        {renderHeatmap(byClinic)}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {renderHeatmap(byCategory)}
        {renderHeatmap(bySource)}
      </div>
    </div>
  )
}


