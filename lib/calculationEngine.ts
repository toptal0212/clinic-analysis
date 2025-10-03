// Calculation Engine for Clinic Sales Analysis
// Implements the specific calculation rules from requirements

import { 
  Patient, 
  Accounting, 
  RevenueMetrics, 
  PatientRevenue, 
  TreatmentHierarchy, 
  StaffGoal, 
  RepeatAnalysis,
  ErrorData,
  ClinicData
} from './dataTypes'

export class CalculationEngine {
  // 集計ルール1: 売上計上 - お金を受け取った日（会計日）の売上として計上
  calculateDailyRevenue(accountingData: Accounting[], date: Date): number {
    return accountingData
      .filter(account => this.isSameDay(account.paymentDate, date))
      .reduce((sum, account) => sum + account.amount, 0)
  }

  // 集計ルール2: 件数カウント - 対象月に来院した患者数をカウント
  calculateVisitCount(patientData: Patient[], date: Date): number {
    return patientData
      .filter(patient => this.isSameMonth(patient.visitDate, date))
      .length
  }

  // 集計ルール3: 単価計算の基本
  calculatePatientAverages(
    patientData: Patient[], 
    accountingData: Accounting[], 
    date: Date
  ): {
    newAverage: number
    existingAverage: number
    sameDayNewAverage: number
    dailyAverage: number
  } {
    const dayPatients = patientData.filter(patient => 
      this.isSameDay(patient.visitDate, date)
    )

    const dayAccounting = accountingData.filter(account => 
      this.isSameDay(account.paymentDate, date)
    )

    const newPatients: PatientRevenue[] = []
    const existingPatients: PatientRevenue[] = []
    const otherPatients: PatientRevenue[] = []

    // 患者を分類
    dayPatients.forEach(patient => {
      const patientType = this.determinePatientType(patient, accountingData)
      const patientAccounting = dayAccounting.filter(account => 
        account.patientId === patient.id
      )

      const patientRevenue: PatientRevenue = {
        patient,
        accounting: patientAccounting,
        sameDayAmount: patientAccounting.reduce((sum, acc) => sum + acc.amount, 0),
        totalAmount: this.calculateTotalAmount(patient.id, accountingData),
        advancePayment: this.calculateAdvancePayment(patient.id, accountingData),
        remainingPayment: this.calculateRemainingPayment(patient.id, accountingData)
      }

      if (patientType === '新規') {
        newPatients.push(patientRevenue)
      } else if (patientType === '既存') {
        existingPatients.push(patientRevenue)
      } else {
        otherPatients.push(patientRevenue)
      }
    })

    // 単価計算
    const newAverage = newPatients.length > 0 
      ? newPatients.reduce((sum, p) => sum + p.totalAmount, 0) / newPatients.length 
      : 0

    const existingAverage = existingPatients.length > 0 
      ? existingPatients.reduce((sum, p) => sum + p.totalAmount, 0) / existingPatients.length 
      : 0

    const sameDayNewAverage = newPatients.length > 0 
      ? newPatients.reduce((sum, p) => sum + p.sameDayAmount, 0) / newPatients.length 
      : 0

    const dailyAverage = dayPatients.length > 0 
      ? dayAccounting.reduce((sum, acc) => sum + acc.amount, 0) / dayPatients.length 
      : 0

    return {
      newAverage,
      existingAverage,
      sameDayNewAverage,
      dailyAverage
    }
  }

  // 患者タイプの判定（新規/既存/その他）
  determinePatientType(patient: Patient, accountingData: Accounting[]): '新規' | '既存' | 'その他' {
    const treatment = this.categorizeTreatment(patient.treatmentCategory, patient.treatmentName)
    
    // その他（ピアス/物販/麻酔・針・パック等）のみを利用した場合は単価計算の対象外
    if (treatment.main === 'その他') {
      return 'その他'
    }
    
    // 過去の来院履歴をチェック
    const previousVisits = accountingData.filter(account => 
      account.patientId === patient.id && 
      account.paymentDate < patient.visitDate &&
      account.isConsultation // 相談（会計が発生した予約）のみ
    )
    
    return previousVisits.length > 0 ? '既存' : '新規'
  }

  // 施術内容の階層化分類
  categorizeTreatment(treatmentCategory: string, treatmentName: string): TreatmentHierarchy {
    const categories = {
      BEAUTY: {
        name: '美容',
        subcategories: {
          SURGERY: {
            name: '外科',
            procedures: [
              '二重', 'くま治療', '糸リフト', '小顔（S,BF)', 
              '鼻・人中手術', 'ボディー脂肪吸引', '豊胸', 'その他外科'
            ]
          },
          DERMATOLOGY: {
            name: '皮膚科',
            procedures: ['注入', 'スキン']
          },
          HAIR_REMOVAL: {
            name: '脱毛',
            procedures: ['脱毛']
          }
        }
      },
      OTHER: {
        name: 'その他',
        subcategories: {
          PIERCING: { name: 'ピアス', procedures: ['ピアス'] },
          PRODUCTS: { name: '物販', procedures: ['物販'] },
          ANESTHESIA: { name: '麻酔・針・パック', procedures: ['麻酔・針・パック'] }
        }
      }
    }
    
    // 美容施術のチェック
    if (categories.BEAUTY.subcategories.SURGERY.procedures.includes(treatmentName)) {
      return {
        main: '美容',
        sub: '外科',
        procedure: treatmentName
      }
    } else if (categories.BEAUTY.subcategories.DERMATOLOGY.procedures.includes(treatmentName)) {
      return {
        main: '美容',
        sub: '皮膚科',
        procedure: treatmentName
      }
    } else if (categories.BEAUTY.subcategories.HAIR_REMOVAL.procedures.includes(treatmentName)) {
      return {
        main: '美容',
        sub: '脱毛',
        procedure: treatmentName
      }
    }
    
    // その他施術のチェック
    if (categories.OTHER.subcategories.PIERCING.procedures.includes(treatmentName)) {
      return {
        main: 'その他',
        sub: 'ピアス',
        procedure: treatmentName
      }
    } else if (categories.OTHER.subcategories.PRODUCTS.procedures.includes(treatmentName)) {
      return {
        main: 'その他',
        sub: '物販',
        procedure: treatmentName
      }
    } else if (categories.OTHER.subcategories.ANESTHESIA.procedures.includes(treatmentName)) {
      return {
        main: 'その他',
        sub: '麻酔・針・パック',
        procedure: treatmentName
      }
    }
    
    // デフォルト
    return {
      main: 'その他',
      sub: 'その他',
      procedure: treatmentName
    }
  }

  // 予約金の計算
  calculateAdvancePayment(patientId: string, accountingData: Accounting[]): number {
    return accountingData
      .filter(account => 
        account.patientId === patientId && 
        account.isAdvancePayment
      )
      .reduce((sum, account) => sum + account.amount, 0)
  }

  // 残金の計算
  calculateRemainingPayment(patientId: string, accountingData: Accounting[]): number {
    return accountingData
      .filter(account => 
        account.patientId === patientId && 
        !account.isAdvancePayment
      )
      .reduce((sum, account) => sum + account.amount, 0)
  }

  // 総金額の計算（予約金+残金）
  calculateTotalAmount(patientId: string, accountingData: Accounting[]): number {
    return accountingData
      .filter(account => account.patientId === patientId)
      .reduce((sum, account) => sum + account.amount, 0)
  }

  // 日別売上メトリクスの計算
  calculateDailyRevenueMetrics(
    patientData: Patient[], 
    accountingData: Accounting[], 
    date: Date
  ): RevenueMetrics {
    const dayPatients = patientData.filter(patient => 
      this.isSameDay(patient.visitDate, date)
    )

    const dayAccounting = accountingData.filter(account => 
      this.isSameDay(account.paymentDate, date)
    )

    const newPatients: PatientRevenue[] = []
    const existingPatients: PatientRevenue[] = []
    const otherPatients: PatientRevenue[] = []

    // 患者を分類
    dayPatients.forEach(patient => {
      const patientType = this.determinePatientType(patient, accountingData)
      const patientAccounting = dayAccounting.filter(account => 
        account.patientId === patient.id
      )

      const patientRevenue: PatientRevenue = {
        patient,
        accounting: patientAccounting,
        sameDayAmount: patientAccounting.reduce((sum, acc) => sum + acc.amount, 0),
        totalAmount: this.calculateTotalAmount(patient.id, accountingData),
        advancePayment: this.calculateAdvancePayment(patient.id, accountingData),
        remainingPayment: this.calculateRemainingPayment(patient.id, accountingData)
      }

      if (patientType === '新規') {
        newPatients.push(patientRevenue)
      } else if (patientType === '既存') {
        existingPatients.push(patientRevenue)
      } else {
        otherPatients.push(patientRevenue)
      }
    })

    const averages = this.calculatePatientAverages(patientData, accountingData, date)

    return {
      date,
      totalRevenue: dayAccounting.reduce((sum, account) => sum + account.amount, 0),
      totalCount: dayPatients.length,
      newPatients,
      existingPatients,
      otherPatients,
      sameDayNewAverage: averages.sameDayNewAverage,
      newAverage: averages.newAverage,
      existingAverage: averages.existingAverage,
      dailyAverage: averages.dailyAverage
    }
  }

  // 月別売上メトリクスの計算
  calculateMonthlyRevenueMetrics(
    patientData: Patient[], 
    accountingData: Accounting[], 
    year: number, 
    month: number
  ): RevenueMetrics {
    const monthStart = new Date(year, month - 1, 1)
    const monthEnd = new Date(year, month, 0)

    const monthPatients = patientData.filter(patient => 
      this.isInMonth(patient.visitDate, year, month)
    )

    const monthAccounting = accountingData.filter(account => 
      this.isInMonth(account.paymentDate, year, month)
    )

    const newPatients: PatientRevenue[] = []
    const existingPatients: PatientRevenue[] = []
    const otherPatients: PatientRevenue[] = []

    // 患者を分類
    monthPatients.forEach(patient => {
      const patientType = this.determinePatientType(patient, accountingData)
      const patientAccounting = monthAccounting.filter(account => 
        account.patientId === patient.id
      )

      const patientRevenue: PatientRevenue = {
        patient,
        accounting: patientAccounting,
        sameDayAmount: patientAccounting.reduce((sum, acc) => sum + acc.amount, 0),
        totalAmount: this.calculateTotalAmount(patient.id, accountingData),
        advancePayment: this.calculateAdvancePayment(patient.id, accountingData),
        remainingPayment: this.calculateRemainingPayment(patient.id, accountingData)
      }

      if (patientType === '新規') {
        newPatients.push(patientRevenue)
      } else if (patientType === '既存') {
        existingPatients.push(patientRevenue)
      } else {
        otherPatients.push(patientRevenue)
      }
    })

    const newAverage = newPatients.length > 0 
      ? newPatients.reduce((sum, p) => sum + p.totalAmount, 0) / newPatients.length 
      : 0

    const existingAverage = existingPatients.length > 0 
      ? existingPatients.reduce((sum, p) => sum + p.totalAmount, 0) / existingPatients.length 
      : 0

    const sameDayNewAverage = newPatients.length > 0 
      ? newPatients.reduce((sum, p) => sum + p.sameDayAmount, 0) / newPatients.length 
      : 0

    const dailyAverage = monthPatients.length > 0 
      ? monthAccounting.reduce((sum, acc) => sum + acc.amount, 0) / monthPatients.length 
      : 0

    return {
      date: monthStart,
      totalRevenue: monthAccounting.reduce((sum, account) => sum + account.amount, 0),
      totalCount: monthPatients.length,
      newPatients,
      existingPatients,
      otherPatients,
      sameDayNewAverage,
      newAverage,
      existingAverage,
      dailyAverage
    }
  }

  // スタッフ目標達成率の計算
  calculateStaffGoals(
    patientData: Patient[], 
    accountingData: Accounting[], 
    staffGoals: StaffGoal[],
    dateRange: { start: Date, end: Date }
  ): StaffGoal[] {
    return staffGoals.map(goal => {
      const staffPatients = patientData.filter(patient => 
        patient.staff === goal.staffName &&
        patient.visitDate >= dateRange.start &&
        patient.visitDate <= dateRange.end
      )

      const staffAccounting = accountingData.filter(account => 
        staffPatients.some(patient => patient.id === account.patientId)
      )

      const newPatients = staffPatients.filter(patient => 
        this.determinePatientType(patient, accountingData) === '新規'
      )

      const existingPatients = staffPatients.filter(patient => 
        this.determinePatientType(patient, accountingData) === '既存'
      )

      const currentAmount = staffAccounting.reduce((sum, account) => sum + account.amount, 0)
      const currentNewAverage = newPatients.length > 0 
        ? newPatients.reduce((sum, patient) => 
            sum + this.calculateTotalAmount(patient.id, accountingData), 0
          ) / newPatients.length 
        : 0

      const currentExistingAverage = existingPatients.length > 0 
        ? existingPatients.reduce((sum, patient) => 
            sum + this.calculateTotalAmount(patient.id, accountingData), 0
          ) / existingPatients.length 
        : 0

      return {
        ...goal,
        currentAmount,
        currentNewAverage,
        currentExistingAverage,
        achievementRate: goal.targetAmount > 0 ? (currentAmount / goal.targetAmount) * 100 : 0,
        newAchievementRate: goal.targetNewAverage > 0 ? (currentNewAverage / goal.targetNewAverage) * 100 : 0,
        existingAchievementRate: goal.targetExistingAverage > 0 ? (currentExistingAverage / goal.targetExistingAverage) * 100 : 0
      }
    })
  }

  // リピート率の計算
  calculateRepeatAnalysis(
    patientData: Patient[], 
    accountingData: Accounting[], 
    period: '6months' | '12months'
  ): RepeatAnalysis {
    const months = period === '6months' ? 6 : 12
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - months)

    // 初回来院患者を特定
    const firstVisitPatients = patientData.filter(patient => 
      patient.visitDate >= cutoffDate &&
      this.determinePatientType(patient, accountingData) === '新規'
    )

    // リピート患者を特定
    const repeatPatients = firstVisitPatients.filter(patient => {
      const repeatVisits = patientData.filter(p => 
        p.id === patient.id && 
        p.visitDate > patient.visitDate &&
        p.visitDate <= new Date()
      )
      return repeatVisits.length > 0
    })

    // リピートまでの平均日数
    const daysToRepeat = repeatPatients.map(patient => {
      const repeatVisits = patientData.filter(p => 
        p.id === patient.id && 
        p.visitDate > patient.visitDate
      )
      if (repeatVisits.length > 0) {
        const firstRepeat = repeatVisits.sort((a, b) => a.visitDate.getTime() - b.visitDate.getTime())[0]
        return Math.floor((firstRepeat.visitDate.getTime() - patient.visitDate.getTime()) / (1000 * 60 * 60 * 24))
      }
      return 0
    }).filter(days => days > 0)

    const averageDaysToRepeat = daysToRepeat.length > 0 
      ? daysToRepeat.reduce((sum, days) => sum + days, 0) / daysToRepeat.length 
      : 0

    // リピート患者の売上
    const repeatRevenue = repeatPatients.reduce((sum, patient) => {
      return sum + this.calculateTotalAmount(patient.id, accountingData)
    }, 0)

    const averageRepeatRevenue = repeatPatients.length > 0 
      ? repeatRevenue / repeatPatients.length 
      : 0

    return {
      period,
      totalPatients: firstVisitPatients.length,
      repeatPatients: repeatPatients.length,
      repeatRate: firstVisitPatients.length > 0 
        ? (repeatPatients.length / firstVisitPatients.length) * 100 
        : 0,
      averageDaysToRepeat,
      repeatRevenue,
      averageRepeatRevenue
    }
  }

  // データ検証
  validateData(patientData: Patient[], accountingData: Accounting[]): ErrorData[] {
    const errors: ErrorData[] = []

    patientData.forEach((patient, index) => {
      // 患者コードのチェック
      if (!patient.id) {
        errors.push({
          type: 'MISSING_PATIENT_CODE',
          message: '患者コードが空欄です',
          row: index + 1,
          data: patient,
          severity: 'error'
        })
      }

      // 年齢のチェック（0歳は除外）
      if (patient.age === 0) {
        errors.push({
          type: 'MISSING_AGE',
          message: '年齢が0または空欄です（予約キャンセル等）',
          row: index + 1,
          data: patient,
          severity: 'warning'
        })
      }

      // 流入元のチェック
      if (!patient.referralSource) {
        errors.push({
          type: 'MISSING_REFERRAL_SOURCE',
          message: '流入元（知ったきっかけ）が空欄です',
          row: index + 1,
          data: patient,
          severity: 'error'
        })
      }

      // 予約経路のチェック
      if (!patient.appointmentRoute) {
        errors.push({
          type: 'MISSING_APPOINTMENT_ROUTE',
          message: '予約経路（来院区分）が空欄です',
          row: index + 1,
          data: patient,
          severity: 'error'
        })
      }

      // 施術カテゴリーのチェック
      if (!patient.treatmentCategory) {
        errors.push({
          type: 'MISSING_TREATMENT_CATEGORY',
          message: '施術カテゴリーが空欄です',
          row: index + 1,
          data: patient,
          severity: 'error'
        })
      }

      // 担当者のチェック
      if (!patient.staff) {
        errors.push({
          type: 'MISSING_STAFF',
          message: '担当者が空欄です',
          row: index + 1,
          data: patient,
          severity: 'error'
        })
      }
    })

    return errors
  }

  // ヘルパーメソッド
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString()
  }

  private isSameMonth(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() && 
           date1.getMonth() === date2.getMonth()
  }

  private isInMonth(date: Date, year: number, month: number): boolean {
    return date.getFullYear() === year && date.getMonth() === month - 1
  }
}
