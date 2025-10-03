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
  const calculationEngine = new CalculationEngine()

  const patientsWithDetails = useMemo(() => {
    if (state.data.patients.length === 0) return []

    return state.data.patients.map(patient => {
      const patientAccounting = state.data.accounting.filter(account => 
        account.patientId === patient.id
      )

      const treatmentHierarchy = calculationEngine.categorizeTreatment(
        patient.treatmentCategory,
        patient.treatmentName
      )

      const isNewPatient = calculationEngine.determinePatientType(patient, state.data.accounting) === '新規'

      // 初回来院日を計算
      const allVisits = state.data.patients.filter(p => p.id === patient.id)
        .sort((a, b) => a.visitDate.getTime() - b.visitDate.getTime())
      const firstVisitDate = allVisits.length > 0 ? allVisits[0].visitDate : undefined

      // リピート回数を計算
      const repeatCount = allVisits.length - 1

      // 最終来院日を計算
      const lastVisitDate = allVisits.length > 0 ? allVisits[allVisits.length - 1].visitDate : undefined

      return {
        ...patient,
        accounting: patientAccounting,
        totalAmount: calculationEngine.calculateTotalAmount(patient.id, state.data.accounting),
        advancePayment: calculationEngine.calculateAdvancePayment(patient.id, state.data.accounting),
        remainingPayment: calculationEngine.calculateRemainingPayment(patient.id, state.data.accounting),
        treatmentHierarchy,
        isNewPatient,
        firstVisitDate,
        repeatCount,
        lastVisitDate
      } as PatientWithDetails
    })
  }, [state.data.patients, state.data.accounting])

  const filteredPatients = useMemo(() => {
    let filtered = patientsWithDetails

    // 検索フィルター
    if (searchTerm) {
      filtered = filtered.filter(patient => 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.treatmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const uniqueValues = useMemo(() => {
    return {
      staff: [...new Set(patientsWithDetails.map(p => p.staff))],
      referralSources: [...new Set(patientsWithDetails.map(p => p.referralSource))],
      treatmentCategories: [...new Set(patientsWithDetails.map(p => p.treatmentHierarchy.main))]
    }
  }, [patientsWithDetails])

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient)
    setEditForm({
      name: patient.name,
      staff: patient.staff,
      referralSource: patient.referralSource,
      appointmentRoute: patient.appointmentRoute
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

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className="space-y-6">
      {/* 検索・フィルター */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 検索 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="患者名、患者コード、施術内容、担当者で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* フィルター */}
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedFilters.patientType}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, patientType: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">患者区分</option>
              <option value="新規">新規</option>
              <option value="既存">既存</option>
              <option value="その他">その他</option>
            </select>

            <select
              value={selectedFilters.treatmentCategory}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, treatmentCategory: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">施術カテゴリー</option>
              <option value="美容">美容</option>
              <option value="その他">その他</option>
            </select>

            <select
              value={selectedFilters.staff}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, staff: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">担当者</option>
              {uniqueValues.staff.map(staff => (
                <option key={staff} value={staff}>{staff}</option>
              ))}
            </select>

            <select
              value={selectedFilters.referralSource}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, referralSource: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  患者情報
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  来院日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  施術内容
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  担当者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  流入元
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map((patient) => {
                const isExpanded = showDetails.has(patient.id)
                const isEditing = editingPatient?.id === patient.id

                return (
                  <React.Fragment key={patient.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editForm.name || ''}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                              ) : (
                                patient.name
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {patient.id} | {patient.age}歳 | {patient.gender}
                            </div>
                            <div className="text-xs text-gray-400">
                              {patient.isNewPatient ? '新規' : '既存'} | 
                              リピート: {patient.repeatCount}回
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          {formatDate(patient.visitDate)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDateTime(patient.treatmentDate)}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {patient.treatmentName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {patient.treatmentHierarchy.main} → {patient.treatmentHierarchy.sub}
                        </div>
                        <div className="text-xs text-gray-400">
                          {patient.roomName}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={editForm.staff || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, staff: e.target.value }))}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          >
                            {uniqueValues.staff.map(staff => (
                              <option key={staff} value={staff}>{staff}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm text-gray-900">{patient.staff}</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={editForm.referralSource || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, referralSource: e.target.value }))}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          >
                            {uniqueValues.referralSources.map(source => (
                              <option key={source} value={source}>{source}</option>
                            ))}
                          </select>
                        ) : (
                          <div>
                            <div className="text-sm text-gray-900">{patient.referralSource}</div>
                            <div className="text-xs text-gray-500">{patient.appointmentRoute}</div>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(patient.totalAmount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              予約金: {formatCurrency(patient.advancePayment)}
                            </div>
                            <div className="text-xs text-gray-500">
                              残金: {formatCurrency(patient.remainingPayment)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={handleSave}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleCancel}
                                className="text-red-600 hover:text-red-900"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(patient)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => toggleDetails(patient.id)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* 詳細表示 */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* 患者詳細情報 */}
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">患者詳細情報</h4>
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
                              <h4 className="font-semibold text-gray-900 mb-3">会計詳細</h4>
                              <div className="space-y-2">
                                {patient.accounting.map((account, index) => (
                                  <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
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
                                <div className="border-t pt-2 mt-2">
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold">合計金額:</span>
                                    <span className="font-bold text-lg">
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
