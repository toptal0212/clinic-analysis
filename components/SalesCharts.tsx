'use client'

import React from 'react'
import { BarChart3, PieChart, TrendingUp, Users } from 'lucide-react'

interface SalesChartsProps {
  salesMetrics: {
    total: {
      visitBasedSales: number
      paymentBasedSales: number
      patientCount: number
      unitPrice: number
      sameDayUnitPrice: number
    }
    new: {
      sales: number
      count: number
      unitPrice: number
      sameDayUnitPrice: number
      crossMonthSales: number
      crossMonthUnitPrice: number
    }
    existing: {
      sales: number
      count: number
      unitPrice: number
      sameDayUnitPrice: number
      crossMonthSales: number
      crossMonthUnitPrice: number
    }
    other: {
      sales: number
      count: number
      unitPrice: number
      sameDayUnitPrice: number
    }
  } | null
  selectedMonth: string
}

export default function SalesCharts({ salesMetrics, selectedMonth }: SalesChartsProps) {
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

  if (!salesMetrics) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <div className="text-center text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-4" />
          <p>データがありません</p>
        </div>
      </div>
    )
  }

  // Calculate percentages for pie chart
  const totalSales = salesMetrics.total.visitBasedSales
  const newPercentage = totalSales > 0 ? (salesMetrics.new.sales / totalSales) * 100 : 0
  const existingPercentage = totalSales > 0 ? (salesMetrics.existing.sales / totalSales) * 100 : 0
  const otherPercentage = totalSales > 0 ? (salesMetrics.other.sales / totalSales) * 100 : 0

  // Calculate patient distribution
  const totalPatients = salesMetrics.total.patientCount
  const newPatientPercentage = totalPatients > 0 ? (salesMetrics.new.count / totalPatients) * 100 : 0
  const existingPatientPercentage = totalPatients > 0 ? (salesMetrics.existing.count / totalPatients) * 100 : 0
  const otherPatientPercentage = totalPatients > 0 ? (salesMetrics.other.count / totalPatients) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-blue-600">総売上</p>
              <p className="text-xl font-semibold text-blue-900">
                {formatCurrency(salesMetrics.total.visitBasedSales)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-green-600">総患者数</p>
              <p className="text-xl font-semibold text-green-900">
                {formatNumber(salesMetrics.total.patientCount)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-purple-600">平均単価</p>
              <p className="text-xl font-semibold text-purple-900">
                {formatCurrency(salesMetrics.total.unitPrice)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-orange-50 rounded-lg">
          <div className="flex items-center">
            <PieChart className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-orange-600">新規率</p>
              <p className="text-xl font-semibold text-orange-900">
                {newPatientPercentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category */}
        <div className="p-6 bg-white rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">売上構成比</h3>
          
          <div className="space-y-4">
            {/* New Patients */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">新規患者</span>
                <span className="text-sm text-gray-600">
                  {formatCurrency(salesMetrics.new.sales)} ({newPercentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${newPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Existing Patients */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">既存患者</span>
                <span className="text-sm text-gray-600">
                  {formatCurrency(salesMetrics.existing.sales)} ({existingPercentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${existingPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Other Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">その他</span>
                <span className="text-sm text-gray-600">
                  {formatCurrency(salesMetrics.other.sales)} ({otherPercentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${otherPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Count Distribution */}
        <div className="p-6 bg-white rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">患者数構成比</h3>
          
          <div className="space-y-4">
            {/* New Patients Count */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">新規患者数</span>
                <span className="text-sm text-gray-600">
                  {formatNumber(salesMetrics.new.count)} ({newPatientPercentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${newPatientPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Existing Patients Count */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">既存患者数</span>
                <span className="text-sm text-gray-600">
                  {formatNumber(salesMetrics.existing.count)} ({existingPatientPercentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${existingPatientPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Other Items Count */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">その他件数</span>
                <span className="text-sm text-gray-600">
                  {formatNumber(salesMetrics.other.count)} ({otherPatientPercentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${otherPatientPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unit Price Comparison */}
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">単価比較</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* New Patient Unit Price */}
          <div className="text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-600 mb-2">新規患者単価</h4>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(salesMetrics.new.unitPrice)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {formatNumber(salesMetrics.new.count)}件
              </p>
            </div>
          </div>

          {/* Existing Patient Unit Price */}
          <div className="text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="text-sm font-medium text-green-600 mb-2">既存患者単価</h4>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(salesMetrics.existing.unitPrice)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {formatNumber(salesMetrics.existing.count)}件
              </p>
            </div>
          </div>

          {/* Other Items Unit Price */}
          <div className="text-center">
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="text-sm font-medium text-purple-600 mb-2">その他単価</h4>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(salesMetrics.other.unitPrice)}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                {formatNumber(salesMetrics.other.count)}件
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">パフォーマンス指標</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">新規患者率</p>
            <p className="text-2xl font-bold text-blue-600">
              {newPatientPercentage.toFixed(1)}%
            </p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">既存患者率</p>
            <p className="text-2xl font-bold text-green-600">
              {existingPatientPercentage.toFixed(1)}%
            </p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">新規売上率</p>
            <p className="text-2xl font-bold text-blue-600">
              {newPercentage.toFixed(1)}%
            </p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">既存売上率</p>
            <p className="text-2xl font-bold text-green-600">
              {existingPercentage.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
