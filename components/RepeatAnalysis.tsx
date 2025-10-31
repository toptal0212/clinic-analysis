'use client'

import React, { useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { AlertCircle } from 'lucide-react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend } from 'chart.js'
import { Chart } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend)

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

export default function RepeatAnalysis() {
  const all = useAll()

  // Build per-patient visit list
  const patients = useMemo(() => {
    const map = new Map<string, { visits: { date: Date, revenue: number, isFirst: boolean, treatment: string }[] }>()
    all.forEach(r => {
      const id = (
        r.visitorId ||
        r.visitorCode ||
        r.visitorKarteNumber ||
        r.visitorName ||
        'unknown'
      ).toString()
      const date = toDate(r.recordDate || r.visitDate || r.treatmentDate || r.accountingDate)
      if (!date) return
      if (!map.has(id)) map.set(id, { visits: [] })
      const treatment = r.paymentItems?.[0]?.name || r.treatmentName || r.treatment || ''
      const isFirst = r.isFirst === true || r.isFirstVisit === true || r.visitType === 'first' || r.visitType === '初診'
      map.get(id)!.visits.push({ date, revenue: r.totalWithTax || 0, isFirst, treatment })
    })
    // sort
    map.forEach(v => {
      // merge same-day multiple visits into one (sum revenue, preserve isFirst if any)
      const byDay = new Map<string, { date: Date, revenue: number, isFirst: boolean, treatment: string }>()
      v.visits.forEach(vis => {
        const key = `${vis.date.getFullYear()}-${String(vis.date.getMonth()+1).padStart(2,'0')}-${String(vis.date.getDate()).padStart(2,'0')}`
        if (!byDay.has(key)) {
          byDay.set(key, { ...vis })
        } else {
          const cur = byDay.get(key)!
          cur.revenue += vis.revenue
          cur.isFirst = cur.isFirst || vis.isFirst
          // Keep earliest treatment label; no-op
        }
      })
      const merged = Array.from(byDay.values()).sort((a,b)=>a.date.getTime()-b.date.getTime())
      v.visits = merged
    })
    return map
  }, [all])

  // Heatmap: rows by time-to-first-repeat, columns by visit-count bucket
  const heatmap = useMemo(() => {
    const rows = ['90日以内', '180日以内', '365日以内', 'それ以上']
    const cols = ['10回以上', '5回以上', '2回以上', 'リード→なし']
    const cell = new Map<string, { patients: number, revenue: number }>()
    let totalPatients = 0
    patients.forEach(({ visits }) => {
      if (visits.length === 0) return
      totalPatients++
      // count
      const count = visits.length
      let col = 'リード→なし'
      if (count >= 10) col = '10回以上'
      else if (count >= 5) col = '5回以上'
      else if (count >= 2) col = '2回以上'
      // time to second visit
      let row = 'それ以上'
      if (count >= 2) {
        const d = Math.floor((visits[1].date.getTime() - visits[0].date.getTime()) / (1000*60*60*24))
        if (d <= 90) row = '90日以内'
        else if (d <= 180) row = '180日以内'
        else if (d <= 365) row = '365日以内'
      }
      const key = `${row}|${col}`
      if (!cell.has(key)) cell.set(key, { patients: 0, revenue: 0 })
      const c = cell.get(key)!
      c.patients += 1
      c.revenue += visits.reduce((s,v)=>s+v.revenue,0)
    })
    const max = Math.max(1, ...Array.from(cell.values()).map(v=>v.patients))
    return { rows, cols, cell, max, totalPatients }
  }, [patients])

  // Histogram: days until second visit
  const histogram = useMemo(() => {
    const buckets = new Array(181).fill(0) // 0..180+ bucket aggregated into last
    let total = 0
    patients.forEach(({visits})=>{
      if (visits.length>=2){
        const d = Math.floor((visits[1].date.getTime()-visits[0].date.getTime())/(1000*60*60*24))
        const idx = Math.min(180, Math.max(0, d))
        buckets[idx]++
        total++
      }
    })
    const labels = buckets.map((_,i)=>String(i))
    const cum: number[] = []
    let running = 0
    buckets.forEach(v=>{ running += v; cum.push(total>0? (running/total)*100 : 0) })
    return {
      labels,
      bar: { labels, datasets: [{ type:'bar' as const, label:'件数', data:buckets, backgroundColor:'#60A5FA', borderColor:'#3B82F6' }] },
      line: { labels, datasets: [{ type:'line' as const, label:'累計%', data:cum, borderColor:'#F59E0B', yAxisID:'y1', tension:0.2, pointRadius:0 }] }
    }
  }, [patients])

  // Pareto of revenue buckets
  const pareto = useMemo(()=>{
    const ranges = [5000,10000,20000,30000,40000,50000,75000,100000,200000,300000] // yen units
    const labels = ranges.map(v=>`${(v/1000).toFixed(0)}千円`)
    const values = new Array(ranges.length).fill(0)
    let total = 0
    patients.forEach(({visits})=>{
      const rev = visits.reduce((s,v)=>s+v.revenue,0)
      total += rev
      let idx = ranges.findIndex(r=>rev/1<=r)
      if (idx<0) idx = ranges.length-1
      values[idx]++
    })
    const cumPerc: number[] = []
    let r = 0
    values.forEach(v=>{ r+=v; cumPerc.push(r/Math.max(1,patients.size)*100) })
    return {
      labels,
      data:{ labels, datasets:[{ type:'bar' as const, label:'患者数', data:values, backgroundColor:'#93C5FD', borderColor:'#3B82F6' }, { type:'line' as const, label:'累計%', data:cumPerc, borderColor:'#F59E0B', yAxisID:'y1', tension:0.2, pointRadius:0 }] }
    }
  }, [patients])

  // Tables
  const patientRows = useMemo(()=>{
    const rows: any[] = []
    patients.forEach((p,id)=>{
      const first = p.visits[0]
      const second = p.visits[1]
      rows.push({ id, firstDate:first.date, secondDate: second?.date, lastDate: p.visits[p.visits.length-1].date, revenue:p.visits.reduce((s,v)=>s+v.revenue,0) })
    })
    return rows.sort((a,b)=>b.revenue-a.revenue).slice(0,15)
  },[patients])

  const procRows = useMemo(()=>{
    const map = new Map<string, { sales:number, count:number, unit:number, repeat:number }>()
    patients.forEach(p=>{
      p.visits.forEach(v=>{
        const key = v.treatment || 'その他'
        if (!map.has(key)) map.set(key,{sales:0,count:0,unit:0,repeat:0})
        const m = map.get(key)!
        m.sales += v.revenue
        m.count += 1
      })
    })
    const rows = Array.from(map.entries()).map(([k,v])=>({ name:k, ...v, unit: v.count>0? v.sales/v.count:0, repeat:0 }))
    return rows.sort((a,b)=>b.sales-a.sales).slice(0,15)
  },[patients])

  if (all.length === 0) {
    return (
      <div className="p-6">
        <div className="p-8 text-center bg-white border rounded-lg shadow-sm">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-600">データがありません</p>
          <p className="mt-2 text-sm text-gray-500">APIに接続するかCSVをインポートしてください</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Heatmap */}
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">来院回数・頻度</h3>
          <div className="overflow-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left"> </th>
                  {heatmap.cols.map(c=>(<th key={c} className="px-2 py-1 text-right text-gray-600">{c}</th>))}
                  <th className="px-2 py-1 text-right text-gray-600">総計</th>
                </tr>
              </thead>
              <tbody>
                {heatmap.rows.map(r=>{
                  let rowTotal = 0
                  return (
                    <tr key={r} className="border-t">
                      <td className="px-2 py-1 whitespace-nowrap">{r}</td>
                      {heatmap.cols.map(c=>{
                        const v = heatmap.cell.get(`${r}|${c}`) || { patients:0, revenue:0 }
                        rowTotal += v.patients
                        const bg = `rgba(59,130,246, ${0.15 + (v.patients/heatmap.max)*0.6})`
                        return <td key={c} className="px-2 py-1 text-right" style={{backgroundColor:bg}}>{v.patients.toLocaleString()}</td>
                      })}
                      <td className="px-2 py-1 text-right text-gray-700">{rowTotal.toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Histogram days to second visit with cumulative line */}
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">2回目来院までのリードタイム（日）</h3>
          <div className="h-72">
            <Chart type='bar' data={{ labels: histogram.labels, datasets:[...histogram.bar.datasets, ...histogram.line.datasets] }} options={{ responsive:true, maintainAspectRatio:false, interaction:{ mode:'index', intersect:false }, scales:{ y:{ beginAtZero:true }, y1:{ position:'right', grid:{ drawOnChartArea:false }, ticks:{ callback:(v:any)=>`${v}%` } } }, plugins:{ legend:{ display:false } } }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Pareto */}
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">売上分布・売上割合</h3>
          <div className="h-56">
            <Chart type='bar' data={pareto.data as any} options={{ responsive:true, maintainAspectRatio:false, interaction:{ mode:'index', intersect:false }, scales:{ y:{ beginAtZero:true }, y1:{ position:'right', grid:{ drawOnChartArea:false }, ticks:{ callback:(v:any)=>`${v}%` } } }, plugins:{ legend:{ display:false } } }} />
          </div>
        </div>

        {/* Patient details */}
        <div className="p-4 bg-white border rounded-lg shadow-sm xl:col-span-1">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">患者詳細</h3>
          <div className="overflow-auto h-56">
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left">患者ID</th>
                  <th className="px-2 py-1 text-left">初回来院日</th>
                  <th className="px-2 py-1 text-left">2回目来院日</th>
                  <th className="px-2 py-1 text-left">最終来院日</th>
                  <th className="px-2 py-1 text-right">売上</th>
                </tr>
              </thead>
              <tbody>
                {patientRows.map((row,i)=>(
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1">{row.id}</td>
                    <td className="px-2 py-1">{row.firstDate.toLocaleDateString('ja-JP')}</td>
                    <td className="px-2 py-1">{row.secondDate ? row.secondDate.toLocaleDateString('ja-JP') : '-'}</td>
                    <td className="px-2 py-1">{row.lastDate.toLocaleDateString('ja-JP')}</td>
                    <td className="px-2 py-1 text-right">{row.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Procedure sales */}
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">施術別売上</h3>
          <div className="overflow-auto h-56">
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left">施術名</th>
                  <th className="px-2 py-1 text-right">会計数</th>
                  <th className="px-2 py-1 text-right">売上</th>
                  <th className="px-2 py-1 text-right">会計単価</th>
                </tr>
              </thead>
              <tbody>
                {procRows.map((r,i)=>(
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1">{r.name}</td>
                    <td className="px-2 py-1 text-right">{r.count.toLocaleString()}</td>
                    <td className="px-2 py-1 text-right">{r.sales.toLocaleString()}</td>
                    <td className="px-2 py-1 text-right">{Math.round(r.unit).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}