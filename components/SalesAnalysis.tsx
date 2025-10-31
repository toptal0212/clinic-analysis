'use client'

import React, { useMemo, useEffect } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar,
  AlertCircle
} from 'lucide-react'
import DemographicsCharts from './DemographicsCharts'

export default function SalesAnalysis() {
  const { state } = useDashboard()

  // Get all daily accounts data from all sources
  const getAllDailyAccounts = () => {
    const allData = []
    
    // Add data from main dailyAccounts
    if (state.data?.dailyAccounts && Array.isArray(state.data.dailyAccounts)) {
      allData.push(...state.data.dailyAccounts)
    }
    
    // Add data from clinic-specific dailyAccounts
    if (state.data?.clinicData) {
      Object.values(state.data.clinicData).forEach((clinic: any) => {
        if (clinic?.dailyAccounts && Array.isArray(clinic.dailyAccounts)) {
          allData.push(...clinic.dailyAccounts)
        }
      })
    }
    
    console.log('📊 [SalesAnalysis] Total daily accounts:', allData.length)
    return allData
  }

  // No dummy generation: rely only on API/CSV data present in DashboardContext

  // Calculate current month metrics
  const currentMonthMetrics = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    
    const allDailyAccounts = getAllDailyAccounts()
    
    const currentMonthData = allDailyAccounts.filter((record: any) => {
      const dateStr = record.recordDate || record.visitDate || record.treatmentDate || record.accountingDate
      if (!dateStr) return false
      const recordDate = new Date(dateStr)
      if (isNaN(recordDate.getTime())) return false
      return recordDate.getFullYear() === currentYear && recordDate.getMonth() === currentMonth
    })

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
    
    const lastMonthData = allDailyAccounts.filter((record: any) => {
      const dateStr = record.recordDate || record.visitDate || record.treatmentDate || record.accountingDate
      if (!dateStr) return false
      const recordDate = new Date(dateStr)
      if (isNaN(recordDate.getTime())) return false
      return recordDate.getFullYear() === lastMonthYear && recordDate.getMonth() === lastMonth
    })

    const lastYearMonthData = allDailyAccounts.filter((record: any) => {
      const dateStr = record.recordDate || record.visitDate || record.treatmentDate || record.accountingDate
      if (!dateStr) return false
      const recordDate = new Date(dateStr)
      if (isNaN(recordDate.getTime())) return false
      return recordDate.getFullYear() === currentYear - 1 && recordDate.getMonth() === currentMonth
    })

    const currentMonthVisitors = currentMonthData.length
    const currentMonthRevenue = currentMonthData.reduce((sum: number, record: any) => sum + (record.totalWithTax || 0), 0)
    const currentMonthUnitPrice = currentMonthVisitors > 0 ? currentMonthRevenue / currentMonthVisitors : 0

    const lastMonthVisitors = lastMonthData.length
    const lastMonthRevenue = lastMonthData.reduce((sum: number, record: any) => sum + (record.totalWithTax || 0), 0)
    const lastMonthUnitPrice = lastMonthVisitors > 0 ? lastMonthRevenue / lastMonthVisitors : 0

    const lastYearVisitors = lastYearMonthData.length
    const lastYearRevenue = lastYearMonthData.reduce((sum: number, record: any) => sum + (record.totalWithTax || 0), 0)
    const lastYearUnitPrice = lastYearVisitors > 0 ? lastYearRevenue / lastYearVisitors : 0

    return {
      currentMonthVisitors,
      currentMonthRevenue,
      currentMonthUnitPrice,
      lastMonthVisitors,
      lastMonthRevenue,
      lastMonthUnitPrice,
      lastYearVisitors,
      lastYearRevenue,
      lastYearUnitPrice,
      visitorMoM: lastMonthVisitors > 0 ? (currentMonthVisitors / lastMonthVisitors) * 100 : 0,
      visitorYoY: lastYearVisitors > 0 ? (currentMonthVisitors / lastYearVisitors) * 100 : 0,
      unitPriceMoM: lastMonthUnitPrice > 0 ? (currentMonthUnitPrice / lastMonthUnitPrice) * 100 : 0,
      unitPriceYoY: lastYearUnitPrice > 0 ? (currentMonthUnitPrice / lastYearUnitPrice) * 100 : 0,
      revenueMoM: lastMonthRevenue > 0 ? (currentMonthRevenue / lastMonthRevenue) * 100 : 0,
      revenueYoY: lastYearRevenue > 0 ? (currentMonthRevenue / lastYearRevenue) * 100 : 0,
    }
  }, [state.data.dailyAccounts, state.data.clinicData])

  // Calculate monthly trends (last 14 months)
  const monthlyTrends = useMemo(() => {
    const now = new Date()
    const months = []
    
    const allDailyAccounts = getAllDailyAccounts()
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = date.getMonth()
      
      const monthData = allDailyAccounts.filter((record: any) => {
        const dateStr = record.recordDate || record.visitDate || record.treatmentDate || record.accountingDate
        if (!dateStr) return false
        const recordDate = new Date(dateStr)
        if (isNaN(recordDate.getTime())) return false
        return recordDate.getFullYear() === year && recordDate.getMonth() === month
      })

      const reservations = monthData.length
      const visitors = monthData.filter((r: any) => r.isFirst !== false).length
      const revenue = monthData.reduce((sum: number, record: any) => sum + (record.totalWithTax || 0), 0)
      const unitPrice = visitors > 0 ? revenue / visitors : 0
      const visitRate = reservations > 0 ? (visitors / reservations) * 100 : 0
      
      const firstVisitCount = monthData.filter((r: any) => r.isFirst === true).length
      const firstVisitConversion = visitors > 0 ? (firstVisitCount / visitors) * 100 : 0
      
      const repeatCount = monthData.filter((r: any) => r.isFirst === false).length
      const repeatRate = visitors > 0 ? (repeatCount / visitors) * 100 : 0

      months.push({
        year,
        month,
        label: `${year}年${month + 1}月`,
        reservations,
        visitors,
        revenue,
        unitPrice,
        visitRate,
        firstVisitConversion,
        repeatRate
      })
    }
    
    return months
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
    return new Intl.NumberFormat('ja-JP').format(num)
  }

  const hasRealData = getAllDailyAccounts().length > 0

  // Debug log
  useEffect(() => {
    console.log('📊 [SalesAnalysis] Component rendered')
    console.log('📊 [SalesAnalysis] Has real data:', hasRealData)
    console.log('📊 [SalesAnalysis] Current month metrics:', currentMonthMetrics)
    console.log('📊 [SalesAnalysis] Monthly trends count:', monthlyTrends.length)
  }, [hasRealData, currentMonthMetrics, monthlyTrends.length])

  // Ensure we have data for rendering
  if (!monthlyTrends || monthlyTrends.length === 0) {
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
    <div className="p-6 space-y-6">
      {/* Data Source Notice removed: no dummy data */}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 今月来院数 */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">今月来院数</h3>
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="mb-2 text-3xl font-bold text-gray-900">
            {formatNumber(currentMonthMetrics.currentMonthVisitors)}件
          </div>
          <div className="space-y-1 text-sm">
            <div className="text-gray-600">今月見込: {formatNumber(Math.floor(currentMonthMetrics.currentMonthVisitors * 1.11))}件</div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">先月比:</span>
              {currentMonthMetrics.visitorMoM < 100 ? (
                <span className="flex items-center text-red-600">
                  <TrendingDown className="w-4 h-4 mr-1" />
                  {currentMonthMetrics.visitorMoM.toFixed(0)}%
                </span>
              ) : (
                <span className="flex items-center text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {currentMonthMetrics.visitorMoM.toFixed(0)}%
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">先年比:</span>
              <span className="flex items-center text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                {currentMonthMetrics.visitorYoY.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* 今月会計単価 */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">今月会計単価</h3>
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div className="mb-2 text-3xl font-bold text-gray-900">
            {formatCurrency(currentMonthMetrics.currentMonthUnitPrice)}
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">先月比:</span>
              {currentMonthMetrics.unitPriceMoM < 100 ? (
                <span className="flex items-center text-red-600">
                  <TrendingDown className="w-4 h-4 mr-1" />
                  {currentMonthMetrics.unitPriceMoM.toFixed(0)}%
                </span>
              ) : (
                <span className="flex items-center text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {currentMonthMetrics.unitPriceMoM.toFixed(0)}%
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">先年比:</span>
              <span className="flex items-center text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                {currentMonthMetrics.unitPriceYoY.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* 今月売上 */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">今月売上</h3>
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div className="mb-2 text-3xl font-bold text-gray-900">
            {formatCurrency(currentMonthMetrics.currentMonthRevenue)}
          </div>
          <div className="space-y-1 text-sm">
            <div className="text-gray-600">今月見込: {formatCurrency(Math.floor(currentMonthMetrics.currentMonthRevenue * 1.09))}</div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">先月比:</span>
              <span className="flex items-center text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                {currentMonthMetrics.revenueMoM.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">先年比:</span>
              <span className="flex items-center text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                {currentMonthMetrics.revenueYoY.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales Revenue Chart */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">売上推移</h3>
          <div className="mb-2 text-xs text-gray-500">
            最大値: {formatCurrency(Math.max(...monthlyTrends.map(t => t.revenue)))} | 
            最小値: {formatCurrency(Math.min(...monthlyTrends.map(t => t.revenue)))}
          </div>
          <div className="flex items-end justify-between h-64 space-x-1">
            {monthlyTrends.map((trend, index) => {
              const maxRevenue = Math.max(...monthlyTrends.map(t => t.revenue))
              const height = maxRevenue > 0 ? Math.max((trend.revenue / maxRevenue) * 100, 10) : 10 // Minimum 10% height
              const actualHeight = Math.max(height, 20) // Ensure at least 20px height
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="relative w-full bg-blue-200 rounded-t hover:bg-blue-300 group" style={{ minHeight: '30px' }}>
                    <div 
                      className="transition-all duration-300 bg-blue-500 rounded-t" 
                      style={{ height: `${actualHeight}px`, minHeight: '20px' }}
                    />
                    <div className="absolute px-2 py-1 text-xs text-white transform -translate-x-1/2 bg-gray-800 rounded opacity-0 -top-6 left-1/2 group-hover:opacity-100 whitespace-nowrap">
                      {formatCurrency(trend.revenue)}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 origin-left transform -rotate-45 whitespace-nowrap">
                    {trend.month + 1}月
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Visitor Numbers Chart */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">来院数推移</h3>
          <div className="mb-2 text-xs text-gray-500">
            最大値: {formatNumber(Math.max(...monthlyTrends.map(t => t.visitors)))} | 
            最小値: {formatNumber(Math.min(...monthlyTrends.map(t => t.visitors)))}
          </div>
          <div className="flex items-end justify-between h-64 space-x-1">
            {monthlyTrends.map((trend, index) => {
              const maxVisitors = Math.max(...monthlyTrends.map(t => t.visitors))
              const height = maxVisitors > 0 ? Math.max((trend.visitors / maxVisitors) * 100, 10) : 10 // Minimum 10% height
              const actualHeight = Math.max(height, 20) // Ensure at least 20px height
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="relative w-full bg-orange-200 rounded-t hover:bg-orange-300 group" style={{ minHeight: '30px' }}>
                    <div 
                      className="transition-all duration-300 bg-orange-500 rounded-t" 
                      style={{ height: `${actualHeight}px`, minHeight: '20px' }}
                    />
                    <div className="absolute px-2 py-1 text-xs text-white transform -translate-x-1/2 bg-gray-800 rounded opacity-0 -top-6 left-1/2 group-hover:opacity-100 whitespace-nowrap">
                      {formatNumber(trend.visitors)}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 origin-left transform -rotate-45 whitespace-nowrap">
                    {trend.month + 1}月
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Detailed Trends and Demographics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Detailed Trends */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">詳細トレンド</h3>
          
          {/* Color Legend */}
          <div className="p-3 mb-4 rounded-lg bg-gray-50">
            <div className="mb-2 text-xs font-medium text-gray-600">指標別カラー</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {['予約数', '来院数', '売上', '会計単価', '来院率', '初診成約率', 'リピート率'].map((metric, idx) => {
                const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-red-600', 'bg-amber-500', 'bg-violet-600', 'bg-rose-600', 'bg-cyan-600']
                return (
                  <div key={idx} className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${colors[idx]}`}></div>
                    <span className="text-gray-700">{metric}</span>
                  </div>
                )
              })}
            </div>
          </div>
          
          <div className="space-y-4 overflow-x-hidden overflow-y-auto max-h-[600px]">
            {['予約数', '来院数', '売上', '会計単価', '来院率', '初診成約率', 'リピート率'].map((metric, idx) => {
              const maxValue = Math.max(...monthlyTrends.map(t => {
                switch(metric) {
                  case '予約数': return t.reservations
                  case '来院数': return t.visitors
                  case '売上': return t.revenue / 1000000
                  case '会計単価': return t.unitPrice / 1000
                  case '来院率': return t.visitRate
                  case '初診成約率': return t.firstVisitConversion
                  case 'リピート率': return t.repeatRate
                  default: return 0
                }
              }))
              
              const currentValue = monthlyTrends[monthlyTrends.length - 1]
              const previousValue = monthlyTrends[monthlyTrends.length - 2]
              const change = previousValue ? 
                ((currentValue[metric === '予約数' ? 'reservations' : 
                  metric === '来院数' ? 'visitors' :
                  metric === '売上' ? 'revenue' : 
                  metric === '会計単価' ? 'unitPrice' :
                  metric === '来院率' ? 'visitRate' :
                  metric === '初診成約率' ? 'firstVisitConversion' : 'repeatRate'] - 
                  previousValue[metric === '予約数' ? 'reservations' : 
                  metric === '来院数' ? 'visitors' :
                  metric === '売上' ? 'revenue' : 
                  metric === '会計単価' ? 'unitPrice' :
                  metric === '来院率' ? 'visitRate' :
                  metric === '初診成約率' ? 'firstVisitConversion' : 'repeatRate']) / 
                  previousValue[metric === '予約数' ? 'reservations' : 
                  metric === '来院数' ? 'visitors' :
                  metric === '売上' ? 'revenue' : 
                  metric === '会計単価' ? 'unitPrice' :
                  metric === '来院率' ? 'visitRate' :
                  metric === '初診成約率' ? 'firstVisitConversion' : 'repeatRate']) * 100 : 0
              
              return (
                <div key={idx} className="pb-3 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-700">{metric}</span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${['bg-blue-600', 'bg-emerald-600', 'bg-red-600', 'bg-amber-500', 'bg-violet-600', 'bg-rose-600', 'bg-cyan-600'][idx]}`}></div>
                        <span className="text-xs text-gray-500">
                          最大: {metric === '売上' ? formatCurrency(maxValue * 1000000) :
                                metric === '会計単価' ? formatCurrency(maxValue * 1000) :
                                metric === '来院率' || metric === '初診成約率' || metric === 'リピート率' ? `${maxValue.toFixed(1)}%` :
                                formatNumber(maxValue)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {metric === '売上' && formatCurrency(currentValue.revenue)}
                        {metric === '会計単価' && formatCurrency(currentValue.unitPrice)}
                        {metric === '来院数' && formatNumber(currentValue.visitors)}
                        {metric === '予約数' && formatNumber(currentValue.reservations)}
                        {(metric === '来院率' || metric === '初診成約率' || metric === 'リピート率') && 
                          `${currentValue[metric === '来院率' ? 'visitRate' : metric === '初診成約率' ? 'firstVisitConversion' : 'repeatRate'].toFixed(1)}%`}
                      </span>
                      {change !== 0 && (
                        <span className={`text-xs flex items-center ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {change > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                          {Math.abs(change).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Monthly Chart */}
                  <div className="flex items-end p-2 space-x-1 overflow-hidden border rounded bg-gray-50 ">
                    {monthlyTrends.map((trend, i) => {
                      const value = metric === '予約数' ? trend.reservations :
                                   metric === '来院数' ? trend.visitors :
                                   metric === '売上' ? trend.revenue / 1000000 :
                                   metric === '会計単価' ? trend.unitPrice / 1000 :
                                   metric === '来院率' ? trend.visitRate :
                                   metric === '初診成約率' ? trend.firstVisitConversion :
                                   trend.repeatRate
                      const height = maxValue > 0 ? Math.max((value / maxValue) * 100, 20) : 20 // Minimum 20% height
                      const actualHeight = Math.max(height, 10) // Ensure at least 10px height
                      const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-red-600', 'bg-amber-500', 'bg-violet-600', 'bg-rose-600', 'bg-cyan-600']
                      const borderColors = ['border-blue-700', 'border-emerald-700', 'border-red-700', 'border-amber-600', 'border-violet-700', 'border-rose-700', 'border-cyan-700']
                      
                      return (
                        <div key={i} className="flex flex-col items-center flex-1 group">
                          <div className="relative">
                            <div 
                              className={`${colors[idx]} ${borderColors[idx]} border-2 rounded-t transition-all duration-300 hover:opacity-90 hover:scale-105 cursor-pointer shadow-sm`}
                              style={{ height: `${actualHeight}px`, minHeight: '8px' }}
                              title={`${trend.month + 1}月: ${metric} ${metric === '売上' ? formatCurrency(value * 1000000) :
                                     metric === '会計単価' ? formatCurrency(value * 1000) :
                                     metric === '来院率' || metric === '初診成約率' || metric === 'リピート率' ? `${value.toFixed(1)}%` :
                                     formatNumber(value)}`}
                            />
                            {/* Value label on top of bar */}
                            <div className="absolute transition-opacity transform -translate-x-1/2 opacity-0 -top-6 left-1/2 group-hover:opacity-100">
                              <div className="px-1 py-0.5 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
                                {metric === '売上' ? formatCurrency(value * 1000000) :
                                 metric === '会計単価' ? formatCurrency(value * 1000) :
                                 metric === '来院率' || metric === '初診成約率' || metric === 'リピート率' ? `${value.toFixed(1)}%` :
                                 formatNumber(value)}
                              </div>
                            </div>
                          </div>
                            <div className="mt-1 text-xs font-medium text-gray-600 transition-opacity origin-left transform -rotate-45 opacity-0 group-hover:opacity-100">
                            {trend.month + 1}月
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Trend Line */}
                  <div className="flex items-center mt-2 space-x-2">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <div className="text-xs text-gray-400">
                      {monthlyTrends.length}ヶ月の推移
                    </div>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Demographics Charts */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">顧客属性分析</h3>
          <DemographicsCharts />
        </div>
      </div>
    </div>
  )
}