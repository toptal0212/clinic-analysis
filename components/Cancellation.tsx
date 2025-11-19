'use client'

import React, { useMemo, useEffect } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend } from 'chart.js'
import { Chart } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend)

function useAllAccounts() {
  const { state } = useDashboard()
  return useMemo(() => {
    const all: any[] = []
    
    // The state.data.dailyAccounts is already filtered by selectedClinic and dateRange
    // via the useDashboard hook's filteredState
    if (state.data?.dailyAccounts && Array.isArray(state.data.dailyAccounts)) {
      all.push(...state.data.dailyAccounts)
    }
    
    // Also check clinicData which is also filtered
    if (state.data?.clinicData) {
      Object.values(state.data.clinicData).forEach((clinic: any) => {
        if (clinic?.dailyAccounts && Array.isArray(clinic.dailyAccounts)) {
          // Avoid duplicates - only add if not already in all
          clinic.dailyAccounts.forEach((record: any) => {
            const exists = all.some(r => 
              r.recordDate === record.recordDate && 
              r.visitorId === record.visitorId &&
              r.visitorKarteNumber === record.visitorKarteNumber
            )
            if (!exists) {
              all.push(record)
            }
          })
        }
      })
    }

    console.log('📊 [Cancellation] useAllAccounts:', {
      selectedClinic: state.selectedClinic,
      dateRange: state.dateRange,
      dailyAccountsCount: state.data?.dailyAccounts?.length || 0,
      clinicDataCount: state.data?.clinicData ? 
        Object.values(state.data.clinicData).reduce((sum: number, c: any) => 
          sum + (c?.dailyAccounts?.length || 0), 0) : 0,
      totalAfterMerge: all.length,
      sampleRecord: all[0] ? {
        recordDate: all[0].recordDate,
        visitorName: all[0].visitorName,
        cancelPriceWithTax: all[0].cancelPriceWithTax,
        refundPriceWithTax: all[0].refundPriceWithTax,
        coolingoffPriceWithTax: all[0].coolingoffPriceWithTax,
        totalWithTax: all[0].totalWithTax,
        hasCancelFields: !!(all[0].cancelPriceWithTax || all[0].refundPriceWithTax || all[0].coolingoffPriceWithTax)
      } : null
    })

    return all
  }, [state.data.dailyAccounts, state.data.clinicData, state.selectedClinic, state.dateRange])
}

function toYmd(d: any) {
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return null
  return { y: dt.getFullYear(), m: dt.getMonth() + 1 }
}

export default function Cancellation() {
  const { state } = useDashboard()
  const all = useAllAccounts()

  // Debug: Check cancellation data availability
  useEffect(() => {
    if (all.length > 0) {
      const cancelRecords = all.filter((r: any) => {
        const cancelAmount = (r.cancelPriceWithTax || 0) + (r.refundPriceWithTax || 0) + (r.coolingoffPriceWithTax || 0)
        return cancelAmount > 0
      })
      
      console.log('📊 [Cancellation] Cancellation data analysis:', {
        totalRecords: all.length,
        recordsWithCancellation: cancelRecords.length,
        selectedClinic: state.selectedClinic,
        dateRange: state.dateRange,
        apiConnected: state.apiConnected,
        sampleCancelRecord: cancelRecords[0] || null,
        sampleRegularRecord: all.find((r: any) => {
          const cancelAmount = (r.cancelPriceWithTax || 0) + (r.refundPriceWithTax || 0) + (r.coolingoffPriceWithTax || 0)
          return cancelAmount === 0
        }) || null
      })
    } else {
      console.log('📊 [Cancellation] No data available:', {
        selectedClinic: state.selectedClinic,
        dateRange: state.dateRange,
        apiConnected: state.apiConnected,
        dailyAccountsCount: state.data?.dailyAccounts?.length || 0,
        clinicDataExists: !!state.data?.clinicData
      })
    }
  }, [all, state.selectedClinic, state.dateRange, state.apiConnected])

  // Monthly aggregates
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const monthly = useMemo(() => {
    const map = new Map<number, { cancelAmount: number, cancelCount: number }>()
    months.forEach(m => map.set(m, { cancelAmount: 0, cancelCount: 0 }))
    all.forEach(r => {
      const d = toYmd(r.recordDate || r.visitDate || r.treatmentDate || r.accountingDate)
      if (!d) return
      const cancelAmount =
        (r.cancelPriceWithTax || 0) +
        (r.refundPriceWithTax || 0) +
        (r.coolingoffPriceWithTax || 0)
      if (cancelAmount <= 0) return
      const cur = map.get(d.m)!
      cur.cancelAmount += cancelAmount
      cur.cancelCount += 1
    })
    return months.map(m => ({ m, ...map.get(m)! }))
  }, [all])

  const monthlyRevenueLine = useMemo(() => ({
    labels: months.map(m => `${m}月`),
    datasets: [{
      type: 'line' as const,
      label: '取消金額',
      data: monthly.map(x => x.cancelAmount),
      borderColor: '#F59E0B',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      tension: 0.3,
      pointRadius: 2,
      yAxisID: 'y1'
    }]
  }), [monthly])

  // Stacked bar by major category per month (based on cancellation amounts)
  const categoryStack = useMemo(() => {
    const categories = Array.from(new Set(all.map(r => r.paymentItems?.[0]?.category || r.treatmentCategory || r.category || '未分類')))
    const color = ['#2563EB','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#84CC16','#F97316']
    const labels = months.map(m => `${m}月`)
    const datasets = categories.map((c, i) => ({
      type: 'bar' as const,
      label: c,
      data: months.map(m => {
        let sum = 0
        all.forEach(r => {
          const d = toYmd(r.recordDate || r.visitDate || r.treatmentDate || r.accountingDate)
          if (!d || d.m !== m) return
          const cancelAmount = (r.cancelPriceWithTax || 0) + (r.refundPriceWithTax || 0) + (r.coolingoffPriceWithTax || 0)
          const cat = r.paymentItems?.[0]?.category || r.treatmentCategory || r.category || '未分類'
          if (cancelAmount > 0 && cat === c) sum += cancelAmount
        })
        return sum
      }),
      backgroundColor: color[i % color.length],
      borderColor: color[i % color.length],
      borderWidth: 1,
      stack: 'sales',
      yAxisID: 'y1'
    }))
    return { labels, datasets }
  }, [all])

  const smallLines = useMemo(() => {
    const cancelCount = monthly.map(x => x.cancelCount)
    const cancelAmount = monthly.map(x => x.cancelAmount)
    const avgCancel = monthly.map((x) => (x.cancelCount > 0 ? x.cancelAmount / x.cancelCount : 0))
    const mk = (label: string, data: number[], color: string) => ({
      labels: months.map(m => `${m}月`),
      datasets: [{ type: 'line' as const, label, data, borderColor: color, backgroundColor: color, tension: 0.3, pointRadius: 0 }]
    })
    return {
      visits: mk('取消件数', cancelCount, '#2563EB'),
      bookings: mk('取消金額', cancelAmount, '#10B981'),
      cancels: mk('平均取消額', avgCancel, '#EF4444')
    }
  }, [monthly])

  // Heatmap helper
  function buildHeat(groupKey: (r: any) => string) {
    const map = new Map<string, number>()
    all.forEach(r => {
      const cancelAmount = (r.cancelPriceWithTax || 0) + (r.refundPriceWithTax || 0) + (r.coolingoffPriceWithTax || 0)
      if (cancelAmount <= 0) return
      const g = groupKey(r) || 'その他'
      map.set(g, (map.get(g) || 0) + cancelAmount)
    })
    const items = Array.from(map.entries()).sort((a,b) => b[1]-a[1]).slice(0, 12)
    const max = items.length ? items[0][1] : 1
    return { items, max }
  }

  const heatAgeGender = useMemo(() => buildHeat(r => {
    const age = Number(r.age ?? r.patientAge)
    const decade = Number.isFinite(age) ? `${Math.floor(age/10)*10}代` : '不明'
    const gender = (r.gender || r.patientGender || '不明').toString()
    return `${decade}/${gender}`
  }), [all])
  const heatCategory = useMemo(() => buildHeat(r => r.paymentItems?.[0]?.category || r.treatmentCategory || r.category || '未分類'), [all])
  const heatClinic = useMemo(() => buildHeat(r => r.clinicName || 'その他'), [all])
  const heatProcedure = useMemo(() => buildHeat(r => r.paymentItems?.[0]?.name || r.treatmentName || r.treatment || '未分類'), [all])

  const HeatTable = ({ title, data }: { title: string, data: { items: [string, number][], max: number } }) => (
    <div className="p-4 bg-white border rounded-lg shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">{title}</h3>
      <table className="w-full text-xs">
        <tbody>
          {data.items.map(([k, v]) => {
            const ratio = v / (data.max || 1)
            const bg = `rgba(37, 99, 235, ${0.15 + ratio*0.6})`
            return (
              <tr key={k} className="border-t">
                <td className="px-2 py-1 whitespace-nowrap">{k}</td>
                <td className="px-2 py-1 text-right" style={{ backgroundColor: bg }}>
                  {new Intl.NumberFormat('ja-JP',{style:'currency',currency:'JPY',maximumFractionDigits:0}).format(v)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  // Check if there's any cancellation data
  const hasCancellationData = useMemo(() => {
    return all.some(r => {
      const cancelAmount = (r.cancelPriceWithTax || 0) + (r.refundPriceWithTax || 0) + (r.coolingoffPriceWithTax || 0)
      return cancelAmount > 0
    })
  }, [all])


  // Show empty state if no cancellation data
  if (!hasCancellationData) {
    const totalRecords = all.length
    const hasDataButNoCancel = totalRecords > 0
    const sampleRecord = all[0]
    
    return (
      <div className="p-6 space-y-6">
        <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-2">
            📊 予約キャンセルのデータがありません
          </p>
          {hasDataButNoCancel ? (
            <div className="mt-2 space-y-2 text-xs text-gray-600">
              <p>• データレコード数: {totalRecords}件</p>
              <p>• 選択中の院: {state.selectedClinic === 'all' ? '全院' : state.selectedClinic}</p>
              <p>• 選択中の期間: {state.dateRange?.start} ～ {state.dateRange?.end}</p>
              <p>• キャンセル関連の金額フィールド（cancelPriceWithTax, refundPriceWithTax, coolingoffPriceWithTax）に値がありません</p>
              <div className="mt-3 p-2 bg-white rounded border">
                <p className="font-medium mb-1">サンプルレコードの構造:</p>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify({
                    recordDate: sampleRecord?.recordDate,
                    visitorName: sampleRecord?.visitorName,
                    cancelPriceWithTax: sampleRecord?.cancelPriceWithTax,
                    refundPriceWithTax: sampleRecord?.refundPriceWithTax,
                    coolingoffPriceWithTax: sampleRecord?.coolingoffPriceWithTax,
                    totalWithTax: sampleRecord?.totalWithTax,
                    hasCancelFields: !!(sampleRecord?.cancelPriceWithTax || sampleRecord?.refundPriceWithTax || sampleRecord?.coolingoffPriceWithTax)
                  }, null, 2)}
                </pre>
              </div>
              <p className="mt-2 text-yellow-700">
                💡 ヒント: 期間を広げるか、「全院」を選択してデータを確認してください
              </p>
            </div>
          ) : (
            <div className="mt-2 space-y-2 text-xs text-gray-600">
              <p>• データが読み込まれていません</p>
              <p>• API接続状態: {state.apiConnected ? '✅ 接続済み' : '❌ 未接続'}</p>
              {!state.apiConnected && (
                <p>• APIに接続するか、CSVファイルをインポートしてください</p>
              )}
              {state.apiConnected && (
                <div className="mt-2 space-y-1">
                  <p>• フィルター条件を確認してください:</p>
                  <p>  - 院選択: {state.selectedClinic === 'all' ? '全院' : state.selectedClinic}</p>
                  <p>  - 期間: {state.dateRange?.start || '未設定'} ～ {state.dateRange?.end || '未設定'}</p>
                  <p>• ヘッダーの「フィルター適用」ボタンをクリックしてデータを更新してください</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left column charts */}
        <div className="space-y-6 xl:col-span-2">
          <div className="p-4 bg-white border rounded-lg shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">キャンセル取得目基準の推移</h3>
            <div className="h-56">
              <Chart type="line" data={monthlyRevenueLine as any} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { mode:'index', intersect:false } },
                scales: { y1: { ticks: { callback:(v:any)=>`¥${(Number(v)/1000000).toFixed(0)}M` } } }
              }} />
            </div>
            <div className="mt-4 h-40">
              <Chart type="bar" data={categoryStack as any} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position:'bottom', labels: { usePointStyle:true } } },
                scales: { x: { stacked: true }, y1: { stacked: true, ticks: { callback:(v:any)=>`¥${(Number(v)/1000000).toFixed(0)}M` } } }
              }} />
            </div>
          </div>
          <div className="p-4 bg-white border rounded-lg shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">予約取得目基準の推移</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="h-40"><Chart type="line" data={smallLines.visits as any} options={{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} }} /></div>
              <div className="h-40"><Chart type="line" data={smallLines.bookings as any} options={{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} }} /></div>
              <div className="h-40"><Chart type="line" data={smallLines.cancels as any} options={{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} }} /></div>
            </div>
          </div>
        </div>

        {/* Right column heatmaps */}
        <div className="space-y-4">
          <HeatTable title="年代・性別" data={heatAgeGender} />
          <HeatTable title="カテゴリ別" data={heatCategory} />
          <HeatTable title="院別" data={heatClinic} />
          <HeatTable title="施術別" data={heatProcedure} />
        </div>
      </div>
    </div>
  )
}


