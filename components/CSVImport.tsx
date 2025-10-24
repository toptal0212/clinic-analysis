'use client'

import React, { useState, useCallback } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, Edit3, Save, X } from 'lucide-react'
import { Patient, DailyAccountValue, ErrorData } from '@/lib/dataTypes'

interface CSVImportProps {
  onDataImported: (data: DailyAccountValue[], errors: ErrorData[]) => void
}

interface ParsedRow {
  rowNumber: number
  data: Partial<DailyAccountValue>
  errors: ErrorData[]
  isEdited: boolean
}

export default function CSVImport({ onDataImported }: CSVImportProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showEditMode, setShowEditMode] = useState(false)

  // CSV field mapping for MF data
  const fieldMapping = {
    '担当者': 'mainStaffName',
    '院': 'clinicName',
    '来院日': 'visitDate',
    '施術日': 'treatmentDate', 
    '名前': 'visitorName',
    '年齢': 'visitorAge',
    '予約内容': 'appointmentContent',
    '流入元': 'visitorInflowSourceName',
    '予約経路': 'reservationInflowPathLabel',
    '処置内容': 'treatmentContent',
    '前受金入金日': 'advancePaymentDate',
    '合計': 'totalWithTax',
    'U/C': 'patientType'
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

      const parsedRows: ParsedRow[] = []
      
      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        const rowData: Partial<DailyAccountValue> = {}
        const errors: ErrorData[] = []

        // Map CSV columns to data fields
        headers.forEach((header, index) => {
          const mappedField = fieldMapping[header as keyof typeof fieldMapping]
          if (mappedField && values[index]) {
            const value = values[index]
            
            // Type conversion and validation
            switch (mappedField) {
              case 'visitorAge':
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
                  rowData.visitorAge = age
                }
                break
              case 'totalWithTax':
                const amount = parseFloat(value.replace(/[^\d.-]/g, ''))
                if (isNaN(amount)) {
                  errors.push({
                    type: 'INVALID_DATA',
                    message: '金額が無効です',
                    row: i + 1,
                    data: value,
                    severity: 'error'
                  })
                } else {
                  rowData.totalWithTax = amount
                }
                break
              case 'visitDate':
              case 'treatmentDate':
              case 'advancePaymentDate':
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
                  (rowData as any)[mappedField] = date.toISOString()
                }
                break
              default:
                (rowData as any)[mappedField] = value
            }
          }
        })

        // Validate required fields
        if (!rowData.visitorName) {
          errors.push({
            type: 'MISSING_PATIENT_CODE',
            message: '患者名が必須です',
            row: i + 1,
            data: rowData,
            severity: 'error'
          })
        }

        if (!(rowData as any).mainStaffName) {
          errors.push({
            type: 'MISSING_STAFF',
            message: '担当者が必須です',
            row: i + 1,
            data: rowData,
            severity: 'warning'
          })
        }

        parsedRows.push({
          rowNumber: i + 1,
          data: rowData,
          errors,
          isEdited: false
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
        ...row.data,
        visitorId: `imported_${row.rowNumber}`,
        visitorCode: `VC${row.rowNumber.toString().padStart(6, '0')}`,
        visitorKarteNumber: `K${row.rowNumber.toString().padStart(6, '0')}`,
        visitorGender: 'female', // Default value
        recordDate: (row.data as any).visitDate || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        url: '',
        isFirst: true,
        confirmedAt: null,
        karteTags: '',
        paymentTags: '',
        willPaidPrice: row.data.totalWithTax || 0,
        methodPrice: {},
        discountPrice: {},
        otherDiscountPrice: 0,
        invitationPrice: {},
        cancelPriceWithoutTax: 0,
        cancelPriceWithTax: 0,
        refundPriceWithoutTax: 0,
        refundPriceWithTax: 0,
        coolingoffPriceWithTax: 0,
        coolingoffPriceWithoutTax: 0,
        advancePaymentTransactionPriceWithoutTax: 0,
        advancePaymentTransactionPriceWithTax: 0,
        note: null,
        paymentItems: [],
        isPaymentBalanced: true
      })) as DailyAccountValue[]

    const allErrors = parsedData.flatMap(row => row.errors)
    
    onDataImported(validData, allErrors)
    setParsedData([])
    setCsvFile(null)
    setShowEditMode(false)
  }

  const totalRows = parsedData.length
  const errorRows = parsedData.filter(row => row.errors.some(e => e.severity === 'error')).length
  const warningRows = parsedData.filter(row => row.errors.some(e => e.severity === 'warning')).length

  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm">
      <div className="mb-6">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">CSVデータインポート</h3>
        <p className="text-sm text-gray-600">
          MFのCSVファイルをアップロードしてデータをインポートします
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
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">担当者</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">来院日</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">金額</th>
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
                          value={row.data.visitorName || ''}
                          onChange={(e) => handleEditRow(row.rowNumber, 'visitorName', e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      ) : (
                        <span>{row.data.visitorName || '-'}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {showEditMode ? (
                        <input
                          type="number"
                          value={row.data.visitorAge || ''}
                          onChange={(e) => handleEditRow(row.rowNumber, 'visitorAge', e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      ) : (
                        <span>{row.data.visitorAge || '-'}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {showEditMode ? (
                        <input
                          type="text"
                          value={(row.data as any).mainStaffName || ''}
                          onChange={(e) => handleEditRow(row.rowNumber, 'mainStaffName', e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      ) : (
                        <span>{(row.data as any).mainStaffName || '-'}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {showEditMode ? (
                        <input
                          type="date"
                          value={(row.data as any).visitDate ? new Date((row.data as any).visitDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleEditRow(row.rowNumber, 'visitDate', e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      ) : (
                        <span>{(row.data as any).visitDate ? new Date((row.data as any).visitDate).toLocaleDateString('ja-JP') : '-'}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {showEditMode ? (
                        <input
                          type="number"
                          value={row.data.totalWithTax || ''}
                          onChange={(e) => handleEditRow(row.rowNumber, 'totalWithTax', e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      ) : (
                        <span>{row.data.totalWithTax ? `¥${row.data.totalWithTax.toLocaleString()}` : '-'}</span>
                      )}
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
