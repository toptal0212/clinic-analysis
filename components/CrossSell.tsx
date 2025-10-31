'use client'

import React, { useMemo, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { AlertCircle } from 'lucide-react'

function useAll() {
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

function toDate(v: any) {
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

export default function CrossSell() {
  const all = useAll()

  const data = useMemo(() => {
    // patient visits grouped
    const patientMap = new Map<string, { date: Date, cat: string }[]>()
    all.forEach(r => {
      const id = (
        r.visitorId || r.visitorCode || r.visitorKarteNumber || r.visitorName || 'unknown'
      ).toString()
      const date = toDate(r.recordDate || r.visitDate || r.treatmentDate || r.accountingDate)
      if (!date) return
      const cat = (
        r.paymentItems?.[0]?.category || r.treatmentCategory || r.category || '未分類'
      ).toString()
      if (!patientMap.has(id)) patientMap.set(id, [])
      patientMap.get(id)!.push({ date, cat })
    })
    // sort and merge same-day visits per patient to avoid duplicate transitions
    patientMap.forEach(v => {
      v.sort((a,b)=>a.date.getTime()-b.date.getTime())
      const byDay = new Map<string, { date: Date, cat: string }>()
      v.forEach(vis => {
        const key = `${vis.date.getFullYear()}-${String(vis.date.getMonth()+1).padStart(2,'0')}-${String(vis.date.getDate()).padStart(2,'0')}`
        if (!byDay.has(key)) byDay.set(key, { ...vis })
      })
      const merged = Array.from(byDay.values()).sort((a,b)=>a.date.getTime()-b.date.getTime())
      v.splice(0, v.length, ...merged)
    })

    const cats = new Set<string>()
    patientMap.forEach(v => v.forEach(x => cats.add(x.cat)))
    const categories = Array.from(cats)

    // matrices
    const firstNext = new Map<string, number>() // firstCat|nextCat
    const firstToAll = new Map<string, number>()
    const incre = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) || 0) + 1)

    patientMap.forEach(visits => {
      if (visits.length === 0) return
      const firstCat = visits[0].cat
      // find the second unique-visit category (after first day)
      if (visits.length >= 2) {
        incre(firstNext, `${firstCat}|${visits[1].cat}`)
        for (let i = 1; i < visits.length; i++) incre(firstToAll, `${firstCat}|${visits[i].cat}`)
      }
    })

    const matrixFrom = (m: Map<string, number>) => {
      const rowMaxVals: number[] = []
      const max = Math.max(1, ...Array.from(m.values()))
      const rows = categories.map(row => {
        return categories.map(col => m.get(`${row}|${col}`) || 0)
      })
      return { categories, rows, max }
    }

    const m1 = matrixFrom(firstNext)
    const m2 = matrixFrom(firstToAll)

    const topCombos = (m: Map<string, number>) => Array.from(m.entries())
      .sort((a,b)=>b[1]-a[1]).slice(0,12).map(([k,v])=>({ key:k, value:v }))

    return {
      firstNext,
      firstToAll,
      m1,
      m2,
      top1: topCombos(firstNext),
      top2: topCombos(firstToAll)
    }
  }, [all])

  if (all.length === 0) {
    return (
      <div className="p-6">
        <div className="p-8 text-center bg-white border rounded-lg shadow-sm">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-600">データがありません</p>
        </div>
      </div>
    )
  }

  const Heat = ({ title, matrix }: { title: string, matrix: { categories: string[], rows: number[][], max: number } }) => {
    const [hover, setHover] = useState<{ row: number | null, col: number | null }>({ row: null, col: null })

    return (
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">{title}</h3>
        <div className="overflow-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left">大カテゴリ―</th>
                {matrix.categories.map((c, idx) => (
                  <th
                    key={c}
                    className={`px-2 py-1 text-right text-gray-600 ${hover.col === idx ? 'bg-blue-50' : ''}`}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.categories.map((row, i) => (
                <tr key={row} className="border-t">
                  <td className={`px-2 py-1 whitespace-nowrap ${hover.row === i ? 'bg-blue-50' : ''}`}>{row}</td>
                  {matrix.categories.map((col, j) => {
                    const v = matrix.rows[i][j]
                    const bg = `rgba(59,130,246, ${0.15 + (v / (matrix.max || 1)) * 0.6})`
                    return (
                      <td
                        key={col}
                        className="px-2 py-1 text-right cursor-help relative"
                        style={{ backgroundColor: bg }}
                        onMouseEnter={() => setHover({ row: i, col: j })}
                        onMouseLeave={() => setHover({ row: null, col: null })}
                        title={`${row} × ${col}`}
                      >
                        {v.toLocaleString()}
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
  }

  const Bars = ({ title, items }: { title: string, items: { key:string, value:number }[] }) => (
    <div className="p-4 bg-white border rounded-lg shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">{title}</h3>
      <div className="space-y-2">
        {items.map((it,i)=>{
          const [a,b] = it.key.split('|')
          return (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-24 text-xs text-gray-700 truncate" title={`${a}×${b}`}>{a}×{b}</div>
              <div className="flex-1 h-3 bg-gray-200 rounded">
                <div className="h-3 bg-blue-500 rounded" style={{ width: `${Math.min(100, (it.value / (items[0]?.value || 1)) * 100)}%` }} />
              </div>
              <div className="w-16 text-right text-xs">{it.value.toLocaleString()}</div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <Heat title="大カテゴリ―初回来院組み合わせ" matrix={data.m1} />
        <Bars title="大カテゴリ―初回来院組み合わせ_患者数" items={data.top1} />
      </div>
      <div className="grid grid-cols-1 gap-6">
        <Heat title="大カテゴリ―2回目以降組み合わせ合計" matrix={data.m2} />
        <Bars title="大カテゴリ―2回目以降組み合わせ_患者数" items={data.top2} />
      </div>
    </div>
  )
}


