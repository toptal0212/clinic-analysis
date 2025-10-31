'use client'

import React, { useMemo, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'
import { Chart } from 'react-chartjs-2'
import { AlertCircle } from 'lucide-react'
import Pagination from './Pagination'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

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

export default function StaffSales() {
  const all = useAll()
  const [clinicPage, setClinicPage] = useState(1)
  const [doctorPage, setDoctorPage] = useState(1)
  const [counselorPage, setCounselorPage] = useState(1)
  const itemsPerPage = 10

  // last 12 months labels (YYYY/MM)
  const months = useMemo(() => {
    const now = new Date()
    const arr: { y:number,m:number,label:string }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      arr.push({ y: d.getFullYear(), m: d.getMonth()+1, label: `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}` })
    }
    return arr
  }, [])

  const monthlyLines = useMemo(() => {
    const totals = new Array(12).fill(0)
    const visitors = new Array(12).fill(0)
    all.forEach(r => {
      const d = toDate(r.recordDate || r.visitDate || r.treatmentDate || r.accountingDate)
      if (!d) return
      const idx = months.findIndex(x => x.y === d.getFullYear() && x.m === d.getMonth()+1)
      if (idx < 0) return
      // Sum by payment items when present, otherwise use totalWithTax
      let amount = 0
      if (Array.isArray(r.paymentItems) && r.paymentItems.length > 0) {
        amount = r.paymentItems.reduce((s: number, it: any) => s + (it.priceWithTax || 0), 0)
      } else {
        amount = r.totalWithTax || 0
      }
      totals[idx] += amount
      visitors[idx] += 1
    })
    return {
      labels: months.map(x=>x.label),
      datasets: [
        { type:'line' as const, label:'売上', data: totals, borderColor:'#3B82F6', backgroundColor:'#93C5FD', tension:0.2, pointRadius:2 },
        { type:'line' as const, label:'来院数', data: visitors, borderColor:'#F59E0B', backgroundColor:'#FDE68A', tension:0.2, pointRadius:2, yAxisID:'y1' }
      ]
    }
  }, [all, months])

  // Grouping helpers
  function getDoctorNameFromItem(it: any, r: any) {
    return it?.mainStaffName || it?.staffName || r?.doctorName || r?.staffName || 'その他'
  }
  function getCounselorNameFromItem(it: any, r: any) {
    const name = (
      it?.counselorName ||
      it?.advisorName ||
      it?.advancePaymentTransactionReceivedSubStaffName ||
      it?.advancePaymentRefundReceivedSubStaffName ||
      it?.operationAdvancePaymentTransactionReceivedSubStaffName ||
      it?.subStaffName ||
      r?.counselorName ||
      r?.advisorName ||
      r?.reservationStaffName ||
      ''
    ) as string
    const trimmed = (name || '').toString().trim()
    return trimmed.length > 0 ? trimmed : 'その他'
  }

  function buildStaffTable(mode: 'doctor' | 'counselor') {
    const map = new Map<string, number[]>() // name -> monthly amounts
    all.forEach(r => {
      const d = toDate(r.recordDate || r.visitDate || r.treatmentDate || r.accountingDate)
      if (!d) return
      const idx = months.findIndex(x => x.y === d.getFullYear() && x.m === d.getMonth()+1)
      if (idx < 0) return
      if (Array.isArray(r.paymentItems) && r.paymentItems.length > 0) {
        r.paymentItems.forEach((it: any) => {
          const name = mode === 'doctor' ? getDoctorNameFromItem(it, r) : getCounselorNameFromItem(it, r)
          if (!map.has(name)) map.set(name, new Array(12).fill(0))
          map.get(name)![idx] += it.priceWithTax || 0
        })
      } else {
        const name = mode === 'doctor'
          ? (r.doctorName || r.staffName || 'その他')
          : (r.counselorName || r.advisorName || 'その他')
        if (!map.has(name)) map.set(name, new Array(12).fill(0))
        map.get(name)![idx] += r.totalWithTax || 0
      }
    })
    const rows = Array.from(map.entries()).map(([name,arr])=>({ name, arr, total: arr.reduce((a,b)=>a+b,0) }))
    rows.sort((a,b)=>b.total-a.total)
    return rows.slice(0,20)
  }

  const doctorRows = useMemo(()=>buildStaffTable('doctor'),[all, months])
  const counselorRows = useMemo(()=>buildStaffTable('counselor'),[all, months])

  const clinicRows = useMemo(()=>{
    const clinicMap = new Map<string, number[]>()
    all.forEach(r=>{
      const d = toDate(r.recordDate || r.visitDate || r.treatmentDate || r.accountingDate)
      if (!d) return
      const idx = months.findIndex(x => x.y===d.getFullYear() && x.m===d.getMonth()+1)
      if (idx<0) return
      // sum amounts using paymentItems when present
      let amount = 0
      if (Array.isArray(r.paymentItems) && r.paymentItems.length > 0) {
        amount = r.paymentItems.reduce((s: number, it: any) => s + (it.priceWithTax || 0), 0)
      } else {
        amount = r.totalWithTax || 0
      }
      const c = r.clinicName || 'その他'
      if (!clinicMap.has(c)) clinicMap.set(c, new Array(12).fill(0))
      clinicMap.get(c)![idx] += amount
    })
    const rows = Array.from(clinicMap.entries()).map(([c,arr])=>({ clinic:c, arr, total: arr.reduce((a,b)=>a+b,0) }))
    rows.sort((a,b)=>b.total-a.total)
    return rows
  }, [all, months])

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">売上・来院数推移</h3>
          <div className="h-64">
            <Chart type='line' data={monthlyLines as any} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ usePointStyle:true } } }, interaction:{ mode:'index', intersect:false }, scales:{ y1:{ position:'right', grid:{ drawOnChartArea:false } } } }} />
          </div>
        </div>
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">院別売上</h3>
          <div className="overflow-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left">院名</th>
                  {months.map(m=>(<th key={m.label} className="px-2 py-1 text-right">{m.label}</th>))}
                  <th className="px-2 py-1 text-right">計</th>
                </tr>
              </thead>
              <tbody>
                {(clinicRows.length > itemsPerPage ? clinicRows.slice((clinicPage-1)*itemsPerPage, clinicPage*itemsPerPage) : clinicRows).map((row,i)=> (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1">{row.clinic}</td>
                    {row.arr.map((v,j)=>(<td key={j} className="px-2 py-1 text-right">{Math.round(v).toLocaleString()}</td>))}
                    <td className="px-2 py-1 text-right">{Math.round(row.total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {clinicRows.length > itemsPerPage && (
            <Pagination
              currentPage={clinicPage}
              totalPages={Math.ceil(clinicRows.length / itemsPerPage)}
              onPageChange={setClinicPage}
              totalItems={clinicRows.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Doctor table */}
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">ドクター別売上</h3>
          <div className="overflow-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left">担当者</th>
                  {months.map(m=>(<th key={m.label} className="px-2 py-1 text-right">{m.label}</th>))}
                  <th className="px-2 py-1 text-right">計</th>
                </tr>
              </thead>
              <tbody>
                {(doctorRows.length > itemsPerPage ? doctorRows.slice((doctorPage-1)*itemsPerPage, doctorPage*itemsPerPage) : doctorRows).map((row,i)=> (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1">{row.name}</td>
                    {row.arr.map((v,j)=>(<td key={j} className="px-2 py-1 text-right">{Math.round(v).toLocaleString()}</td>))}
                    <td className="px-2 py-1 text-right">{Math.round(row.total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {doctorRows.length > itemsPerPage && (
            <Pagination
              currentPage={doctorPage}
              totalPages={Math.ceil(doctorRows.length / itemsPerPage)}
              onPageChange={setDoctorPage}
              totalItems={doctorRows.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </div>

        {/* Counselor table */}
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">カウンセラー別売上</h3>
          <div className="overflow-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left">担当者</th>
                  {months.map(m=>(<th key={m.label} className="px-2 py-1 text-right">{m.label}</th>))}
                  <th className="px-2 py-1 text-right">計</th>
                </tr>
              </thead>
              <tbody>
                {(counselorRows.length > itemsPerPage ? counselorRows.slice((counselorPage-1)*itemsPerPage, counselorPage*itemsPerPage) : counselorRows).map((row,i)=> (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1">{row.name}</td>
                    {row.arr.map((v,j)=>(<td key={j} className="px-2 py-1 text-right">{Math.round(v).toLocaleString()}</td>))}
                    <td className="px-2 py-1 text-right">{Math.round(row.total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {counselorRows.length > itemsPerPage && (
            <Pagination
              currentPage={counselorPage}
              totalPages={Math.ceil(counselorRows.length / itemsPerPage)}
              onPageChange={setCounselorPage}
              totalItems={counselorRows.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </div>
      </div>
    </div>
  )
}


