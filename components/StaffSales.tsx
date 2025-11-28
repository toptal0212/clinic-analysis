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
  const [clinicItemsPerPage, setClinicItemsPerPage] = useState(10)
  const [doctorItemsPerPage, setDoctorItemsPerPage] = useState(10)
  const [counselorItemsPerPage, setCounselorItemsPerPage] = useState(10)
  const [clinicSortField, setClinicSortField] = useState<string>('total')
  const [clinicSortDirection, setClinicSortDirection] = useState<'asc' | 'desc'>('desc')
  const [doctorSortField, setDoctorSortField] = useState<string>('total')
  const [doctorSortDirection, setDoctorSortDirection] = useState<'asc' | 'desc'>('desc')
  const [counselorSortField, setCounselorSortField] = useState<string>('total')
  const [counselorSortDirection, setCounselorSortDirection] = useState<'asc' | 'desc'>('desc')
  const [ucPage, setUcPage] = useState(1)
  const [reservationRoutePage, setReservationRoutePage] = useState(1)
  const [ucItemsPerPage, setUcItemsPerPage] = useState(10)
  const [reservationRouteItemsPerPage, setReservationRouteItemsPerPage] = useState(10)
  const [ucSortField, setUcSortField] = useState<string>('total')
  const [ucSortDirection, setUcSortDirection] = useState<'asc' | 'desc'>('desc')
  const [reservationRouteSortField, setReservationRouteSortField] = useState<string>('total')
  const [reservationRouteSortDirection, setReservationRouteSortDirection] = useState<'asc' | 'desc'>('desc')

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
    const map = new Map<string, { revenue: number[], count: number[] }>() // name -> monthly data
    all.forEach(r => {
      const d = toDate(r.recordDate || r.visitDate || r.treatmentDate || r.accountingDate)
      if (!d) return
      const idx = months.findIndex(x => x.y === d.getFullYear() && x.m === d.getMonth()+1)
      if (idx < 0) return
      if (Array.isArray(r.paymentItems) && r.paymentItems.length > 0) {
        r.paymentItems.forEach((it: any) => {
          const name = mode === 'doctor' ? getDoctorNameFromItem(it, r) : getCounselorNameFromItem(it, r)
          if (!map.has(name)) map.set(name, { revenue: new Array(12).fill(0), count: new Array(12).fill(0) })
          const data = map.get(name)!
          data.revenue[idx] += it.priceWithTax || 0
          data.count[idx] += 1
        })
      } else {
        const name = mode === 'doctor'
          ? (r.doctorName || r.staffName || 'その他')
          : (r.counselorName || r.advisorName || 'その他')
        if (!map.has(name)) map.set(name, { revenue: new Array(12).fill(0), count: new Array(12).fill(0) })
        const data = map.get(name)!
        data.revenue[idx] += r.totalWithTax || 0
        data.count[idx] += 1
      }
    })
    const rows = Array.from(map.entries()).map(([name, data]) => {
      const totalRevenue = data.revenue.reduce((a, b) => a + b, 0)
      const totalCount = data.count.reduce((a, b) => a + b, 0)
      return { 
        name, 
        revenue: data.revenue,
        count: data.count,
        totalRevenue,
        totalCount,
        totalUnitPrice: totalCount > 0 ? totalRevenue / totalCount : 0
      }
    })
    rows.sort((a, b) => b.totalRevenue - a.totalRevenue)
    return rows.slice(0, 20)
  }

  const doctorRows = useMemo(()=>buildStaffTable('doctor'),[all, months])
  const counselorRows = useMemo(()=>buildStaffTable('counselor'),[all, months])

  const clinicRows = useMemo(()=>{
    const clinicMap = new Map<string, { revenue: number[], count: number[] }>()
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
      if (!clinicMap.has(c)) clinicMap.set(c, { revenue: new Array(12).fill(0), count: new Array(12).fill(0) })
      const data = clinicMap.get(c)!
      data.revenue[idx] += amount
      data.count[idx] += 1
    })
    const rows = Array.from(clinicMap.entries()).map(([c, data]) => {
      const totalRevenue = data.revenue.reduce((a, b) => a + b, 0)
      const totalCount = data.count.reduce((a, b) => a + b, 0)
      return { 
        clinic: c, 
        revenue: data.revenue,
        count: data.count,
        totalRevenue,
        totalCount,
        totalUnitPrice: totalCount > 0 ? totalRevenue / totalCount : 0
      }
    })
    return rows
  }, [all, months])

  // Sort clinic rows
  const sortedClinicRows = useMemo(() => {
    const sorted = [...clinicRows]
    sorted.sort((a, b) => {
      if (clinicSortField === 'clinic') {
        return clinicSortDirection === 'asc' 
          ? a.clinic.localeCompare(b.clinic, 'ja')
          : b.clinic.localeCompare(a.clinic, 'ja')
      }
      if (clinicSortField === 'total') {
        return clinicSortDirection === 'asc' 
          ? a.totalRevenue - b.totalRevenue
          : b.totalRevenue - a.totalRevenue
      }
      // Sort by specific month (revenue)
      const monthIndex = parseInt(clinicSortField)
      if (!isNaN(monthIndex) && monthIndex >= 0 && monthIndex < 12) {
        return clinicSortDirection === 'asc' 
          ? a.revenue[monthIndex] - b.revenue[monthIndex]
          : b.revenue[monthIndex] - a.revenue[monthIndex]
      }
      return 0
    })
    return sorted
  }, [clinicRows, clinicSortField, clinicSortDirection])

  // Sort doctor rows
  const sortedDoctorRows = useMemo(() => {
    const sorted = [...doctorRows]
    sorted.sort((a, b) => {
      if (doctorSortField === 'name') {
        return doctorSortDirection === 'asc' 
          ? a.name.localeCompare(b.name, 'ja')
          : b.name.localeCompare(a.name, 'ja')
      }
      if (doctorSortField === 'total') {
        return doctorSortDirection === 'asc' 
          ? a.totalRevenue - b.totalRevenue
          : b.totalRevenue - a.totalRevenue
      }
      // Sort by specific month (revenue)
      const monthIndex = parseInt(doctorSortField)
      if (!isNaN(monthIndex) && monthIndex >= 0 && monthIndex < 12) {
        return doctorSortDirection === 'asc' 
          ? a.revenue[monthIndex] - b.revenue[monthIndex]
          : b.revenue[monthIndex] - a.revenue[monthIndex]
      }
      return 0
    })
    return sorted
  }, [doctorRows, doctorSortField, doctorSortDirection])

  // Sort counselor rows
  const sortedCounselorRows = useMemo(() => {
    const sorted = [...counselorRows]
    sorted.sort((a, b) => {
      if (counselorSortField === 'name') {
        return counselorSortDirection === 'asc' 
          ? a.name.localeCompare(b.name, 'ja')
          : b.name.localeCompare(a.name, 'ja')
      }
      if (counselorSortField === 'total') {
        return counselorSortDirection === 'asc' 
          ? a.totalRevenue - b.totalRevenue
          : b.totalRevenue - a.totalRevenue
      }
      // Sort by specific month (revenue)
      const monthIndex = parseInt(counselorSortField)
      if (!isNaN(monthIndex) && monthIndex >= 0 && monthIndex < 12) {
        return counselorSortDirection === 'asc' 
          ? a.revenue[monthIndex] - b.revenue[monthIndex]
          : b.revenue[monthIndex] - a.revenue[monthIndex]
      }
      return 0
    })
    return sorted
  }, [counselorRows, counselorSortField, counselorSortDirection])

  // UC rows
  const ucRows = useMemo(() => {
    const treatmentMap = new Map<string, { arr: number[], ucArr: number[] }>()
    all.forEach(r => {
      const d = toDate(r.recordDate || r.visitDate || r.treatmentDate || r.accountingDate)
      if (!d) return
      const idx = months.findIndex(x => x.y === d.getFullYear() && x.m === d.getMonth() + 1)
      if (idx < 0) return
      
      if (Array.isArray(r.paymentItems) && r.paymentItems.length > 0) {
        r.paymentItems.forEach((it: any) => {
          const treatment = it.name || it.category || 'その他'
          if (!treatmentMap.has(treatment)) {
            treatmentMap.set(treatment, { arr: new Array(12).fill(0), ucArr: new Array(12).fill(0) })
          }
          const data = treatmentMap.get(treatment)!
          data.arr[idx] += 1
          if (it.isFirst || r.isFirst) {
            data.ucArr[idx] += 1
          }
        })
      } else {
        const treatment = r.treatmentName || r.treatmentCategory || 'その他'
        if (!treatmentMap.has(treatment)) {
          treatmentMap.set(treatment, { arr: new Array(12).fill(0), ucArr: new Array(12).fill(0) })
        }
        const data = treatmentMap.get(treatment)!
        data.arr[idx] += 1
        if (r.isFirst) {
          data.ucArr[idx] += 1
        }
      }
    })
    return Array.from(treatmentMap.entries()).map(([treatment, { arr, ucArr }]) => ({
      treatment,
      arr,
      ucArr,
      total: arr.reduce((a, b) => a + b, 0),
      ucCount: ucArr.reduce((a, b) => a + b, 0)
    }))
  }, [all, months])

  // Sort UC rows
  const sortedUcRows = useMemo(() => {
    const sorted = [...ucRows]
    sorted.sort((a, b) => {
      if (ucSortField === 'treatment') {
        return ucSortDirection === 'asc'
          ? a.treatment.localeCompare(b.treatment, 'ja')
          : b.treatment.localeCompare(a.treatment, 'ja')
      }
      if (ucSortField === 'total') {
        return ucSortDirection === 'asc'
          ? a.total - b.total
          : b.total - a.total
      }
      // Sort by specific month
      const monthIndex = parseInt(ucSortField)
      if (!isNaN(monthIndex) && monthIndex >= 0 && monthIndex < 12) {
        return ucSortDirection === 'asc'
          ? a.arr[monthIndex] - b.arr[monthIndex]
          : b.arr[monthIndex] - a.arr[monthIndex]
      }
      return 0
    })
    return sorted
  }, [ucRows, ucSortField, ucSortDirection])

  // Reservation route rows
  const reservationRouteRows = useMemo(() => {
    const routeMap = new Map<string, { arr: number[], ucArr: number[] }>()
    all.forEach(r => {
      const d = toDate(r.recordDate || r.visitDate || r.treatmentDate || r.accountingDate)
      if (!d) return
      const idx = months.findIndex(x => x.y === d.getFullYear() && x.m === d.getMonth() + 1)
      if (idx < 0) return
      
      const route = r.visitorInflowSourceName || r.reservationRoute || r.appointmentRoute || 'その他'
      if (!routeMap.has(route)) {
        routeMap.set(route, { arr: new Array(12).fill(0), ucArr: new Array(12).fill(0) })
      }
      const data = routeMap.get(route)!
      data.arr[idx] += 1
      if (r.isFirst) {
        data.ucArr[idx] += 1
      }
    })
    return Array.from(routeMap.entries()).map(([route, { arr, ucArr }]) => ({
      route,
      arr,
      ucArr,
      total: arr.reduce((a, b) => a + b, 0),
      ucCount: ucArr.reduce((a, b) => a + b, 0)
    }))
  }, [all, months])

  // Sort reservation route rows
  const sortedReservationRouteRows = useMemo(() => {
    const sorted = [...reservationRouteRows]
    sorted.sort((a, b) => {
      if (reservationRouteSortField === 'route') {
        return reservationRouteSortDirection === 'asc'
          ? a.route.localeCompare(b.route, 'ja')
          : b.route.localeCompare(a.route, 'ja')
      }
      if (reservationRouteSortField === 'total') {
        return reservationRouteSortDirection === 'asc'
          ? a.total - b.total
          : b.total - a.total
      }
      // Sort by specific month
      const monthIndex = parseInt(reservationRouteSortField)
      if (!isNaN(monthIndex) && monthIndex >= 0 && monthIndex < 12) {
        return reservationRouteSortDirection === 'asc'
          ? a.arr[monthIndex] - b.arr[monthIndex]
          : b.arr[monthIndex] - a.arr[monthIndex]
      }
      return 0
    })
    return sorted
  }, [reservationRouteRows, reservationRouteSortField, reservationRouteSortDirection])

  const getSortIcon = (field: string, currentField: string, direction: 'asc' | 'desc') => {
    if (currentField !== field) return '↕️'
    return direction === 'asc' ? '↑' : '↓'
  }

  const handleClinicSort = (field: string) => {
    if (clinicSortField === field) {
      setClinicSortDirection(clinicSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setClinicSortField(field)
      setClinicSortDirection('desc')
    }
    setClinicPage(1)
  }

  const handleDoctorSort = (field: string) => {
    if (doctorSortField === field) {
      setDoctorSortDirection(doctorSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setDoctorSortField(field)
      setDoctorSortDirection('desc')
    }
    setDoctorPage(1)
  }

  const handleCounselorSort = (field: string) => {
    if (counselorSortField === field) {
      setCounselorSortDirection(counselorSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setCounselorSortField(field)
      setCounselorSortDirection('desc')
    }
    setCounselorPage(1)
  }

  const handleUcSort = (field: string) => {
    if (ucSortField === field) {
      setUcSortDirection(ucSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setUcSortField(field)
      setUcSortDirection('desc')
    }
    setUcPage(1)
  }

  const handleReservationRouteSort = (field: string) => {
    if (reservationRouteSortField === field) {
      setReservationRouteSortDirection(reservationRouteSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setReservationRouteSortField(field)
      setReservationRouteSortDirection('desc')
    }
    setReservationRoutePage(1)
  }

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
          <div className="mt-4 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">全{sortedClinicRows.length.toLocaleString()}件</span>
                <span className="text-gray-400">|</span>
                <label htmlFor="clinic-items-per-page" className="whitespace-nowrap">表示件数:</label>
                <select
                  id="clinic-items-per-page"
                  value={clinicItemsPerPage}
                  onChange={(e) => {
                    setClinicItemsPerPage(Number(e.target.value))
                    setClinicPage(1)
                  }}
                  className="px-2 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5件</option>
                  <option value={10}>10件</option>
                  <option value={20}>20件</option>
                  <option value={50}>50件</option>
                  <option value={100}>100件</option>
                </select>
              </div>
              {sortedClinicRows.length > clinicItemsPerPage && (
                <div className="text-sm text-gray-700">
                  {(clinicPage - 1) * clinicItemsPerPage + 1} - {Math.min(clinicPage * clinicItemsPerPage, sortedClinicRows.length)} / {sortedClinicRows.length.toLocaleString()} 件
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <div className="overflow-x-auto overflow-y-visible max-h-[500px] border rounded-md shadow-inner">
              <table className="min-w-full text-xs">
                <thead className="sticky top-0 z-10 bg-gray-50">
                  <tr>
                    <th 
                      rowSpan={2}
                      className="sticky left-0 z-20 px-3 py-2 text-left border-r cursor-pointer hover:bg-gray-100 whitespace-nowrap bg-gray-50"
                      onClick={() => handleClinicSort('clinic')}
                    >
                      院名 {getSortIcon('clinic', clinicSortField, clinicSortDirection)}
                    </th>
                    {months.map((m, idx)=>(<th 
                      key={m.label}
                      colSpan={3}
                      className="px-3 py-2 text-center cursor-pointer hover:bg-gray-100 whitespace-nowrap border-x"
                      onClick={() => handleClinicSort(String(idx))}
                    >
                      {m.label} {getSortIcon(String(idx), clinicSortField, clinicSortDirection)}
                    </th>))}
                    <th 
                      rowSpan={2}
                      className="sticky right-0 z-20 px-3 py-2 text-right border-l cursor-pointer hover:bg-gray-100 whitespace-nowrap bg-gray-50"
                      onClick={() => handleClinicSort('total')}
                    >
                      計 {getSortIcon('total', clinicSortField, clinicSortDirection)}
                    </th>
                  </tr>
                  <tr>
                    {months.map((m, idx)=>(<React.Fragment key={`sub-${m.label}`}>
                      <th className="px-2 py-1 text-xs text-right border-x">売上</th>
                      <th className="px-2 py-1 text-xs text-right border-x">件数</th>
                      <th className="px-2 py-1 text-xs text-right border-x">当月単価</th>
                    </React.Fragment>))}
                  </tr>
                </thead>
                <tbody>
                  {(sortedClinicRows.length > clinicItemsPerPage ? sortedClinicRows.slice((clinicPage-1)*clinicItemsPerPage, clinicPage*clinicItemsPerPage) : sortedClinicRows).map((row,i)=> (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="sticky left-0 z-10 px-3 py-2 font-medium bg-white border-r">{row.clinic}</td>
                      {row.revenue.map((revenue, j) => {
                        const count = row.count[j]
                        const unitPrice = count > 0 ? revenue / count : 0
                        return (
                          <React.Fragment key={j}>
                            <td className="px-2 py-2 text-right border-x">{Math.round(revenue).toLocaleString()}</td>
                            <td className="px-2 py-2 text-right border-x">{count.toLocaleString()}</td>
                            <td className="px-2 py-2 text-right border-x">{Math.round(unitPrice).toLocaleString()}</td>
                          </React.Fragment>
                        )
                      })}
                      <td className="sticky right-0 z-10 px-3 py-2 font-semibold text-right bg-white border-l">
                        <div>{Math.round(row.totalRevenue).toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{row.totalCount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{Math.round(row.totalUnitPrice).toLocaleString()}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-center text-gray-500">
              <span>←</span>
              <span>横にスクロールして全期間を表示</span>
              <span>→</span>
            </div>
          </div>
          <div className="mt-4">
            <Pagination
              currentPage={clinicPage}
              totalPages={Math.ceil(sortedClinicRows.length / clinicItemsPerPage)}
              onPageChange={setClinicPage}
              totalItems={sortedClinicRows.length}
              itemsPerPage={clinicItemsPerPage}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Doctor table */}
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">ドクター別売上</h3>
          <div className="mt-4 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">全{sortedDoctorRows.length.toLocaleString()}件</span>
                <span className="text-gray-400">|</span>
                <label htmlFor="doctor-items-per-page" className="whitespace-nowrap">表示件数:</label>
                <select
                  id="doctor-items-per-page"
                  value={doctorItemsPerPage}
                  onChange={(e) => {
                    setDoctorItemsPerPage(Number(e.target.value))
                    setDoctorPage(1)
                  }}
                  className="px-2 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5件</option>
                  <option value={10}>10件</option>
                  <option value={20}>20件</option>
                  <option value={50}>50件</option>
                  <option value={100}>100件</option>
                </select>
              </div>
              {sortedDoctorRows.length > doctorItemsPerPage && (
                <div className="text-sm text-gray-700">
                  {(doctorPage - 1) * doctorItemsPerPage + 1} - {Math.min(doctorPage * doctorItemsPerPage, sortedDoctorRows.length)} / {sortedDoctorRows.length.toLocaleString()} 件
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <div className="overflow-x-auto overflow-y-visible max-h-[500px] border rounded-md shadow-inner">
              <table className="min-w-full text-xs">
                <thead className="sticky top-0 z-10 bg-gray-50">
                  <tr>
                    <th 
                      rowSpan={2}
                      className="sticky left-0 z-20 px-3 py-2 text-left border-r cursor-pointer hover:bg-gray-100 whitespace-nowrap bg-gray-50"
                      onClick={() => handleDoctorSort('name')}
                    >
                      担当者 {getSortIcon('name', doctorSortField, doctorSortDirection)}
                    </th>
                    {months.map((m, idx)=>(<th 
                      key={m.label}
                      colSpan={3}
                      className="px-3 py-2 text-center cursor-pointer hover:bg-gray-100 whitespace-nowrap border-x"
                      onClick={() => handleDoctorSort(String(idx))}
                    >
                      {m.label} {getSortIcon(String(idx), doctorSortField, doctorSortDirection)}
                    </th>))}
                    <th 
                      rowSpan={2}
                      className="sticky right-0 z-20 px-3 py-2 text-right border-l cursor-pointer hover:bg-gray-100 whitespace-nowrap bg-gray-50"
                      onClick={() => handleDoctorSort('total')}
                    >
                      計 {getSortIcon('total', doctorSortField, doctorSortDirection)}
                    </th>
                  </tr>
                  <tr>
                    {months.map((m, idx)=>(<React.Fragment key={`sub-${m.label}`}>
                      <th className="px-2 py-1 text-xs text-right border-x">売上</th>
                      <th className="px-2 py-1 text-xs text-right border-x">件数</th>
                      <th className="px-2 py-1 text-xs text-right border-x">当月単価</th>
                    </React.Fragment>))}
                  </tr>
                </thead>
                <tbody>
                  {(sortedDoctorRows.length > doctorItemsPerPage ? sortedDoctorRows.slice((doctorPage-1)*doctorItemsPerPage, doctorPage*doctorItemsPerPage) : sortedDoctorRows).map((row,i)=> (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="sticky left-0 z-10 px-3 py-2 font-medium bg-white border-r">{row.name}</td>
                      {row.revenue.map((revenue, j) => {
                        const count = row.count[j]
                        const unitPrice = count > 0 ? revenue / count : 0
                        return (
                          <React.Fragment key={j}>
                            <td className="px-2 py-2 text-right border-x">{Math.round(revenue).toLocaleString()}</td>
                            <td className="px-2 py-2 text-right border-x">{count.toLocaleString()}</td>
                            <td className="px-2 py-2 text-right border-x">{Math.round(unitPrice).toLocaleString()}</td>
                          </React.Fragment>
                        )
                      })}
                      <td className="sticky right-0 z-10 px-3 py-2 font-semibold text-right bg-white border-l">
                        <div>{Math.round(row.totalRevenue).toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{row.totalCount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{Math.round(row.totalUnitPrice).toLocaleString()}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-center text-gray-500">
              <span>←</span>
              <span>横にスクロールして全期間を表示</span>
              <span>→</span>
            </div>
          </div>
          <div className="mt-4">
            <Pagination
              currentPage={doctorPage}
              totalPages={Math.ceil(sortedDoctorRows.length / doctorItemsPerPage)}
              onPageChange={setDoctorPage}
              totalItems={sortedDoctorRows.length}
              itemsPerPage={doctorItemsPerPage}
            />
          </div>
        </div>

        {/* Counselor table */}
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">カウンセラー別売上</h3>
          <div className="mt-4 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">全{sortedCounselorRows.length.toLocaleString()}件</span>
                <span className="text-gray-400">|</span>
                <label htmlFor="counselor-items-per-page" className="whitespace-nowrap">表示件数:</label>
                <select
                  id="counselor-items-per-page"
                  value={counselorItemsPerPage}
                  onChange={(e) => {
                    setCounselorItemsPerPage(Number(e.target.value))
                    setCounselorPage(1)
                  }}
                  className="px-2 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5件</option>
                  <option value={10}>10件</option>
                  <option value={20}>20件</option>
                  <option value={50}>50件</option>
                  <option value={100}>100件</option>
                </select>
              </div>
              {sortedCounselorRows.length > counselorItemsPerPage && (
                <div className="text-sm text-gray-700">
                  {(counselorPage - 1) * counselorItemsPerPage + 1} - {Math.min(counselorPage * counselorItemsPerPage, sortedCounselorRows.length)} / {sortedCounselorRows.length.toLocaleString()} 件
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <div className="overflow-x-auto overflow-y-visible max-h-[500px] border rounded-md shadow-inner">
              <table className="min-w-full text-xs">
                <thead className="sticky top-0 z-10 bg-gray-50">
                  <tr>
                    <th 
                      rowSpan={2}
                      className="sticky left-0 z-20 px-3 py-2 text-left border-r cursor-pointer hover:bg-gray-100 whitespace-nowrap bg-gray-50"
                      onClick={() => handleCounselorSort('name')}
                    >
                      担当者 {getSortIcon('name', counselorSortField, counselorSortDirection)}
                    </th>
                    {months.map((m, idx)=>(<th 
                      key={m.label}
                      colSpan={3}
                      className="px-3 py-2 text-center cursor-pointer hover:bg-gray-100 whitespace-nowrap border-x"
                      onClick={() => handleCounselorSort(String(idx))}
                    >
                      {m.label} {getSortIcon(String(idx), counselorSortField, counselorSortDirection)}
                    </th>))}
                    <th 
                      rowSpan={2}
                      className="sticky right-0 z-20 px-3 py-2 text-right border-l cursor-pointer hover:bg-gray-100 whitespace-nowrap bg-gray-50"
                      onClick={() => handleCounselorSort('total')}
                    >
                      計 {getSortIcon('total', counselorSortField, counselorSortDirection)}
                    </th>
                  </tr>
                  <tr>
                    {months.map((m, idx)=>(<React.Fragment key={`sub-${m.label}`}>
                      <th className="px-2 py-1 text-xs text-right border-x">売上</th>
                      <th className="px-2 py-1 text-xs text-right border-x">件数</th>
                      <th className="px-2 py-1 text-xs text-right border-x">当月単価</th>
                    </React.Fragment>))}
                  </tr>
                </thead>
                <tbody>
                  {(sortedCounselorRows.length > counselorItemsPerPage
                    ? sortedCounselorRows.slice(
                        (counselorPage - 1) * counselorItemsPerPage,
                        counselorPage * counselorItemsPerPage
                      )
                    : sortedCounselorRows
                  ).map((row, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="sticky left-0 z-10 px-3 py-2 font-medium bg-white border-r">{row.name}</td>
                      {row.revenue.map((revenue, j) => {
                        const count = row.count[j]
                        const unitPrice = count > 0 ? revenue / count : 0
                        return (
                          <React.Fragment key={j}>
                            <td className="px-2 py-2 text-right border-x">{Math.round(revenue).toLocaleString()}</td>
                            <td className="px-2 py-2 text-right border-x">{count.toLocaleString()}</td>
                            <td className="px-2 py-2 text-right border-x">{Math.round(unitPrice).toLocaleString()}</td>
                          </React.Fragment>
                        )
                      })}
                      <td className="sticky right-0 z-10 px-3 py-2 font-semibold text-right bg-white border-l">
                        <div>{Math.round(row.totalRevenue).toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{row.totalCount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{Math.round(row.totalUnitPrice).toLocaleString()}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-center text-gray-500">
              <span>←</span>
              <span>横にスクロールして全期間を表示</span>
              <span>→</span>
            </div>
          </div>
          <div className="mt-4">
            <Pagination
              currentPage={counselorPage}
              totalPages={Math.ceil(sortedCounselorRows.length / counselorItemsPerPage)}
              onPageChange={setCounselorPage}
              totalItems={sortedCounselorRows.length}
              itemsPerPage={counselorItemsPerPage}
            />
          </div>
        </div>

        {/* UC table */}
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">UC</h3>
          <div className="mt-4 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">全{sortedUcRows.length.toLocaleString()}件</span>
                <span className="text-gray-400">|</span>
                <label htmlFor="uc-items-per-page" className="whitespace-nowrap">表示件数:</label>
                <select
                  id="uc-items-per-page"
                  value={ucItemsPerPage}
                  onChange={(e) => {
                    setUcItemsPerPage(Number(e.target.value))
                    setUcPage(1)
                  }}
                  className="px-2 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5件</option>
                  <option value={10}>10件</option>
                  <option value={20}>20件</option>
                  <option value={50}>50件</option>
                  <option value={100}>100件</option>
                </select>
              </div>
              {sortedUcRows.length > ucItemsPerPage && (
                <div className="text-sm text-gray-700">
                  {(ucPage - 1) * ucItemsPerPage + 1} - {Math.min(ucPage * ucItemsPerPage, sortedUcRows.length)} / {sortedUcRows.length.toLocaleString()} 件
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <div className="overflow-x-auto overflow-y-visible max-h-[500px] border rounded-md shadow-inner">
              <table className="min-w-full text-xs">
                <thead className="sticky top-0 z-10 bg-gray-50">
                  <tr>
                    <th 
                      rowSpan={2}
                      className="sticky left-0 z-20 px-3 py-2 text-left border-r cursor-pointer hover:bg-gray-100 whitespace-nowrap bg-gray-50"
                      onClick={() => handleUcSort('treatment')}
                    >
                      UC {getSortIcon('treatment', ucSortField, ucSortDirection)}
                    </th>
                    {months.map((m, idx)=>(<th 
                      key={m.label}
                      colSpan={3}
                      className="px-3 py-2 text-center cursor-pointer hover:bg-gray-100 whitespace-nowrap border-x"
                      onClick={() => handleUcSort(String(idx))}
                    >
                      {m.label} {getSortIcon(String(idx), ucSortField, ucSortDirection)}
                    </th>))}
                    <th 
                      rowSpan={2}
                      className="sticky right-0 z-20 px-3 py-2 text-right border-l cursor-pointer hover:bg-gray-100 whitespace-nowrap bg-gray-50"
                      onClick={() => handleUcSort('total')}
                    >
                      計 {getSortIcon('total', ucSortField, ucSortDirection)}
                    </th>
                  </tr>
                  <tr>
                    {months.map((m, idx)=>(<React.Fragment key={`sub-${m.label}`}>
                      <th className="px-2 py-1 text-xs text-right border-x">件数</th>
                      <th className="px-2 py-1 text-xs text-right border-x">UC件数</th>
                      <th className="px-2 py-1 text-xs text-right border-x">割合</th>
                    </React.Fragment>))}
                  </tr>
                </thead>
                <tbody>
                  {(sortedUcRows.length > ucItemsPerPage
                    ? sortedUcRows.slice(
                        (ucPage - 1) * ucItemsPerPage,
                        ucPage * ucItemsPerPage
                      )
                    : sortedUcRows
                  ).map((row: any, i: number) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="sticky left-0 z-10 px-3 py-2 font-medium bg-white border-r">{row.treatment}</td>
                      {row.arr.map((v: number, j: number) => {
                        const ucCount = row.ucArr[j]
                        const ratio = v > 0 ? (ucCount / v) * 100 : 0
                        return (
                          <React.Fragment key={j}>
                            <td className="px-2 py-2 text-right border-x">{v.toLocaleString()}</td>
                            <td className="px-2 py-2 text-right border-x">{ucCount.toLocaleString()}</td>
                            <td className="px-2 py-2 text-right border-x">{v > 0 ? `${Math.round(ratio)}%` : '-'}</td>
                          </React.Fragment>
                        )
                      })}
                      <td className="sticky right-0 z-10 px-3 py-2 font-semibold text-right bg-white border-l">
                        <div>{row.total.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">UC: {row.ucCount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{row.total > 0 ? `${Math.round((row.ucCount / row.total) * 100)}%` : '-'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-center text-gray-500">
              <span>←</span>
              <span>横にスクロールして全期間を表示</span>
              <span>→</span>
            </div>
          </div>
          <div className="mt-4">
            <Pagination
              currentPage={ucPage}
              totalPages={Math.ceil(sortedUcRows.length / ucItemsPerPage)}
              onPageChange={setUcPage}
              totalItems={sortedUcRows.length}
              itemsPerPage={ucItemsPerPage}
            />
          </div>
        </div>

        {/* Reservation Route table */}
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">予約経路</h3>
          <div className="mt-4 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">全{sortedReservationRouteRows.length.toLocaleString()}件</span>
                <span className="text-gray-400">|</span>
                <label htmlFor="reservation-route-items-per-page" className="whitespace-nowrap">表示件数:</label>
                <select
                  id="reservation-route-items-per-page"
                  value={reservationRouteItemsPerPage}
                  onChange={(e) => {
                    setReservationRouteItemsPerPage(Number(e.target.value))
                    setReservationRoutePage(1)
                  }}
                  className="px-2 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5件</option>
                  <option value={10}>10件</option>
                  <option value={20}>20件</option>
                  <option value={50}>50件</option>
                  <option value={100}>100件</option>
                </select>
              </div>
              {sortedReservationRouteRows.length > reservationRouteItemsPerPage && (
                <div className="text-sm text-gray-700">
                  {(reservationRoutePage - 1) * reservationRouteItemsPerPage + 1} - {Math.min(reservationRoutePage * reservationRouteItemsPerPage, sortedReservationRouteRows.length)} / {sortedReservationRouteRows.length.toLocaleString()} 件
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <div className="overflow-x-auto overflow-y-visible max-h-[500px] border rounded-md shadow-inner">
              <table className="min-w-full text-xs">
                <thead className="sticky top-0 z-10 bg-gray-50">
                  <tr>
                    <th 
                      rowSpan={2}
                      className="sticky left-0 z-20 px-3 py-2 text-left border-r cursor-pointer hover:bg-gray-100 whitespace-nowrap bg-gray-50"
                      onClick={() => handleReservationRouteSort('route')}
                    >
                      予約経路 {getSortIcon('route', reservationRouteSortField, reservationRouteSortDirection)}
                    </th>
                    {months.map((m, idx)=>(<th 
                      key={m.label}
                      colSpan={3}
                      className="px-3 py-2 text-center cursor-pointer hover:bg-gray-100 whitespace-nowrap border-x"
                      onClick={() => handleReservationRouteSort(String(idx))}
                    >
                      {m.label} {getSortIcon(String(idx), reservationRouteSortField, reservationRouteSortDirection)}
                    </th>))}
                    <th 
                      rowSpan={2}
                      className="sticky right-0 z-20 px-3 py-2 text-right border-l cursor-pointer hover:bg-gray-100 whitespace-nowrap bg-gray-50"
                      onClick={() => handleReservationRouteSort('total')}
                    >
                      計 {getSortIcon('total', reservationRouteSortField, reservationRouteSortDirection)}
                    </th>
                  </tr>
                  <tr>
                    {months.map((m, idx)=>(<React.Fragment key={`sub-${m.label}`}>
                      <th className="px-2 py-1 text-xs text-right border-x">件数</th>
                      <th className="px-2 py-1 text-xs text-right border-x">UC件数</th>
                      <th className="px-2 py-1 text-xs text-right border-x">割合</th>
                    </React.Fragment>))}
                  </tr>
                </thead>
                <tbody>
                  {(sortedReservationRouteRows.length > reservationRouteItemsPerPage ? sortedReservationRouteRows.slice((reservationRoutePage-1)*reservationRouteItemsPerPage, reservationRoutePage*reservationRouteItemsPerPage) : sortedReservationRouteRows).map((row,i)=> (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="sticky left-0 z-10 px-3 py-2 font-medium bg-white border-r">{row.route}</td>
                      {row.arr.map((v,j)=> {
                        const ucCount = row.ucArr[j]
                        const ratio = v > 0 ? (ucCount / v) * 100 : 0
                        return (
                          <React.Fragment key={j}>
                            <td className="px-2 py-2 text-right border-x">{v.toLocaleString()}</td>
                            <td className="px-2 py-2 text-right border-x">{ucCount.toLocaleString()}</td>
                            <td className="px-2 py-2 text-right border-x">{v > 0 ? `${Math.round(ratio)}%` : '-'}</td>
                          </React.Fragment>
                        )
                      })}
                      <td className="sticky right-0 z-10 px-3 py-2 font-semibold text-right bg-white border-l">
                        <div>{row.total.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">UC: {row.ucCount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{row.total > 0 ? `${Math.round((row.ucCount / row.total) * 100)}%` : '-'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-center text-gray-500">
              <span>←</span>
              <span>横にスクロールして全期間を表示</span>
              <span>→</span>
            </div>
          </div>
          <div className="mt-4">
            <Pagination
              currentPage={reservationRoutePage}
              totalPages={Math.ceil(sortedReservationRouteRows.length / reservationRouteItemsPerPage)}
              onPageChange={setReservationRoutePage}
              totalItems={sortedReservationRouteRows.length}
              itemsPerPage={reservationRouteItemsPerPage}
            />
          </div>
        </div>
      </div>
    </div>
  )
}


