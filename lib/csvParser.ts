// CSV Parser for Medical Force Data Import
export class CSVParser {
  private static parseCSVRow(row: string, delimiter: string = ','): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
  }

  static async parseFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n').filter(line => line.trim())
          
          if (lines.length === 0) {
            resolve([])
            return
          }
          
          // Parse header
          const headers = this.parseCSVRow(lines[0])
          
          // Parse data rows
          const data = lines.slice(1).map((line, index) => {
            const values = this.parseCSVRow(line)
            const row: any = {}
            
            headers.forEach((header, i) => {
              const cleanHeader = header.replace(/"/g, '').trim()
              const value = values[i]?.replace(/"/g, '').trim() || ''
              row[cleanHeader] = value
            })
            
            return {
              ...row,
              _rowIndex: index + 2 // +2 because we start from line 2 and 0-indexed
            }
          })
          
          resolve(data)
        } catch (error) {
          reject(new Error(`CSV解析エラー: ${error instanceof Error ? error.message : 'Unknown error'}`))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('ファイルの読み込みに失敗しました'))
      }
      
      reader.readAsText(file, 'UTF-8')
    })
  }

  // Parse patient data CSV
  static async parsePatientData(file: File): Promise<any[]> {
    const data = await this.parseFile(file)
    
    return data.map(row => ({
      id: row.患者コード || row.patient_code || row.id,
      name: row.氏名 || row.name || row.patient_name,
      age: parseInt(row.年齢 || row.age) || 0,
      appointmentId: row.予約ID || row.appointment_id,
      treatmentCategory: row.施術カテゴリー || row.treatment_category,
      treatmentName: row.施術名 || row.treatment_name,
      roomName: row.部屋名 || row.room_name,
      isCancelled: row.キャンセル有無 === '1' || row.is_cancelled === 'true',
      referralSource: row.流入元 || row.referral_source || row.知ったきっかけ,
      appointmentRoute: row.予約経路 || row.appointment_route || row.来院区分,
      staff: row.担当者 || row.staff || row.doctor,
      visitDate: new Date(row.来院日 || row.visit_date || row.date),
      treatmentDate: new Date(row.施術日 || row.treatment_date || row.date),
      _rawData: row
    })).filter(patient => patient.id && patient.visitDate && !isNaN(patient.visitDate.getTime()))
  }

  // Parse accounting data CSV
  static async parseAccountingData(file: File): Promise<any[]> {
    const data = await this.parseFile(file)
    
    return data.map(row => ({
      id: row.会計ID || row.accounting_id || row.id,
      patientId: row.患者ID || row.patient_id || row.患者コード,
      amount: parseFloat(row.金額 || row.amount || row.price) || 0,
      paymentDate: new Date(row.支払い日 || row.payment_date || row.date),
      visitDate: new Date(row.来院日 || row.visit_date || row.date),
      treatmentType: row.処置内容 || row.treatment_type || row.treatment,
      isAdvancePayment: row.前受金 === '1' || row.is_advance_payment === 'true',
      advancePaymentDate: row.前受金日 ? new Date(row.前受金日 || row.advance_payment_date) : null,
      remainingAmount: parseFloat(row.残金 || row.remaining_amount || row.balance) || 0,
      _rawData: row
    })).filter(account => account.patientId && account.paymentDate && !isNaN(account.paymentDate.getTime()))
  }

  // Validate CSV structure
  static validatePatientCSV(data: any[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (data.length === 0) {
      errors.push('CSVファイルが空です')
      return { isValid: false, errors }
    }
    
    // Check required fields
    const requiredFields = ['患者コード', '氏名', '年齢', '来院日']
    const sampleRow = data[0]
    
    requiredFields.forEach(field => {
      if (!sampleRow[field] && !sampleRow[field.toLowerCase()] && !sampleRow[field.replace('患者', 'patient').replace('氏名', 'name').replace('年齢', 'age').replace('来院日', 'visit_date')]) {
        errors.push(`必須フィールドが不足しています: ${field}`)
      }
    })
    
    // Check for invalid dates
    data.forEach((row, index) => {
      if (!row.visitDate || isNaN(row.visitDate.getTime())) {
        errors.push(`行 ${index + 2}: 有効な来院日がありません`)
      }
      
      if (!row.age || row.age <= 0) {
        errors.push(`行 ${index + 2}: 有効な年齢がありません`)
      }
    })
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateAccountingCSV(data: any[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (data.length === 0) {
      errors.push('CSVファイルが空です')
      return { isValid: false, errors }
    }
    
    const sampleRow = data[0]
    const requiredFields = ['患者ID', '金額', '支払い日']
    
    requiredFields.forEach(field => {
      if (!sampleRow[field] && !sampleRow[field.toLowerCase()] && !sampleRow[field.replace('患者', 'patient').replace('金額', 'amount').replace('支払い日', 'payment_date')]) {
        errors.push(`必須フィールドが不足しています: ${field}`)
      }
    })
    
    data.forEach((row, index) => {
      if (!row.paymentDate || isNaN(row.paymentDate.getTime())) {
        errors.push(`行 ${index + 2}: 有効な支払い日がありません`)
      }
      
      if (!row.amount || row.amount <= 0) {
        errors.push(`行 ${index + 2}: 有効な金額がありません`)
      }
    })
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
