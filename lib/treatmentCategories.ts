export interface TreatmentCategory {
  id: string
  name: string
  parentId?: string
  level: number
  specialty?: 'surgery' | 'dermatology' | 'hair_removal' | 'other'
}

export const TREATMENT_CATEGORIES: TreatmentCategory[] = [
  // Level 1 - Main Categories
  {
    id: 'surgery',
    name: '外科',
    level: 1,
    specialty: 'surgery'
  },
  {
    id: 'dermatology', 
    name: '皮膚科',
    level: 1,
    specialty: 'dermatology'
  },
  {
    id: 'hair_removal',
    name: '脱毛',
    level: 1,
    specialty: 'hair_removal'
  },
  {
    id: 'other',
    name: 'その他',
    level: 1,
    specialty: 'other'
  },

  // Level 2 - Surgery Subcategories
  {
    id: 'surgery_double_eyelid',
    name: '二重',
    parentId: 'surgery',
    level: 2,
    specialty: 'surgery'
  },
  {
    id: 'surgery_dark_circles',
    name: 'くま治療',
    parentId: 'surgery',
    level: 2,
    specialty: 'surgery'
  },
  {
    id: 'surgery_thread_lift',
    name: '糸リフト',
    parentId: 'surgery',
    level: 2,
    specialty: 'surgery'
  },
  {
    id: 'surgery_face_slimming',
    name: '小顔（S,BF)',
    parentId: 'surgery',
    level: 2,
    specialty: 'surgery'
  },
  {
    id: 'surgery_nose_philtrum',
    name: '鼻・人中手術',
    parentId: 'surgery',
    level: 2,
    specialty: 'surgery'
  },
  {
    id: 'surgery_body_liposuction',
    name: 'ボディー脂肪吸引',
    parentId: 'surgery',
    level: 2,
    specialty: 'surgery'
  },
  {
    id: 'surgery_breast_augmentation',
    name: '豊胸',
    parentId: 'surgery',
    level: 2,
    specialty: 'surgery'
  },
  {
    id: 'surgery_other',
    name: 'その他外科',
    parentId: 'surgery',
    level: 2,
    specialty: 'surgery'
  },

  // Level 2 - Dermatology Subcategories
  {
    id: 'dermatology_injection',
    name: '注入',
    parentId: 'dermatology',
    level: 2,
    specialty: 'dermatology'
  },
  {
    id: 'dermatology_skin',
    name: 'スキン',
    parentId: 'dermatology',
    level: 2,
    specialty: 'dermatology'
  },

  // Level 2 - Other Subcategories
  {
    id: 'other_piercing',
    name: 'ピアス',
    parentId: 'other',
    level: 2,
    specialty: 'other'
  },
  {
    id: 'other_products',
    name: '物販',
    parentId: 'other',
    level: 2,
    specialty: 'other'
  },
  {
    id: 'other_anesthesia_needle_pack',
    name: '麻酔・針・パック',
    parentId: 'other',
    level: 2,
    specialty: 'other'
  }
]

export const getCategoryById = (id: string): TreatmentCategory | undefined => {
  return TREATMENT_CATEGORIES.find(category => category.id === id)
}

export const getCategoriesByParent = (parentId: string): TreatmentCategory[] => {
  return TREATMENT_CATEGORIES.filter(category => category.parentId === parentId)
}

export const getMainCategories = (): TreatmentCategory[] => {
  return TREATMENT_CATEGORIES.filter(category => category.level === 1)
}

export const getSubcategories = (parentId: string): TreatmentCategory[] => {
  return TREATMENT_CATEGORIES.filter(category => category.parentId === parentId)
}

export const getCategoryHierarchy = () => {
  const mainCategories = getMainCategories()
  return mainCategories.map(main => ({
    ...main,
    subcategories: getSubcategories(main.id)
  }))
}

// Enhanced mapping function that works with database field names
export const categorizeTreatment = (treatmentCategory: string, treatmentName: string): { specialty: string, subcategory: string, categoryId: string } => {
  const category = (treatmentCategory || '').toLowerCase()
  const name = (treatmentName || '').toLowerCase()
  
  console.log('🔍 [TreatmentCategories] Categorizing:', { treatmentCategory, treatmentName, category, name })
  
  // Surgery category mappings
  if (name.includes('二重') || name.includes('double') || name.includes('eyelid') || category.includes('二重')) {
    return { specialty: 'surgery', subcategory: '二重', categoryId: 'surgery_double_eyelid' }
  }
  if (name.includes('くま') || name.includes('dark') || name.includes('circle') || category.includes('くま')) {
    return { specialty: 'surgery', subcategory: 'くま治療', categoryId: 'surgery_dark_circles' }
  }
  if (name.includes('糸') || name.includes('thread') || name.includes('lift') || category.includes('糸')) {
    return { specialty: 'surgery', subcategory: '糸リフト', categoryId: 'surgery_thread_lift' }
  }
  if (name.includes('小顔') || name.includes('face') || name.includes('slimming') || category.includes('小顔')) {
    return { specialty: 'surgery', subcategory: '小顔（S,BF)', categoryId: 'surgery_face_slimming' }
  }
  if (name.includes('鼻') || name.includes('人中') || name.includes('nose') || name.includes('philtrum') || category.includes('鼻') || category.includes('人中')) {
    return { specialty: 'surgery', subcategory: '鼻・人中手術', categoryId: 'surgery_nose_philtrum' }
  }
  if (name.includes('脂肪吸引') || name.includes('liposuction') || name.includes('body') || category.includes('脂肪吸引')) {
    return { specialty: 'surgery', subcategory: 'ボディー脂肪吸引', categoryId: 'surgery_body_liposuction' }
  }
  if (name.includes('豊胸') || name.includes('breast') || name.includes('augmentation') || category.includes('豊胸')) {
    return { specialty: 'surgery', subcategory: '豊胸', categoryId: 'surgery_breast_augmentation' }
  }
  
  // Dermatology category mappings
  if (name.includes('注入') || name.includes('injection') || name.includes('ボトックス') || name.includes('ヒアルロン') || category.includes('注入')) {
    return { specialty: 'dermatology', subcategory: '注入', categoryId: 'dermatology_injection' }
  }
  if (name.includes('スキン') || name.includes('skin') || name.includes('レーザー') || name.includes('laser') || category.includes('スキン')) {
    return { specialty: 'dermatology', subcategory: 'スキン', categoryId: 'dermatology_skin' }
  }
  
  // Hair removal category
  if (name.includes('脱毛') || name.includes('hair') || name.includes('removal') || category.includes('脱毛')) {
    return { specialty: 'hair_removal', subcategory: '脱毛', categoryId: 'hair_removal' }
  }
  
  // Other category mappings
  if (name.includes('ピアス') || name.includes('piercing') || category.includes('ピアス')) {
    return { specialty: 'other', subcategory: 'ピアス', categoryId: 'other_piercing' }
  }
  if (name.includes('物販') || name.includes('product') || name.includes('商品') || category.includes('物販')) {
    return { specialty: 'other', subcategory: '物販', categoryId: 'other_products' }
  }
  if (name.includes('麻酔') || name.includes('針') || name.includes('パック') || name.includes('anesthesia') || name.includes('needle') || name.includes('pack') || category.includes('麻酔') || category.includes('針') || category.includes('パック')) {
    return { specialty: 'other', subcategory: '麻酔・針・パック', categoryId: 'other_anesthesia_needle_pack' }
  }
  
  // Default to surgery other if it contains surgical keywords
  if (name.includes('手術') || name.includes('surgery') || name.includes('外科') || category.includes('手術') || category.includes('外科')) {
    return { specialty: 'surgery', subcategory: 'その他外科', categoryId: 'surgery_other' }
  }
  
  // Default to other products for unrecognized items
  return { specialty: 'other', subcategory: '物販', categoryId: 'other_products' }
}

// Legacy function for backward compatibility
export const categorizeTreatmentLegacy = (treatmentName: string): string => {
  const result = categorizeTreatment('', treatmentName)
  return result.categoryId
}

export const getSpecialtyMetrics = (data: any[], specialty: 'surgery' | 'dermatology' | 'hair_removal' | 'other') => {
  const specialtyCategories = TREATMENT_CATEGORIES.filter(cat => cat.specialty === specialty)
  const specialtyData = data.filter(record => {
    const categoryId = categorizeTreatment(record.treatmentCategory || '', record.treatmentName || '')
    return specialtyCategories.some(cat => cat.id === categoryId.categoryId)
  })
  
  const totalRevenue = specialtyData.reduce((sum, record) => sum + (record.totalWithTax || 0), 0)
  const totalCount = specialtyData.length
  const averageUnitPrice = totalCount > 0 ? totalRevenue / totalCount : 0
  
  return {
    totalRevenue,
    totalCount,
    averageUnitPrice,
    specialtyName: specialty === 'surgery' ? '外科' : 
                   specialty === 'dermatology' ? '皮膚科' :
                   specialty === 'hair_removal' ? '脱毛' : 'その他'
  }
}
