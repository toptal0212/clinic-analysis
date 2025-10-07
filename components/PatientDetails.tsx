'use client'

import React, { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { CalculationEngine } from '@/lib/calculationEngine'
import { Patient, Accounting, TreatmentHierarchy } from '@/lib/dataTypes'
import { 
  Search,
  Filter,
  Edit3,
  Save,
  X,
  User,
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Eye,
  EyeOff
} from 'lucide-react'

interface PatientWithDetails extends Patient {
  accounting: Accounting[]
  totalAmount: number
  advancePayment: number
  remainingPayment: number
  treatmentHierarchy: TreatmentHierarchy
  isNewPatient: boolean
  firstVisitDate?: Date
  repeatCount: number
  lastVisitDate?: Date
}

export default function PatientDetails() {
  const { state, dispatch } = useDashboard()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilters, setSelectedFilters] = useState({
    patientType: 'all',
    treatmentCategory: 'all',
    staff: 'all',
    referralSource: 'all',
    dateRange: 'all'
  })
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [editForm, setEditForm] = useState<Partial<Patient>>({})
  const [showDetails, setShowDetails] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const calculationEngine = new CalculationEngine()

  const patientsWithDetails = useMemo(() => {
    if (!state.apiConnected || !state.data.patients) {
      return []
    }

    // Use the processed patients data instead of raw dailyAccounts
    const patientsData = state.data.patients
    
    if (!patientsData || !Array.isArray(patientsData) || patientsData.length === 0) {
      return []
    }

    return patientsData.map((patient: any, index: number) => {
      // Since the API data is limited, we'll use basic categorization
      const treatmentHierarchy = calculationEngine.categorizeTreatment(
        patient.treatmentCategory || 'その他',
        patient.treatmentName || 'その他'
      )

      // Debug logging
      console.log(`Debug - Patient ${index}:`, {
        id: patient.id,
        name: patient.name,
        staff: patient.staff,
        treatmentCategory: patient.treatmentCategory,
        treatmentName: patient.treatmentName
      })

      return {
        id: patient.id,
        name: patient.name,
        age: patient.age || 0,
        gender: patient.gender || 'N/A',
        visitDate: patient.visitDate ? new Date(patient.visitDate) : new Date(),
        treatmentDate: patient.treatmentDate ? new Date(patient.treatmentDate) : new Date(),
        treatmentName: patient.treatmentName || '未設定',
        treatmentCategory: patient.treatmentCategory || '未設定',
        staff: patient.staff || '担当者不明',
        referralSource: patient.referralSource || '未設定',
        appointmentRoute: patient.appointmentRoute || '未設定',
        roomName: patient.roomName || '未設定',
        appointmentId: patient.appointmentId || '',
        isCancelled: patient.isCancelled || false,
        patientType: patient.patientType || '既存',
        totalAmount: patient.totalAmount || 0,
        advancePayment: 0,
        remainingPayment: 0,
        treatmentHierarchy,
        isNewPatient: patient.isNewPatient || false,
        firstVisitDate: patient.firstVisitDate ? new Date(patient.firstVisitDate) : undefined,
        repeatCount: 0,
        lastVisitDate: patient.visitDate ? new Date(patient.visitDate) : undefined,
        accounting: [patient]
      } as PatientWithDetails
    })
  }, [state.data.patients, state.apiConnected])


  const filteredPatients = useMemo(() => {
    let filtered = patientsWithDetails

    // 検索フィルター
    if (searchTerm) {
      filtered = filtered.filter(patient => 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.treatmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.treatmentCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.staff.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 患者タイプフィルター
    if (selectedFilters.patientType !== 'all') {
      filtered = filtered.filter(patient => {
        const patientType = calculationEngine.determinePatientType(patient, state.data.accounting)
        return patientType === selectedFilters.patientType
      })
    }

    // 施術カテゴリーフィルター
    if (selectedFilters.treatmentCategory !== 'all') {
      filtered = filtered.filter(patient => 
        patient.treatmentHierarchy.main === selectedFilters.treatmentCategory
      )
    }

    // 担当者フィルター
    if (selectedFilters.staff !== 'all') {
      filtered = filtered.filter(patient => 
        patient.staff === selectedFilters.staff
      )
    }

    // 流入元フィルター
    if (selectedFilters.referralSource !== 'all') {
      filtered = filtered.filter(patient => 
        patient.referralSource === selectedFilters.referralSource
      )
    }

    return filtered
  }, [patientsWithDetails, searchTerm, selectedFilters, state.data.accounting])

  // ページネーション計算
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPatients = filteredPatients.slice(startIndex, endIndex)

  // ページ変更時に詳細表示をリセット
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setShowDetails(new Set())
  }

  const uniqueValues = useMemo(() => {
    return {
      staff: Array.from(new Set(patientsWithDetails.map(p => p.staff))),
      referralSources: Array.from(new Set(patientsWithDetails.map(p => p.referralSource))),
      treatmentCategories: Array.from(new Set(patientsWithDetails.map(p => p.treatmentHierarchy.main)))
    }
  }, [patientsWithDetails])

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient)
    setEditForm({
      name: patient.name,
      staff: patient.staff,
      referralSource: patient.referralSource,
      appointmentRoute: patient.appointmentRoute,
      treatmentName: patient.treatmentName,
      treatmentCategory: patient.treatmentCategory,
      roomName: patient.roomName,
      appointmentId: patient.appointmentId
    })
  }

  const handleSave = () => {
    if (!editingPatient) return

    // 患者データを更新
    const updatedPatients = state.data.patients.map(patient => 
      patient.id === editingPatient.id 
        ? { ...patient, ...editForm }
        : patient
    )

    dispatch({
      type: 'SET_DATA',
      payload: { patients: updatedPatients }
    })

    setEditingPatient(null)
    setEditForm({})
  }

  const handleCancel = () => {
    setEditingPatient(null)
    setEditForm({})
  }

  const toggleDetails = (patientId: string) => {
    const newShowDetails = new Set(showDetails)
    if (newShowDetails.has(patientId)) {
      newShowDetails.delete(patientId)
    } else {
      newShowDetails.add(patientId)
    }
    setShowDetails(newShowDetails)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    }).format(date)
  }

  const formatDateTime = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A'
    
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) return 'N/A'
    
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj)
  }

  // Show loading state if no data is available
  if (!state.apiConnected) {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
              <p className="text-lg font-medium text-gray-900">APIに接続中...</p>
              <p className="text-sm text-gray-500">データを読み込んでいます</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 検索・フィルター */}
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* 検索 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="患者名、患者コード、予約内容、処置内容、担当者で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* フィルター */}
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedFilters.patientType}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, patientType: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">患者区分</option>
              <option value="新規">新規</option>
              <option value="既存">既存</option>
              <option value="その他">その他</option>
            </select>

            <select
              value={selectedFilters.treatmentCategory}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, treatmentCategory: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">施術カテゴリー</option>
              <option value="美容">美容</option>
              <option value="その他">その他</option>
            </select>

            <select
              value={selectedFilters.staff}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, staff: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">担当者</option>
              {uniqueValues.staff.map(staff => (
                <option key={staff} value={staff}>{staff}</option>
              ))}
            </select>

            <select
              value={selectedFilters.referralSource}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, referralSource: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">流入元</option>
              {uniqueValues.referralSources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 患者一覧 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            来院者情報 ({filteredPatients.length}件)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-48 px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  患者情報
                </th>
                <th className="w-32 px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  来院日
                </th>
                <th className="w-32 px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  予約内容
                </th>
                <th className="w-32 px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  処置内容
                </th>
                <th className="w-24 px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  担当者
                </th>
                <th className="w-24 px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  流入元
                </th>
                <th className="w-24 px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  金額
                </th>
                <th className="w-20 px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <User className="w-12 h-12 mb-4 text-gray-300" />
                      <p className="text-lg font-medium">データが見つかりません</p>
                      <p className="text-sm">患者データを読み込み中です...</p>
                      <p className="mt-2 text-xs">
                        API接続: {state.apiConnected ? '✅' : '❌'} | 
                        患者データ: {state.data.patients?.length || 0}件 | 
                        日計データ: {state.data.dailyAccounts?.length || 0}件
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((patient, index) => {
                const isExpanded = showDetails.has(patient.id)
                const isEditing = editingPatient?.id === patient.id

                return (
                  <React.Fragment key={`${patient.id}-${index}`}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-5 h-5 mr-3 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editForm.name || ''}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                  className="px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                              ) : (
                                patient.name
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {patient.age}歳 | {patient.gender}
                            </div>
                            <div className="text-xs text-gray-400">
                              {patient.isNewPatient ? '新規' : '既存'} | 
                              リピート: {patient.repeatCount}回
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {formatDate(patient.visitDate)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDateTime(patient.treatmentDate)}
                        </div>
                      </td>

                      <td className="px-3 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.treatmentCategory || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, treatmentCategory: e.target.value }))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            placeholder="予約内容"
                          />
                        ) : (
                          <div className="text-sm text-gray-900">
                            {patient.treatmentCategory}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {patient.treatmentHierarchy.main} → {patient.treatmentHierarchy.sub}
                        </div>
                      </td>

                      <td className="px-3 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.treatmentName || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, treatmentName: e.target.value }))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            placeholder="処置内容"
                          />
                        ) : (
                          <div className="text-sm text-gray-900">
                            {patient.treatmentName}
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.roomName || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, roomName: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                              placeholder="部屋名"
                            />
                          ) : (
                            patient.roomName
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <div>
                            <input
                              type="text"
                              value={editForm.staff || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, staff: e.target.value }))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              placeholder="担当者名"
                            />
                            <select
                              value={editForm.staff || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, staff: e.target.value }))}
                              className="w-full px-2 py-1 mt-1 text-xs border border-gray-300 rounded"
                            >
                              <option value="">選択してください</option>
                              {uniqueValues.staff.map(staff => (
                                <option key={staff} value={staff}>{staff}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-900">{patient.staff}</span>
                        )}
                      </td>

                      <td className="px-3 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <div>
                            <input
                              type="text"
                              value={editForm.referralSource || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, referralSource: e.target.value }))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              placeholder="流入元"
                            />
                            <input
                              type="text"
                              value={editForm.appointmentRoute || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, appointmentRoute: e.target.value }))}
                              className="w-full px-2 py-1 mt-1 text-xs border border-gray-300 rounded"
                              placeholder="予約ルート"
                            />
                            <select
                              value={editForm.referralSource || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, referralSource: e.target.value }))}
                              className="w-full px-2 py-1 mt-1 text-xs border border-gray-300 rounded"
                            >
                              <option value="">選択してください</option>
                              {uniqueValues.referralSources.map(source => (
                                <option key={source} value={source}>{source}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm text-gray-900">{patient.referralSource}</div>
                            <div className="text-xs text-gray-500">{patient.appointmentRoute}</div>
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(patient.totalAmount)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={handleSave}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancel}
                                className="text-red-600 hover:text-red-900"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(patient)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleDetails(patient.id)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* 詳細表示 */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* 患者詳細情報 */}
                            <div>
                              <h4 className="mb-3 font-semibold text-gray-900">患者詳細情報</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">患者コード:</span>
                                  <span className="font-medium">{patient.id}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">初回来院日:</span>
                                  <span className="font-medium">
                                    {patient.firstVisitDate ? formatDate(patient.firstVisitDate) : '-'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">最終来院日:</span>
                                  <span className="font-medium">
                                    {patient.lastVisitDate ? formatDate(patient.lastVisitDate) : '-'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">リピート回数:</span>
                                  <span className="font-medium">{patient.repeatCount}回</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">キャンセル:</span>
                                  <span className={`font-medium ${patient.isCancelled ? 'text-red-600' : 'text-green-600'}`}>
                                    {patient.isCancelled ? 'あり' : 'なし'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* 会計詳細 */}
                            <div>
                              <h4 className="mb-3 font-semibold text-gray-900">会計詳細</h4>
                              <div className="space-y-2">
                                {patient.accounting.map((account, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-white border rounded">
                                    <div>
                                      <div className="text-sm font-medium">{account.treatmentType}</div>
                                      <div className="text-xs text-gray-500">
                                        {formatDate(account.paymentDate)}
                                        {account.isAdvancePayment && ' (前受金)'}
                                      </div>
                                    </div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {formatCurrency(account.amount)}
                                    </div>
                                  </div>
                                ))}
                                <div className="pt-2 mt-2 border-t">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold">合計金額:</span>
                                    <span className="text-lg font-bold">
                                      {formatCurrency(patient.totalAmount)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })
              )}
            </tbody>
          </table>
        </div>

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {startIndex + 1} - {Math.min(endIndex, filteredPatients.length)} 件目を表示
                （全 {filteredPatients.length} 件中）
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  前へ
                </button>
                
                <div className="flex items-center space-x-1">
                  {(() => {
                    const pages = []
                    const maxVisiblePages = 7
                    
                    if (totalPages <= maxVisiblePages) {
                      // Show all pages if total is small
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => handlePageChange(i)}
                            className={`px-3 py-1 text-sm border rounded-md ${
                              currentPage === i
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {i}
                          </button>
                        )
                      }
                    } else {
                      // Show first page
                      pages.push(
                        <button
                          key={1}
                          onClick={() => handlePageChange(1)}
                          className={`px-3 py-1 text-sm border rounded-md ${
                            currentPage === 1
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          1
                        </button>
                      )
                      
                      // Show ellipsis if current page is far from start
                      if (currentPage > 4) {
                        pages.push(
                          <span key="start-ellipsis" className="px-2 text-gray-500">
                            ...
                          </span>
                        )
                      }
                      
                      // Show pages around current page
                      const start = Math.max(2, currentPage - 1)
                      const end = Math.min(totalPages - 1, currentPage + 1)
                      
                      for (let i = start; i <= end; i++) {
                        if (i !== 1 && i !== totalPages) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => handlePageChange(i)}
                              className={`px-3 py-1 text-sm border rounded-md ${
                                currentPage === i
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {i}
                            </button>
                          )
                        }
                      }
                      
                      // Show ellipsis if current page is far from end
                      if (currentPage < totalPages - 3) {
                        pages.push(
                          <span key="end-ellipsis" className="px-2 text-gray-500">
                            ...
                          </span>
                        )
                      }
                      
                      // Show last page
                      if (totalPages > 1) {
                        pages.push(
                          <button
                            key={totalPages}
                            onClick={() => handlePageChange(totalPages)}
                            className={`px-3 py-1 text-sm border rounded-md ${
                              currentPage === totalPages
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {totalPages}
                          </button>
                        )
                      }
                    }
                    
                    return pages
                  })()}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次へ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
