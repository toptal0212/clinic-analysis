// Consultation menu to category mapping
// 相談メニューとカテゴリの一対一対応

export interface ConsultationMapping {
  consultationName: string
  specialty: 'surgery' | 'dermatology' | 'hair_removal' | 'other'
  subcategory: string
  categoryId: string
  requiresManualClassification?: boolean // 手動分類が必要な相談
}

// 相談メニューとカテゴリのマッピング
export const CONSULTATION_MAPPINGS: ConsultationMapping[] = [
  // 美容外科カウンセリング
  { consultationName: '二重のご相談', specialty: 'surgery', subcategory: '二重', categoryId: 'surgery_double_eyelid' },
  { consultationName: '小顔のご相談（脂肪吸引・バッカルファット）', specialty: 'surgery', subcategory: '小顔（S,BF)', categoryId: 'surgery_face_slimming' },
  { consultationName: 'リフトアップのご相談', specialty: 'surgery', subcategory: '糸リフト', categoryId: 'surgery_thread_lift' },
  { consultationName: 'クマ取りのご相談', specialty: 'surgery', subcategory: 'くま治療', categoryId: 'surgery_dark_circles' },
  { consultationName: '鼻のご相談', specialty: 'surgery', subcategory: '鼻・人中手術', categoryId: 'surgery_nose_philtrum' },
  { consultationName: 'ボディ脂肪吸引のご相談', specialty: 'surgery', subcategory: 'ボディー脂肪吸引', categoryId: 'surgery_body_liposuction' },
  { consultationName: '脂肪豊胸のご相談', specialty: 'surgery', subcategory: '豊胸', categoryId: 'surgery_breast_augmentation' },
  { consultationName: 'ハイブリッド豊胸のご相談', specialty: 'surgery', subcategory: '豊胸', categoryId: 'surgery_breast_augmentation' },
  { consultationName: 'シリコンバック豊胸のご相談', specialty: 'surgery', subcategory: '豊胸', categoryId: 'surgery_breast_augmentation' },
  { consultationName: '手術でのタトゥー除去のご相談', specialty: 'surgery', subcategory: 'その他外科', categoryId: 'surgery_other' },
  // 手動分類が必要な相談
  { consultationName: 'トータル外科施術のお悩み相談', specialty: 'surgery', subcategory: 'その他外科', categoryId: 'surgery_other', requiresManualClassification: true },
  { consultationName: 'その他外科手術のご相談', specialty: 'surgery', subcategory: 'その他外科', categoryId: 'surgery_other', requiresManualClassification: true },
  { consultationName: '婦人科形成のご相談', specialty: 'surgery', subcategory: 'その他外科', categoryId: 'surgery_other', requiresManualClassification: true },
  { consultationName: '乳頭縮小・乳輪縮小・陥没乳頭のご相談', specialty: 'surgery', subcategory: 'その他外科', categoryId: 'surgery_other', requiresManualClassification: true },
  
  // 美容皮膚科カウンセリング
  { consultationName: 'ボトックスのご相談', specialty: 'dermatology', subcategory: '注入', categoryId: 'dermatology_injection' },
  { consultationName: 'ヒアルロン酸のご相談', specialty: 'dermatology', subcategory: '注入', categoryId: 'dermatology_injection' },
  { consultationName: '脂肪溶解注射のご相談', specialty: 'dermatology', subcategory: '注入', categoryId: 'dermatology_injection' },
  { consultationName: 'しみ取りのご相談', specialty: 'dermatology', subcategory: 'スキン', categoryId: 'dermatology_skin' },
  { consultationName: 'ピコトーニング・ピコフラクショナルのご相談', specialty: 'dermatology', subcategory: 'スキン', categoryId: 'dermatology_skin' },
  { consultationName: 'ピーリングのご相談', specialty: 'dermatology', subcategory: 'スキン', categoryId: 'dermatology_skin' },
  { consultationName: 'ダーマペン・ヴェルベットスキンのご相談', specialty: 'dermatology', subcategory: 'スキン', categoryId: 'dermatology_skin' },
  { consultationName: 'フォトフェイシャル（ライムライト）のご相談', specialty: 'dermatology', subcategory: 'スキン', categoryId: 'dermatology_skin' },
  { consultationName: 'インモードのご相談', specialty: 'dermatology', subcategory: 'スキン（インモード/HIFU）', categoryId: 'dermatology_skin_inmode_hifu' },
  { consultationName: 'HIFU（ウルトラフォーマーMPT）のご相談', specialty: 'dermatology', subcategory: 'スキン（インモード/HIFU）', categoryId: 'dermatology_skin_inmode_hifu' },
  { consultationName: 'ルメッカのご相談', specialty: 'dermatology', subcategory: 'スキン（インモード/HIFU）', categoryId: 'dermatology_skin_inmode_hifu' },
  { consultationName: 'トータルお肌のお悩み相談', specialty: 'dermatology', subcategory: 'スキン', categoryId: 'dermatology_skin', requiresManualClassification: true },
  { consultationName: '美容内服/美容点滴のご相談', specialty: 'other', subcategory: '物販', categoryId: 'other_products' },
  
  // 医療脱毛カウンセリング
  { consultationName: '医療脱毛のご相談', specialty: 'hair_removal', subcategory: '脱毛', categoryId: 'hair_removal' },
  
  // タトゥー除去カウンセリング
  { consultationName: 'レーザーでのタトゥー除去のご相談', specialty: 'dermatology', subcategory: 'スキン', categoryId: 'dermatology_skin' },
]

// 相談名からカテゴリを取得
export function getCategoryFromConsultation(consultationName: string): ConsultationMapping | null {
  const normalizedName = consultationName.trim()
  
  // 完全一致で検索
  const exactMatch = CONSULTATION_MAPPINGS.find(m => m.consultationName === normalizedName)
  if (exactMatch) return exactMatch
  
  // 部分一致で検索（より柔軟なマッチング）
  const partialMatch = CONSULTATION_MAPPINGS.find(m => {
    const normalized = normalizedName.toLowerCase()
    const mappingName = m.consultationName.toLowerCase()
    return normalized.includes(mappingName) || mappingName.includes(normalized)
  })
  if (partialMatch) return partialMatch
  
  return null
}

// 相談かどうかを判定（部屋名から）
export function isConsultationRoom(roomName: string): boolean {
  if (!roomName) return false
  const normalized = roomName.trim()
  return normalized === '診察予約1' || normalized === '診察予約2'
}

// 相談のみかどうかを判定（会計が0の場合）
export function isConsultationOnly(record: any): boolean {
  const totalWithTax = record.totalWithTax || 0
  const hasPaymentItems = Array.isArray(record.paymentItems) && record.paymentItems.length > 0
  const paymentItemsTotal = hasPaymentItems 
    ? record.paymentItems.reduce((sum: number, item: any) => sum + (item.priceWithTax || 0), 0)
    : 0
  
  return (totalWithTax === 0 && paymentItemsTotal === 0) || isConsultationRoom(record.roomName)
}

// 相談→処置かどうかを判定（会計が発生している場合）
export function isConsultationToTreatment(record: any): boolean {
  const totalWithTax = record.totalWithTax || 0
  const hasPaymentItems = Array.isArray(record.paymentItems) && record.paymentItems.length > 0
  const paymentItemsTotal = hasPaymentItems 
    ? record.paymentItems.reduce((sum: number, item: any) => sum + (item.priceWithTax || 0), 0)
    : 0
  
  const hasAccounting = totalWithTax > 0 || paymentItemsTotal > 0
  const isConsultation = isConsultationRoom(record.roomName) || 
                        (record.treatmentName && record.treatmentName.includes('ご相談')) ||
                        (record.treatmentCategory && record.treatmentCategory.includes('カウンセリング'))
  
  return hasAccounting && isConsultation
}

// 年齢0のレコードを除外するかどうかを判定
export function shouldExcludeRecord(record: any): boolean {
  const age = record.age || record.visitorAge || 0
  return age === 0
}

// エラーチェック
export interface RecordError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

export function validateRecord(record: any): RecordError[] {
  const errors: RecordError[] = []
  
  // 患者コードやカルテNoが空欄
  if (!record.patientCode && !record.karteNumber && !record.visitorId) {
    errors.push({
      field: 'patientCode',
      message: '患者コードまたはカルテNoが必須です',
      severity: 'error'
    })
  }
  
  // 初診再診の区分が空欄
  if (!record.patientType && record.isFirst === undefined && record.isFirstVisit === undefined) {
    errors.push({
      field: 'patientType',
      message: '初診再診の区分が必須です',
      severity: 'error'
    })
  }
  
  // 知ったきっかけ（流入元）が空欄
  if (!record.referralSource && !record.visitorInflowSourceName && !record.visitorInflowSourceLabel) {
    errors.push({
      field: 'referralSource',
      message: '知ったきっかけが必須です',
      severity: 'error'
    })
  }
  
  // どのカテゴリーにも当てはまらない相談
  const consultationName = record.treatmentName || record.treatmentCategory || ''
  if (consultationName && consultationName.includes('ご相談')) {
    const mapping = getCategoryFromConsultation(consultationName)
    if (!mapping) {
      errors.push({
        field: 'treatmentCategory',
        message: 'どの分類にも属さない施術が登録されました',
        severity: 'error'
      })
    }
  }
  
  return errors
}

