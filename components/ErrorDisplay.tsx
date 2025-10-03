'use client'

import React, { useState } from 'react'
import { ErrorData } from '@/lib/dataTypes'
import { 
  AlertTriangle,
  X,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'

interface ErrorDisplayProps {
  errors: ErrorData[]
  onRefresh?: () => void
  onExport?: () => void
}

export default function ErrorDisplay({ errors, onRefresh, onExport }: ErrorDisplayProps) {
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set())
  const [filter, setFilter] = useState<'all' | 'error' | 'warning'>('all')

  const filteredErrors = errors.filter(error => 
    filter === 'all' || error.severity === filter
  )

  const toggleError = (index: number) => {
    const newExpanded = new Set(expandedErrors)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedErrors(newExpanded)
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-800'
      case 'warning':
        return 'text-yellow-800'
      default:
        return 'text-blue-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'MISSING_PATIENT_CODE':
        return '患者コード未入力'
      case 'MISSING_AGE':
        return '年齢未入力'
      case 'MISSING_REFERRAL_SOURCE':
        return '流入元未入力'
      case 'MISSING_APPOINTMENT_ROUTE':
        return '予約経路未入力'
      case 'MISSING_TREATMENT_CATEGORY':
        return '施術カテゴリー未入力'
      case 'MISSING_STAFF':
        return '担当者未入力'
      case 'INVALID_DATA':
        return '無効なデータ'
      case 'DUPLICATE_DATA':
        return '重複データ'
      default:
        return type
    }
  }

  const errorCount = errors.filter(e => e.severity === 'error').length
  const warningCount = errors.filter(e => e.severity === 'warning').length

  if (errors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center space-x-3 text-green-600">
          <CheckCircle className="h-6 w-6" />
          <span className="text-lg font-medium">データにエラーはありません</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* エラーサマリー */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">データ検証エラー</h3>
          </div>
          <div className="flex items-center space-x-3">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" />
                <span>再検証</span>
              </button>
            )}
            {onExport && (
              <button
                onClick={onExport}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                <span>エクスポート</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
            <div className="text-sm text-red-700">エラー</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
            <div className="text-sm text-yellow-700">警告</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{errors.length}</div>
            <div className="text-sm text-gray-700">合計</div>
          </div>
        </div>

        {/* フィルター */}
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">表示フィルター:</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'all' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              すべて ({errors.length})
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'error' 
                  ? 'bg-red-100 text-red-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              エラー ({errorCount})
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'warning' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              警告 ({warningCount})
            </button>
          </div>
        </div>
      </div>

      {/* エラー一覧 */}
      <div className="space-y-4">
        {filteredErrors.map((error, index) => {
          const isExpanded = expandedErrors.has(index)
          
          return (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getSeverityColor(error.severity)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getSeverityIcon(error.severity)}
                  <div>
                    <div className={`font-medium ${getSeverityTextColor(error.severity)}`}>
                      {getTypeLabel(error.type)}
                    </div>
                    <div className="text-sm text-gray-600">
                      行 {error.row} | {error.message}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleError(index)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">詳細データ:</h4>
                  <div className="bg-white rounded p-3 text-sm">
                    <pre className="whitespace-pre-wrap text-gray-800">
                      {JSON.stringify(error.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 修正ガイド */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">修正ガイド</h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-semibold text-red-900 mb-2">エラー（必須修正）</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• 患者コード、流入元、予約経路、施術カテゴリー、担当者は必須項目です</li>
              <li>• これらの項目が空欄の場合は、データを修正してから再インポートしてください</li>
              <li>• 修正後は「再検証」ボタンでエラーが解消されたか確認してください</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">警告（推奨修正）</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 年齢が0のデータは予約キャンセル等の可能性があります</li>
              <li>• これらのデータは自動的に集計対象から除外されます</li>
              <li>• 必要に応じてデータを修正してください</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">データ品質向上のコツ</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 定期的なデータ検証を実施してください</li>
              <li>• 入力時のバリデーション機能を活用してください</li>
              <li>• エラーデータは「エクスポート」機能でCSVファイルとして出力できます</li>
              <li>• 修正後は必ず再検証を実行してください</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
