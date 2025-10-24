'use client'

import React, { useState } from 'react'
import { useDashboard } from '@/contexts'
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp,
  Calendar,
  BarChart3
} from 'lucide-react'

interface ClinicDataViewProps {
  dateRange: { start: Date, end: Date }
}

export default function ClinicDataView({ dateRange }: ClinicDataViewProps) {
  const { state } = useDashboard()
  const [selectedClinic, setSelectedClinic] = useState<string>('all')

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

  const clinicNames = {
    yokohama: '横浜院',
    koriyama: '郡山院',
    mito: '水戸院',
    omiya: '大宮院'
  }

  const getClinicData = (clinicId: string) => {
    if (clinicId === 'all') {
      // Return combined data
      const allDailyAccounts = [
        ...state.data.clinicData.yokohama.dailyAccounts,
        ...state.data.clinicData.koriyama.dailyAccounts,
        ...state.data.clinicData.mito.dailyAccounts,
        ...state.data.clinicData.omiya.dailyAccounts
      ]
      
      const allPatients = [
        ...state.data.clinicData.yokohama.patients,
        ...state.data.clinicData.koriyama.patients,
        ...state.data.clinicData.mito.patients,
        ...state.data.clinicData.omiya.patients
      ]

      return {
        name: '全院',
        dailyAccounts: allDailyAccounts,
        patients: allPatients,
        totalRevenue: allDailyAccounts.reduce((sum: number, record: any) => sum + (record.totalWithTax || 0), 0),
        totalCount: allDailyAccounts.length,
        averageUnitPrice: allDailyAccounts.length > 0 ? allDailyAccounts.reduce((sum: number, record: any) => sum + (record.totalWithTax || 0), 0) / allDailyAccounts.length : 0
      }
    } else {
      const clinicData = state.data.clinicData[clinicId as keyof typeof state.data.clinicData]
      return {
        name: clinicNames[clinicId as keyof typeof clinicNames],
        dailyAccounts: clinicData.dailyAccounts,
        patients: clinicData.patients,
        totalRevenue: clinicData.dailyAccounts.reduce((sum: number, record: any) => sum + (record.totalWithTax || 0), 0),
        totalCount: clinicData.dailyAccounts.length,
        averageUnitPrice: clinicData.dailyAccounts.length > 0 ? clinicData.dailyAccounts.reduce((sum: number, record: any) => sum + (record.totalWithTax || 0), 0) / clinicData.dailyAccounts.length : 0
      }
    }
  }

  const currentData = getClinicData(selectedClinic)

  if (!state.apiConnected || !state.data.clinicData) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            <p className="text-lg text-gray-600">データを読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Clinic Selection */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">クリニック選択</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
          <button
            onClick={() => setSelectedClinic('all')}
            className={`p-3 text-left border rounded-lg transition-all ${
              selectedClinic === 'all'
                ? 'border-blue-500 bg-blue-100 text-blue-900'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span className="font-medium">全院</span>
            </div>
          </button>
          
          {Object.entries(clinicNames).map(([clinicId, clinicName]) => (
            <button
              key={clinicId}
              onClick={() => setSelectedClinic(clinicId)}
              className={`p-3 text-left border rounded-lg transition-all ${
                selectedClinic === clinicId
                  ? 'border-blue-500 bg-blue-100 text-blue-900'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4" />
                <span className="font-medium">{clinicName}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Clinic Data */}
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{currentData.name} データ</h3>
          <div className="text-sm text-gray-500">
            {formatNumber(currentData.totalCount)}件のデータ
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">総売上</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(currentData.totalRevenue)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">総件数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(currentData.totalCount)}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">平均単価</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(currentData.averageUnitPrice)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="mt-6">
          <h4 className="mb-3 font-semibold text-gray-900 text-md">詳細データ</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    日付
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    患者名
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    施術内容
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    金額
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    クリニック
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.dailyAccounts.slice(0, 10).map((record: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {new Date(record.recordDate).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {record.visitorName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {record.treatmentName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {formatCurrency(record.totalWithTax || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {record.clinicName || 'N/A'}
                    </td>
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
