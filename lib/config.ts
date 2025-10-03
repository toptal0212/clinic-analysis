// Configuration for Medical Force Dashboard
export const CONFIG = {
  // API Configuration
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.medical-force.com/',
  API_TIMEOUT: 30000,
  
  // OAuth2 Configuration
  OAUTH2_TOKEN_ENDPOINT: '/token',
  OAUTH2_GRANT_TYPE: 'client_credentials',
  
  // Default OAuth2 Credentials (for testing)
  DEFAULT_CLIENT_ID: '74kgoefn8h2pbslk8qo50j99to',
  DEFAULT_CLIENT_SECRET: '1r19ivhqj4tsmqbs75m03vm6fk9iedk63n52b0n7og77lt9d56g0',
  
  // CSV Import Settings
  MAX_CSV_SIZE: parseInt(process.env.NEXT_PUBLIC_MAX_CSV_SIZE || '10485760'), // 10MB
  SUPPORTED_CSV_ENCODING: process.env.NEXT_PUBLIC_SUPPORTED_CSV_ENCODING || 'UTF-8',
  
  // Data Categories - Hierarchical Structure
  CATEGORIES: {
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
  },

  // Patient Types
  PATIENT_TYPES: {
    NEW: '新規',
    EXISTING: '既存',
    OTHER: 'その他'
  },

  // Revenue Calculation Rules
  REVENUE_RULES: {
    // 当日新規単価 = 当日に新規受け取り金額の単価
    SAME_DAY_NEW_AVERAGE: 'same_day_new',
    // 新規単価 = 予約金と後日残金を合算して一件と考えたときの新規の売り上げ単価
    NEW_AVERAGE: 'new_average',
    // 既存単価 = 既存患者の単価
    EXISTING_AVERAGE: 'existing_average'
  },

  // CSV Import Settings
  CSV_SETTINGS: {
    ENCODING: 'UTF-8',
    DELIMITER: ',',
    HEADER_ROWS: 1
  },

  // Error Messages
  ERROR_MESSAGES: {
    API_CONNECTION_FAILED: 'API接続に失敗しました',
    INVALID_API_KEY: '無効なAPI Keyです',
    CSV_PARSE_ERROR: 'CSVファイルの解析に失敗しました',
    MISSING_REQUIRED_FIELD: '必須フィールドが不足しています',
    INVALID_DATE_FORMAT: '無効な日付形式です',
    DATA_VALIDATION_FAILED: 'データ検証に失敗しました'
  },

  // UI Settings
  UI: {
    ITEMS_PER_PAGE: 100,
    REFRESH_INTERVAL: 300000, // 5 minutes
    DEBOUNCE_DELAY: 300
  }
} as const

export type Config = typeof CONFIG
