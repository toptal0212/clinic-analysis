// Data Types and Interfaces for Clinic Sales Analysis Tool

export interface Patient {
  id: string
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  appointmentId: string
  treatmentCategory: string
  treatmentName: string
  roomName: string
  isCancelled: boolean
  referralSource: string // 流入元（知ったきっかけ）
  appointmentRoute: string // 予約経路（来院区分）
  staff: string // 担当者 (mainStaffName from daily report API)
  visitDate: Date
  treatmentDate: Date
  isNewPatient: boolean // 新規/既存区分
  patientType: '新規' | '既存' | 'その他'
  firstVisitDate?: Date // 初回来院日
}

export interface Accounting {
  id: string
  patientId: string
  amount: number
  paymentDate: Date // 会計日（お金を受け取った日）
  visitDate: Date // 来院日
  treatmentType: string // 処置内容
  isAdvancePayment: boolean // 前受金
  advancePaymentDate?: Date
  remainingAmount: number // 残金
  isConsultation: boolean // 相談（会計が発生した予約）
}

export interface TreatmentHierarchy {
  main: '美容' | 'その他'
  sub: '外科' | '皮膚科' | '脱毛' | 'ピアス' | '物販' | '麻酔・針・パック' | 'その他'
  procedure: string
}

export interface RevenueMetrics {
  date: Date
  totalRevenue: number
  totalCount: number
  newPatients: PatientRevenue[]
  existingPatients: PatientRevenue[]
  otherPatients: PatientRevenue[]
  sameDayNewAverage: number // 当日単価（新規）
  newAverage: number // 新規単価（予約金+残金）
  existingAverage: number // 既存単価
  dailyAverage: number // 当日単価（全体）
}

export interface PatientRevenue {
  patient: Patient
  accounting: Accounting[]
  sameDayAmount: number // 当日金額
  totalAmount: number // 総金額（予約金+残金）
  advancePayment: number // 予約金
  remainingPayment: number // 残金
}

// Medical Force API Response Types
export interface MedicalForceClinic {
  clinic_id: string
  name: string
  business_hours: Array<{
    open_at: string
    close_at: string
  }>
  closed_days: Array<{
    clinic_id: string
    created_at: string
    updated_at: string
    deleted_at: string | null
    id: string
    date: string
  }>
  unit_time_minutes: string
  reservation_span: string
}

export interface MedicalForceService {
  id: string
  name: string
  category: string
  subcategory: string
  price: number
  duration_minutes: number
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
  clinic_id: string
  description?: string
  treatment_hierarchy?: {
    main: '美容' | 'その他'
    sub: '外科' | '皮膚科' | '脱毛' | 'ピアス' | '物販' | '麻酔・針・パック' | 'その他'
  }
}

export interface MedicalForceUpdatedBrandCourse {
  clinic_id: string
  course_id: string
  course_name: string
  visitor_id: string
  operation_id: string
  course_count: string
  contracted_at: string
  canceled_at: string | null
  expire_at: string
  cooling_off_day: string | null
  cooling_off_at: string | null
  cooling_off_canceled_at: string | null
  canceled_memo: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface DailyAccountValue {
  createdAt: string
  url: string
  isFirst?: boolean
  visitorId: string
  reservationId?: string
  visitorCode: string
  visitorKarteNumber: string
  visitorName: string
  visitorAge: number
  visitorGender: string
  visitorInflowSourceName: string
  visitorInflowSourceLabel: string
  visitorColumnValues: string[]
  confirmedAt: string | null
  recordDate: string
  orderingDate?: string
  operateDate?: string
  reservationStaffName?: string
  reservationInflowPathLabel?: string | null
  karteTags: string
  paymentTags: string
  willPaidPrice: number
  methodPrice: Record<string, { price: number }>
  discountPrice: Record<string, { price: number }>
  otherDiscountPrice: number
  invitationPrice: Record<string, { price: number }>
  totalWithTax: number
  cancelPriceWithoutTax: number
  cancelPriceWithTax: number
  refundPriceWithoutTax: number
  refundPriceWithTax: number
  coolingoffPriceWithTax: number
  coolingoffPriceWithoutTax: number
  advancePaymentTransactionPriceWithoutTax: number
  advancePaymentTransactionPriceWithTax: number
  advancePaymentRefundPriceWithoutTax?: number
  advancePaymentRefundPriceWithTax?: number
  note: string | null
  paymentItems: PaymentItem[]
  payment?: {
    id: string
    tax_calculation_type: string
    decimal_processing_type: string
  }
  isPaymentBalanced?: boolean
}

export interface PaymentItem {
  id: string
  kind: string
  category: string
  name: string
  optionId?: string
  mainStaffName: string
  subStaffName?: string
  quantity?: number
  quantityUnit?: string
  priceWithTax: number
  priceWithoutTax?: number
  costWithTax?: number
  costWithoutTax?: number
  profitWithTax?: number
  profitWithoutTax?: number
  taxCategory: string
  tax?: number
  genuinePriceWithTax: number
  genuinePriceWithoutTax?: number
  courseContractAmountWithTax?: number
  courseContractAmountWithoutTax?: number
  courseDigestionAmountWithTax?: number
  courseDigestionAmountWithoutTax?: number
  discounts: Record<string, number>
  invitations: Record<string, number>
  practiceTags?: string
  advancePaymentPriceWithoutTax?: number
  advancePaymentPriceWithTax?: number
  advancePaymentTransactionPriceWithoutTax?: number
  advancePaymentTransactionPriceWithTax?: number
  advancePaymentTransactionReceivedMainStaffName?: string
  advancePaymentTransactionReceivedSubStaffName?: string
  advancePaymentRefundReceivedMainStaffName?: string
  advancePaymentRefundReceivedSubStaffName?: string
  operationAdvancePaymentTransactionPriceWithoutTax?: number
  operationAdvancePaymentTransactionPriceWithTax?: number
  operationAdvancePaymentTransactionReceivedMainStaffName?: string
  operationAdvancePaymentTransactionReceivedSubStaffName?: string
}

export interface DailyAccountsResponse {
  clinicId: string
  dailyAccountId: string
  startAt: string
  endAt: string
  total: number
  netTotal: number
  values: DailyAccountValue[]
}

export interface ClinicData {
  id: string
  name: string
  revenue: number
  count: number
  newCount: number
  existingCount: number
  otherCount: number
  newRevenue: number
  existingRevenue: number
  otherRevenue: number
  newAverage: number
  existingAverage: number
  dailyAverage: number
  monthlyData: any[]
}

export interface StaffGoal {
  staffId: string
  staffName: string
  targetAmount: number
  targetNewAverage: number
  targetExistingAverage: number
  targetBeautyRevenue: number
  targetOtherRevenue: number
  currentAmount: number
  currentNewAverage: number
  currentExistingAverage: number
  currentBeautyRevenue: number
  currentOtherRevenue: number
  achievementRate: number
  newAchievementRate: number
  existingAchievementRate: number
  beautyAchievementRate: number
  otherAchievementRate: number
}

export interface RepeatAnalysis {
  period: '6months' | '12months'
  totalPatients: number
  repeatPatients: number
  repeatRate: number
  averageDaysToRepeat: number
  repeatRevenue: number
  averageRepeatRevenue: number
}

export interface ErrorData {
  type: 'MISSING_PATIENT_CODE' | 'MISSING_AGE' | 'MISSING_REFERRAL_SOURCE' | 
        'MISSING_APPOINTMENT_ROUTE' | 'MISSING_TREATMENT_CATEGORY' | 'MISSING_STAFF' |
        'INVALID_DATA' | 'DUPLICATE_DATA'
  message: string
  row: number
  data: any
  severity: 'error' | 'warning'
}

export interface AnalyticsData {
  date: string
  sessions: number
  users: number
  pageViews: number
  bounceRate: number
  avgSessionDuration: number
  conversions: number
  conversionValue: number
  source: string
  medium: string
  campaign: string
  keyword?: string
}

export interface AdData {
  date: string
  campaignId: string
  campaignName: string
  adGroupId?: string
  adGroupName?: string
  adId?: string
  adName?: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  conversionValue: number
  ctr: number
  cpc: number
  cpm: number
  roas: number
  platform: 'google' | 'meta'
}

export interface AttributionData {
  patient: Patient
  analytics?: AnalyticsData
  adData?: AdData
  attributionSource: 'organic' | 'paid' | 'direct' | 'referral' | 'social' | 'email' | 'unknown'
  campaignName?: string
  keyword?: string
  cost?: number
  roas?: number
}

// Dashboard State Types
export interface DashboardFilters {
  dateRange: {
    start: string
    end: string
  }
  clinic: string
  staff: string
  treatmentCategory: string
  patientType: 'all' | 'new' | 'existing' | 'other'
  dateLevel: 'day' | 'week' | 'month' | 'quarter' | 'year'
}

export interface DashboardData {
  patients: Patient[]
  accounting: Accounting[]
  analytics: AnalyticsData[]
  adData: AdData[]
  attribution: AttributionData[]
  revenueMetrics: RevenueMetrics[]
  clinicData: ClinicData[]
  staffGoals: StaffGoal[]
  repeatAnalysis: RepeatAnalysis
  errors: ErrorData[]
}

// API Configuration Types
export interface MedicalForceConfig {
  apiKey?: string
  clientId?: string
  clientSecret?: string
  authMethod: 'apiKey' | 'oauth2'
}

export interface GoogleAnalyticsConfig {
  propertyId: string
  accessToken: string
  refreshToken?: string
  clientId: string
  clientSecret: string
}

export interface GoogleAdsConfig {
  customerId: string
  developerToken: string
  accessToken: string
  refreshToken?: string
  clientId: string
  clientSecret: string
}

export interface MetaAdsConfig {
  adAccountId: string
  accessToken: string
  appId: string
  appSecret: string
}

export interface APIConfiguration {
  medicalForce: MedicalForceConfig
  googleAnalytics?: GoogleAnalyticsConfig
  googleAds?: GoogleAdsConfig
  metaAds?: MetaAdsConfig
}

// Chart Data Types
export interface ChartDataPoint {
  x: string | number
  y: number
  label?: string
  color?: string
}

export interface ChartDataset {
  label: string
  data: ChartDataPoint[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  borderWidth?: number
  fill?: boolean
  tension?: number
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'scatter'
  data: {
    labels: string[]
    datasets: ChartDataset[]
  }
  options?: any
}

// Export/Import Types
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf'
  dateRange: {
    start: string
    end: string
  }
  includeCharts: boolean
  includeRawData: boolean
  filters: DashboardFilters
}

export interface ImportResult {
  success: boolean
  data?: any
  errors: ErrorData[]
  warnings: string[]
  summary: {
    totalRows: number
    processedRows: number
    errorRows: number
    warningRows: number
  }
}
