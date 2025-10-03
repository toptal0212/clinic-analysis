'use client'

import { useState } from 'react'
import { X, Calendar, User, CreditCard, AlertCircle, CheckCircle } from 'lucide-react'
import { MedicalForceUpdatedBrandCourse } from '../lib/dataTypes'

interface ServiceSearchResultsProps {
  isOpen: boolean
  onClose: () => void
  results: MedicalForceUpdatedBrandCourse[]
  loading: boolean
  error: string | null
}

export default function ServiceSearchResults({ 
  isOpen, 
  onClose, 
  results, 
  loading, 
  error 
}: ServiceSearchResultsProps) {
  const [selectedResult, setSelectedResult] = useState<MedicalForceUpdatedBrandCourse | null>(null)

  if (!isOpen) return null

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '未設定'
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '未設定'
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (result: MedicalForceUpdatedBrandCourse) => {
    if (result.canceled_at) return 'text-red-600 bg-red-50'
    if (result.cooling_off_canceled_at) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const getStatusText = (result: MedicalForceUpdatedBrandCourse) => {
    if (result.canceled_at) return 'キャンセル済み'
    if (result.cooling_off_canceled_at) return 'クーリングオフキャンセル'
    return 'アクティブ'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">役務検索結果</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">検索中...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">指定した条件で役務が見つかりませんでした</p>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    検索結果: {results.length}件
                  </h3>
                  <div className="text-sm text-gray-500">
                    {new Date().toLocaleString('ja-JP')} に検索
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Results List */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-700">役務一覧</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.map((result, index) => (
                      <div
                        key={`${result.course_id}-${index}`}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedResult?.course_id === result.course_id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedResult(result)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900 truncate">
                            {result.course_name}
                          </h5>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(result)}`}>
                            {getStatusText(result)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>契約日: {formatDate(result.contracted_at)}</span>
                          </div>
                          <div className="flex items-center">
                            <CreditCard className="w-4 h-4 mr-2" />
                            <span>回数: {result.course_count}回</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Result Details */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-700">詳細情報</h4>
                  {selectedResult ? (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">コース名</label>
                          <p className="text-sm text-gray-900">{selectedResult.course_name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">コースID</label>
                          <p className="text-sm text-gray-900 font-mono">{selectedResult.course_id}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">クリニックID</label>
                          <p className="text-sm text-gray-900 font-mono">{selectedResult.clinic_id}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">来院者ID</label>
                          <p className="text-sm text-gray-900 font-mono">{selectedResult.visitor_id}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">操作ID</label>
                          <p className="text-sm text-gray-900 font-mono">{selectedResult.operation_id}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">回数</label>
                          <p className="text-sm text-gray-900">{selectedResult.course_count}回</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">契約日</label>
                          <p className="text-sm text-gray-900">{formatDate(selectedResult.contracted_at)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">有効期限</label>
                          <p className="text-sm text-gray-900">{formatDate(selectedResult.expire_at)}</p>
                        </div>
                      </div>

                      {selectedResult.canceled_at && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">キャンセル日</label>
                          <p className="text-sm text-gray-900">{formatDateTime(selectedResult.canceled_at)}</p>
                        </div>
                      )}

                      {selectedResult.cooling_off_day && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">クーリングオフ期間</label>
                            <p className="text-sm text-gray-900">{selectedResult.cooling_off_day}日</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">クーリングオフ期限</label>
                            <p className="text-sm text-gray-900">{formatDate(selectedResult.cooling_off_at)}</p>
                          </div>
                        </div>
                      )}

                      {selectedResult.cooling_off_canceled_at && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">クーリングオフキャンセル日</label>
                          <p className="text-sm text-gray-900">{formatDateTime(selectedResult.cooling_off_canceled_at)}</p>
                        </div>
                      )}

                      {selectedResult.canceled_memo && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">キャンセルメモ</label>
                          <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                            {selectedResult.canceled_memo}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                        <div>
                          <label className="text-sm font-medium text-gray-500">作成日時</label>
                          <p className="text-sm text-gray-900">{formatDateTime(selectedResult.created_at)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">更新日時</label>
                          <p className="text-sm text-gray-900">{formatDateTime(selectedResult.updated_at)}</p>
                        </div>
                      </div>

                      {selectedResult.deleted_at && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">削除日時</label>
                          <p className="text-sm text-gray-900">{formatDateTime(selectedResult.deleted_at)}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">詳細を表示する役務を選択してください</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
