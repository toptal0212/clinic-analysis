'use client'

import React, { useState, useCallback } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, Edit3, Save, X, Filter, Eye } from 'lucide-react'
import { Patient, DailyAccountValue, ErrorData } from '@/lib/dataTypes'

interface PatientVisitCSVImportProps {
  onDataImported: (data: Patient[], errors: ErrorData[]) => void
}

interface ParsedPatientRow {
  rowNumber: number
  data: Partial<Patient>
  errors: ErrorData[]
  isEdited: boolean
  category: 'surgery' | 'dermatology' | 'other' | 'consultation' | 'unknown'
}

interface CategoryMapping {
  surgery: string[]
  dermatology: string[]
  consultation: string[]
}

export default function PatientVisitCSVImport({ onDataImported }: PatientVisitCSVImportProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedPatientRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showEditMode, setShowEditMode] = useState(false)
  const [showCategoryMapping, setShowCategoryMapping] = useState(false)
  const [categoryMapping, setCategoryMapping] = useState<CategoryMapping>({
    surgery: ['タトゥー除去カウンセリング'],
    dermatology: ['医療脱毛カウンセリング'],
    consultation: ['診察予約1', '診察予約2']
  })

  // CSV field mapping for patient visit data
  const fieldMapping = {
    '予約ID': 'appointmentId',
    '氏名': 'name',
    'キャンセル有無': 'isCancelled',
    '施術カテゴリー': 'treatmentCategory',
    '施術名': 'treatmentName',
    '部屋名': 'roomName',
    '年齢': 'age',
    '患者コード': 'patientCode',
    'カルテNo': 'karteNumber',
    '初診再診': 'patientType',
    '流入元': 'referralSource',
    '来院日': 'visitDate',
    '施術日': 'treatmentDate'
  }

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setCsvFile(file)
      parseCSV(file)
    } else {
      alert('CSVファイルを選択してください')
    }
  }, [])

  const parseCSV = async (file: File) => {
    setIsProcessing(true)
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        throw new Error('CSVファイルにデータがありません')
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      console.log('CSV Headers:', headers)

      const parsedRows: ParsedPatientRow[] = []
      
      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        const rowData: Partial<Patient> = {}
        const errors: ErrorData[] = []

        // Map CSV columns to data fields
        headers.forEach((header, index) => {
          const mappedField = fieldMapping[header as keyof typeof fieldMapping]
          if (mappedField && values[index]) {
            const value = values[index]
            
            // Type conversion and validation
            switch (mappedField) {
              case 'age':
                const age = parseInt(value)
                if (isNaN(age) || age < 0 || age > 120) {
                  errors.push({
                    type: 'MISSING_AGE',
                    message: '年齢が無効です',
                    row: i + 1,
                    data: value,
                    severity: 'error'
                  })
                } else {
                  rowData.age = age
                }
                break
              case 'isCancelled':
                rowData.isCancelled = value.toLowerCase() === 'true' || value === '1' || value === 'キャンセル'
                break
              case 'visitDate':
              case 'treatmentDate':
                const date = new Date(value)
                if (isNaN(date.getTime())) {
                  errors.push({
                    type: 'INVALID_DATA',
                    message: '日付が無効です',
                    row: i + 1,
                    data: value,
                    severity: 'error'
                  })
                } else {
                  rowData[mappedField] = date
                }
                break
              default:
                (rowData as any)[mappedField] = value
            }
          }
        })

        // Business rule validations
        if (!rowData.name) {
          errors.push({
            type: 'MISSING_PATIENT_CODE',
            message: '患者名が必須です',
            row: i + 1,
            data: rowData,
            severity: 'error'
          })
        }

        if (!(rowData as any).patientCode && !(rowData as any).karteNumber) {
          errors.push({
            type: 'MISSING_PATIENT_CODE',
            message: '患者コードまたはカルテNoが必須です',
            row: i + 1,
            data: rowData,
            severity: 'error'
          })
        }

        if (!rowData.patientType) {
          errors.push({
            type: 'MISSING_PATIENT_CODE',
            message: '初診再診の区分が必須です',
            row: i + 1,
            data: rowData,
            severity: 'error'
          })
        }

        if (!rowData.referralSource) {
          errors.push({
            type: 'MISSING_REFERRAL_SOURCE',
            message: '流入元が必須です',
            row: i + 1,
            data: rowData,
            severity: 'error'
          })
        }

        // Determine category based on business rules
        let category: ParsedPatientRow['category'] = 'unknown'
        
        if (rowData.age === 0) {
          // Remove records with age 0 (cancelled appointments, meetings, etc.)
          continue
        }

        if (categoryMapping.consultation.includes(rowData.roomName || '')) {
          category = 'consultation'
        } else if (categoryMapping.surgery.includes(rowData.treatmentCategory || '')) {
          category = 'surgery'
        } else if (categoryMapping.dermatology.includes(rowData.treatmentCategory || '')) {
          category = 'dermatology'
        } else {
          category = 'other'
        }

        parsedRows.push({
          rowNumber: i + 1,
          data: rowData,
          errors,
          isEdited: false,
          category
        })
      }

      setParsedData(parsedRows)
    } catch (error) {
      console.error('CSV parsing error:', error)
      alert('CSVファイルの解析に失敗しました')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEditRow = (rowNumber: number, field: string, value: string) => {
    setParsedData(prev => prev.map(row => 
      row.rowNumber === rowNumber 
        ? { 
            ...row, 
            data: { ...row.data, [field]: value },
            isEdited: true 
          }
        : row
    ))
  }

  const handleSaveEdits = () => {
    const validData = parsedData
      .filter(row => row.errors.filter(e => e.severity === 'error').length === 0)
      .map(row => ({
        id: `patient_${row.rowNumber}`,
        name: row.data.name || '',
        age: row.data.age || 0,
        gender: 'female' as const, // Default value
        appointmentId: row.data.appointmentId || '',
        treatmentCategory: row.data.treatmentCategory || '',
        treatmentName: row.data.treatmentName || '',
        roomName: row.data.roomName || '',
        isCancelled: row.data.isCancelled || false,
        referralSource: row.data.referralSource || '',
        appointmentRoute: row.data.appointmentRoute || '',
        staff: '', // Will be filled from other data
        visitDate: row.data.visitDate || new Date(),
        treatmentDate: row.data.treatmentDate || new Date(),
        isNewPatient: row.data.patientType === '新規',
        patientType: row.data.patientType as '新規' | '既存' | 'その他' || 'その他',
        firstVisitDate: row.data.patientType === '新規' ? row.data.visitDate : undefined
      })) as Patient[]

    const allErrors = parsedData.flatMap(row => row.errors)
    
    onDataImported(validData, allErrors)
    setParsedData([])
    setCsvFile(null)
    setShowEditMode(false)
  }

  const updateCategoryMapping = (category: keyof CategoryMapping, value: string, add: boolean) => {
    setCategoryMapping(prev => ({
      ...prev,
      [category]: add 
        ? [...prev[category], value]
        : prev[category].filter(item => item !== value)
    }))
  }

  const getCategoryColor = (category: ParsedPatientRow['category']) => {
    switch (category) {
      case 'surgery': return 'bg-red-100 text-red-800'
      case 'dermatology': return 'bg-blue-100 text-blue-800'
      case 'consultation': return 'bg-yellow-100 text-yellow-800'
      case 'other': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryLabel = (category: ParsedPatientRow['category']) => {
    switch (category) {
      case 'surgery': return '外科'
      case 'dermatology': return '皮膚科'
      case 'consultation': return '相談'
      case 'other': return 'その他'
      default: return '未分類'
    }
  }

  const totalRows = parsedData.length
  const errorRows = parsedData.filter(row => row.errors.some(e => e.severity === 'error')).length
  const warningRows = parsedData.filter(row => row.errors.some(e => e.severity === 'warning')).length

  // Category statistics
  const categoryStats = parsedData.reduce((acc, row) => {
    acc[row.category] = (acc[row.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm">
      <div className="mb-6">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">来院者情報CSVインポート</h3>
        <p className="text-sm text-gray-600">
          予約ID・氏名・キャンセル有無・施術カテゴリー・施術名・部屋名を含むCSVファイルをアップロードします
        </p>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          CSVファイルを選択
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {csvFile && (
            <div className="flex items-center text-sm text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              {csvFile.name}
            </div>
          )}
        </div>
      </div>

      {/* Category Mapping */}
      <div className="p-4 mb-6 rounded-lg bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">カテゴリー分類設定</h4>
          <button
            onClick={() => setShowCategoryMapping(!showCategoryMapping)}
            className="flex items-center px-3 py-2 text-sm text-white bg-gray-600 rounded-md hover:bg-gray-700"
          >
            <Filter className="w-4 h-4 mr-1" />
            {showCategoryMapping ? '設定を閉じる' : '設定を開く'}
          </button>
        </div>

        {showCategoryMapping && (
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">外科</label>
              <div className="flex flex-wrap gap-2">
                {categoryMapping.surgery.map((item, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 text-xs text-red-800 bg-red-100 rounded">
                    {item}
                    <button
                      onClick={() => updateCategoryMapping('surgery', item, false)}
                      className="ml-1 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="新しい項目を追加"
                  className="px-2 py-1 text-sm border rounded"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = e.currentTarget.value.trim()
                      if (value) {
                        updateCategoryMapping('surgery', value, true)
                        e.currentTarget.value = ''
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">皮膚科</label>
              <div className="flex flex-wrap gap-2">
                {categoryMapping.dermatology.map((item, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded">
                    {item}
                    <button
                      onClick={() => updateCategoryMapping('dermatology', item, false)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="新しい項目を追加"
                  className="px-2 py-1 text-sm border rounded"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = e.currentTarget.value.trim()
                      if (value) {
                        updateCategoryMapping('dermatology', value, true)
                        e.currentTarget.value = ''
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">相談</label>
              <div className="flex flex-wrap gap-2">
                {categoryMapping.consultation.map((item, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 text-xs text-yellow-800 bg-yellow-100 rounded">
                    {item}
                    <button
                      onClick={() => updateCategoryMapping('consultation', item, false)}
                      className="ml-1 text-yellow-600 hover:text-yellow-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="新しい項目を追加"
                  className="px-2 py-1 text-sm border rounded"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = e.currentTarget.value.trim()
                      if (value) {
                        updateCategoryMapping('consultation', value, true)
                        e.currentTarget.value = ''
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <div className="p-4 mb-6 rounded-lg bg-blue-50">
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2 border-b-2 border-blue-600 rounded-full animate-spin"></div>
            <span className="text-sm text-blue-700">CSVファイルを解析中...</span>
          </div>
        </div>
      )}

      {/* Import Summary */}
      {parsedData.length > 0 && (
        <div className="p-4 mb-6 rounded-lg bg-gray-50">
          <h4 className="mb-2 font-medium text-gray-900">インポート概要</h4>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <span className="text-gray-600">総行数:</span>
              <span className="ml-2 font-medium">{totalRows}</span>
            </div>
            <div>
              <span className="text-gray-600">エラー行:</span>
              <span className="ml-2 font-medium text-red-600">{errorRows}</span>
            </div>
            <div>
              <span className="text-gray-600">警告行:</span>
              <span className="ml-2 font-medium text-yellow-600">{warningRows}</span>
            </div>
            <div>
              <span className="text-gray-600">正常行:</span>
              <span className="ml-2 font-medium text-green-600">{totalRows - errorRows}</span>
            </div>
          </div>

          {/* Category Statistics */}
          <div className="mt-4">
            <h5 className="mb-2 font-medium text-gray-900">カテゴリー別統計</h5>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryStats).map(([category, count]) => (
                <span key={category} className={`px-2 py-1 text-xs rounded ${getCategoryColor(category as ParsedPatientRow['category'])}`}>
                  {getCategoryLabel(category as ParsedPatientRow['category'])}: {count}件
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Data Preview and Edit */}
      {parsedData.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">データプレビュー</h4>
            <button
              onClick={() => setShowEditMode(!showEditMode)}
              className="flex items-center px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <Edit3 className="w-4 h-4 mr-1" />
              {showEditMode ? 'プレビューモード' : '編集モード'}
            </button>
          </div>

          <div className="overflow-x-auto border rounded-lg max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">行</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">患者名</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">年齢</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">施術カテゴリー</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">部屋名</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">カテゴリー</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">状態</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parsedData.slice(0, 50).map((row) => (
                  <tr key={row.rowNumber} className={row.errors.some(e => e.severity === 'error') ? 'bg-red-50' : ''}>
                    <td className="px-3 py-2 text-sm text-gray-900">{row.rowNumber}</td>
                    <td className="px-3 py-2 text-sm">
                      {showEditMode ? (
                        <input
                          type="text"
                          value={row.data.name || ''}
                          onChange={(e) => handleEditRow(row.rowNumber, 'name', e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      ) : (
                        <span>{row.data.name || '-'}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {showEditMode ? (
                        <input
                          type="number"
                          value={row.data.age || ''}
                          onChange={(e) => handleEditRow(row.rowNumber, 'age', e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      ) : (
                        <span>{row.data.age || '-'}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <span className="text-xs">{row.data.treatmentCategory || '-'}</span>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <span className="text-xs">{row.data.roomName || '-'}</span>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <span className={`inline-flex items-center px-2 py-1 text-xs rounded ${getCategoryColor(row.category)}`}>
                        {getCategoryLabel(row.category)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex items-center space-x-1">
                        {row.errors.some(e => e.severity === 'error') && (
                          <div title="エラー">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          </div>
                        )}
                        {row.errors.some(e => e.severity === 'warning') && (
                          <div title="警告">
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                          </div>
                        )}
                        {row.isEdited && (
                          <div title="編集済み">
                            <Edit3 className="w-4 h-4 text-blue-500" />
                          </div>
                        )}
                        {row.errors.length === 0 && (
                          <div title="正常">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.length > 50 && (
              <div className="p-3 text-sm text-center text-gray-500 bg-gray-50">
                最初の50行を表示中（全{parsedData.length}行）
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {parsedData.length > 0 && (
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={() => {
              setParsedData([])
              setCsvFile(null)
              setShowEditMode(false)
            }}
            className="flex items-center px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            <X className="w-4 h-4 mr-1" />
            キャンセル
          </button>
          <button
            onClick={handleSaveEdits}
            disabled={errorRows > 0}
            className="flex items-center px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-1" />
            データをインポート
          </button>
        </div>
      )}

      {/* Error Details */}
      {parsedData.some(row => row.errors.length > 0) && (
        <div className="p-4 mt-6 rounded-lg bg-red-50">
          <h4 className="mb-2 font-medium text-red-900">エラー詳細</h4>
          <div className="space-y-2 overflow-y-auto max-h-40">
            {parsedData.flatMap(row => 
              row.errors.map(error => (
                <div key={`${row.rowNumber}-${error.type}`} className="text-sm text-red-700">
                  <span className="font-medium">行 {error.row}:</span> {error.message}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
