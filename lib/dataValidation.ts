import { Patient, DailyAccountValue, ErrorData } from './dataTypes'

export interface ValidationRule {
  name: string
  check: (data: any) => boolean
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  isValid: boolean
  errors: ErrorData[]
  warnings: ErrorData[]
}

// Treatment category hierarchy
export const TREATMENT_HIERARCHY = {
  surgery: {
    main: '外科',
    subcategories: {
      doubleEyelid: '二重',
      darkCircle: 'くま治療',
      threadLift: '糸リフト',
      faceSlimming: '小顔（S,BF)',
      noseSurgery: '鼻・人中手術',
      bodyLiposuction: 'ボディー脂肪吸引',
      breastAugmentation: '豊胸',
      otherSurgery: 'その他外科'
    }
  },
  dermatology: {
    main: '皮膚科',
    subcategories: {
      injection: '注入',
      skin: 'スキン'
    }
  },
  hairRemoval: {
    main: '脱毛',
    subcategories: {}
  },
  other: {
    main: 'その他',
    subcategories: {
      piercing: 'ピアス',
      products: '物販',
      anesthesia: '麻酔・針・パック'
    }
  }
}

// Validation rules
export const VALIDATION_RULES: ValidationRule[] = [
  {
    name: 'missing_referral_source',
    check: (data: any) => !data.referralSource || data.referralSource.trim() === '',
    message: '流入元（知ったきっかけ）が未入力です',
    severity: 'error'
  },
  {
    name: 'missing_staff',
    check: (data: any) => !data.mainStaffName || data.mainStaffName.trim() === '',
    message: '主担当者が未入力です',
    severity: 'error'
  },
  {
    name: 'missing_sub_staff',
    check: (data: any) => !data.subStaffName || data.subStaffName.trim() === '',
    message: '副担当者が未入力です',
    severity: 'warning'
  },
  {
    name: 'invalid_treatment_category',
    check: (data: any) => {
      if (!data.treatmentCategory) return true
      const category = data.treatmentCategory.toLowerCase()
      const validCategories = [
        '二重', 'くま治療', '糸リフト', '小顔', '鼻', '人中手術', 'ボディー脂肪吸引', '豊胸',
        '注入', 'スキン', '脱毛', 'ピアス', '物販', '麻酔', '針', 'パック'
      ]
      return !validCategories.some(valid => category.includes(valid.toLowerCase()))
    },
    message: '施術カテゴリーが分類できません',
    severity: 'error'
  },
  {
    name: 'missing_patient_info',
    check: (data: any) => !data.visitorName || data.visitorName.trim() === '',
    message: '患者名が未入力です',
    severity: 'error'
  },
  {
    name: 'invalid_age',
    check: (data: any) => !data.visitorAge || data.visitorAge < 0 || data.visitorAge > 120,
    message: '年齢が無効です',
    severity: 'error'
  },
  {
    name: 'missing_appointment_route',
    check: (data: any) => !data.reservationInflowPathLabel || data.reservationInflowPathLabel.trim() === '',
    message: '予約経路が未入力です',
    severity: 'warning'
  }
]

// Data validation functions
export const validatePatientData = (patients: Patient[]): ValidationResult => {
  const errors: ErrorData[] = []
  const warnings: ErrorData[] = []

  patients.forEach((patient, index) => {
    VALIDATION_RULES.forEach(rule => {
      if (rule.check(patient)) {
        const error: ErrorData = {
          type: rule.name as any,
          message: rule.message,
          row: index + 1,
          data: patient,
          severity: rule.severity
        }

        if (rule.severity === 'error') {
          errors.push(error)
        } else {
          warnings.push(error)
        }
      }
    })
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export const validateDailyAccounts = (accounts: DailyAccountValue[]): ValidationResult => {
  const errors: ErrorData[] = []
  const warnings: ErrorData[] = []

  accounts.forEach((account, index) => {
    // Check for missing referral source
    if (!account.visitorInflowSourceName || account.visitorInflowSourceName.trim() === '') {
      errors.push({
        type: 'MISSING_REFERRAL_SOURCE',
        message: '流入元が未入力です',
        row: index + 1,
        data: account,
        severity: 'error'
      })
    }

    // Check for missing staff
    if (!account.paymentItems || account.paymentItems.length === 0) {
      errors.push({
        type: 'MISSING_STAFF',
        message: '担当者情報がありません',
        row: index + 1,
        data: account,
        severity: 'error'
      })
    } else {
      account.paymentItems.forEach((item, itemIndex) => {
        if (!item.mainStaffName || item.mainStaffName.trim() === '') {
          errors.push({
            type: 'MISSING_STAFF',
            message: '主担当者が未入力です',
            row: index + 1,
            data: item,
            severity: 'error'
          })
        }
      })
    }

    // Check for unclassified treatments
    if (account.paymentItems) {
      account.paymentItems.forEach((item, itemIndex) => {
        if (item.category && !isValidTreatmentCategory(item.category)) {
          errors.push({
            type: 'INVALID_TREATMENT_CATEGORY',
            message: `施術内容「${item.category}」が分類できません`,
            row: index + 1,
            data: item,
            severity: 'error'
          })
        }
      })
    }

    // Check for data consistency
    if (account.visitorInflowSourceName && account.reservationInflowPathLabel) {
      const referralTotal = getReferralTotal(account.visitorInflowSourceName)
      const routeTotal = getRouteTotal(account.reservationInflowPathLabel)
      
      if (Math.abs(referralTotal - routeTotal) > 0.01) {
        warnings.push({
          type: 'DATA_MISMATCH',
          message: '流入経路の総計が一致しません',
          row: index + 1,
          data: account,
          severity: 'warning'
        })
      }
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Helper functions
const isValidTreatmentCategory = (category: string): boolean => {
  const validCategories = [
    '二重', 'くま治療', '糸リフト', '小顔', '鼻', '人中手術', 'ボディー脂肪吸引', '豊胸',
    '注入', 'スキン', '脱毛', 'ピアス', '物販', '麻酔', '針', 'パック'
  ]
  
  return validCategories.some(valid => 
    category.toLowerCase().includes(valid.toLowerCase())
  )
}

const getReferralTotal = (referralSource: string): number => {
  // This would be calculated based on your business logic
  // For now, return a mock value
  return 1
}

const getRouteTotal = (route: string): number => {
  // This would be calculated based on your business logic
  // For now, return a mock value
  return 1
}

// Campaign analysis
export const analyzeCampaigns = (accounts: DailyAccountValue[]) => {
  const campaignData = accounts.reduce((acc, account) => {
    if (account.discountPrice && Object.keys(account.discountPrice).length > 0) {
      Object.entries(account.discountPrice).forEach(([campaign, discount]) => {
        if (!acc[campaign]) {
          acc[campaign] = {
            count: 0,
            totalDiscount: 0,
            totalSales: 0
          }
        }
        acc[campaign].count += 1
        acc[campaign].totalDiscount += discount.price || 0
        acc[campaign].totalSales += account.totalWithTax || 0
      })
    }
    return acc
  }, {} as Record<string, { count: number; totalDiscount: number; totalSales: number }>)

  return campaignData
}

// Repeat rate analysis
export const analyzeRepeatRate = (patients: Patient[], accounts: DailyAccountValue[]) => {
  const patientVisits = new Map<string, number>()
  
  accounts.forEach(account => {
    const patientId = account.visitorId
    patientVisits.set(patientId, (patientVisits.get(patientId) || 0) + 1)
  })

  const totalPatients = patientVisits.size
  const repeatPatients = Array.from(patientVisits.values()).filter(visits => visits > 1).length
  const repeatRate = totalPatients > 0 ? (repeatPatients / totalPatients) * 100 : 0

  return {
    totalPatients,
    repeatPatients,
    repeatRate,
    averageVisits: totalPatients > 0 ? Array.from(patientVisits.values()).reduce((sum, visits) => sum + visits, 0) / totalPatients : 0
  }
}

// Skin course contract rate
export const analyzeSkinCourseContractRate = (accounts: DailyAccountValue[]) => {
  const skinPatients = accounts.filter(account => 
    account.paymentItems?.some(item => 
      item.category?.toLowerCase().includes('スキン') || 
      item.name?.toLowerCase().includes('スキン')
    )
  )

  const skinCourseContracts = skinPatients.filter(account =>
    account.paymentItems?.some(item =>
      item.name?.toLowerCase().includes('コース') ||
      item.category?.toLowerCase().includes('コース')
    )
  )

  const contractRate = skinPatients.length > 0 ? (skinCourseContracts.length / skinPatients.length) * 100 : 0

  return {
    totalSkinPatients: skinPatients.length,
    courseContracts: skinCourseContracts.length,
    contractRate
  }
}

// Media attribution analysis
export const analyzeMediaAttribution = (accounts: DailyAccountValue[]) => {
  const mediaData = accounts.reduce((acc, account) => {
    const source = account.visitorInflowSourceName || '不明'
    if (!acc[source]) {
      acc[source] = {
        count: 0,
        totalSales: 0,
        averageUnitPrice: 0
      }
    }
    acc[source].count += 1
    acc[source].totalSales += account.totalWithTax || 0
    acc[source].averageUnitPrice = acc[source].totalSales / acc[source].count
    return acc
  }, {} as Record<string, { count: number; totalSales: number; averageUnitPrice: number }>)

  return mediaData
}
