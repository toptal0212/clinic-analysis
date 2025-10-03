// Medical Force API Configuration
const CONFIG = {
    // API Configuration
    API_BASE_URL: 'https://api.medical-force.com/',
    API_TIMEOUT: 30000,

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
        MISSING_PATIENT_CODE: '患者コードが空欄です',
        MISSING_AGE: '年齢が0または空欄です',
        MISSING_REFERRAL_SOURCE: '流入元（知ったきっかけ）が空欄です',
        MISSING_APPOINTMENT_ROUTE: '予約経路（来院区分）が空欄です',
        MISSING_TREATMENT_CATEGORY: '施術カテゴリーが空欄です',
        MISSING_TREATMENT_NAME: '施術名が空欄です',
        MISSING_STAFF: '担当者が空欄です',
        INVALID_TREATMENT_CATEGORY: '施術内容が該当カテゴリーにありません',
        DATA_MISMATCH: '流入経路別の総計と来院数総計が合いません'
    },

    // UI Settings
    UI: {
        CHART_COLORS: {
            SURGERY: '#667eea',
            DERMATOLOGY: '#764ba2',
            HAIR_REMOVAL: '#f093fb',
            OTHER: '#ffd93d',
            NEW_PATIENT: '#10b981',
            EXISTING_PATIENT: '#3b82f6',
            OTHER_PATIENT: '#f59e0b'
        },
        REFRESH_INTERVAL: 300000, // 5 minutes
        ANIMATION_DURATION: 300
    }
};

// Export for use in other modules
window.CONFIG = CONFIG;