// Medical Force API Integration
class MedicalForceAPI {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.timeout = CONFIG.API_TIMEOUT;
        this.apiKey = null; // Will be set when user provides API key
    }

    // Set API key for authentication
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
                ...options.headers
            },
            timeout: this.timeout
        };

        const requestOptions = {...defaultOptions, ...options };

        try {
            const response = await fetch(url, requestOptions);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Get patient data (来院者情報)
    async getPatientData(startDate, endDate) {
        const endpoint = `patients?start_date=${startDate}&end_date=${endDate}`;
        return await this.request(endpoint);
    }

    // Get accounting data (会計情報)
    async getAccountingData(startDate, endDate) {
        const endpoint = `accounting?start_date=${startDate}&end_date=${endDate}`;
        return await this.request(endpoint);
    }

    // Get appointment data (予約情報)
    async getAppointmentData(startDate, endDate) {
        const endpoint = `appointments?start_date=${startDate}&end_date=${endDate}`;
        return await this.request(endpoint);
    }

    // Get revenue data with complex calculations
    async getRevenueData(startDate, endDate) {
        const endpoint = `revenue?start_date=${startDate}&end_date=${endDate}`;
        return await this.request(endpoint);
    }

    // Get clinic list
    async getClinics() {
        const endpoint = 'clinics';
        return await this.request(endpoint);
    }

    // Get staff list
    async getStaff() {
        const endpoint = 'staff';
        return await this.request(endpoint);
    }

    // Get treatment categories
    async getTreatmentCategories() {
        const endpoint = 'treatment-categories';
        return await this.request(endpoint);
    }

    // Get referral sources (流入元)
    async getReferralSources() {
        const endpoint = 'referral-sources';
        return await this.request(endpoint);
    }

    // Get appointment routes (来院区分)
    async getAppointmentRoutes() {
        const endpoint = 'appointment-routes';
        return await this.request(endpoint);
    }

    // Validate data integrity
    async validateData(startDate, endDate) {
        const endpoint = `validate?start_date=${startDate}&end_date=${endDate}`;
        return await this.request(endpoint);
    }
}

// Data Processing Class
class DataProcessor {
    constructor() {
        this.patientData = [];
        this.accountingData = [];
        this.appointmentData = [];
    }

    // Process raw API data into structured format
    processPatientData(rawData) {
        return rawData.map(patient => ({
            id: patient.patient_id || patient.患者コード,
            name: patient.name || patient.氏名,
            age: parseInt(patient.age || patient.年齢) || 0,
            appointmentId: patient.appointment_id || patient.予約ID,
            treatmentCategory: patient.treatment_category || patient.施術カテゴリー,
            treatmentName: patient.treatment_name || patient.施術名,
            roomName: patient.room_name || patient.部屋名,
            isCancelled: patient.is_cancelled || patient.キャンセル有無,
            referralSource: patient.referral_source || patient.流入元,
            appointmentRoute: patient.appointment_route || patient.予約経路,
            staff: patient.staff || patient.担当者,
            visitDate: new Date(patient.visit_date || patient.来院日),
            treatmentDate: new Date(patient.treatment_date || patient.施術日)
        })).filter(patient => patient.age > 0); // Remove patients with age 0
    }

    // Process accounting data
    processAccountingData(rawData) {
        return rawData.map(account => ({
            id: account.accounting_id,
            patientId: account.patient_id || account.患者ID,
            amount: parseFloat(account.amount || account.金額) || 0,
            paymentDate: new Date(account.payment_date || account.支払い日),
            visitDate: new Date(account.visit_date || account.来院日),
            treatmentType: account.treatment_type || account.処置内容,
            isAdvancePayment: account.is_advance_payment || account.前受金,
            advancePaymentDate: account.advance_payment_date ? new Date(account.advance_payment_date) : null,
            remainingAmount: parseFloat(account.remaining_amount || account.残金) || 0
        }));
    }

    // Categorize treatment into hierarchical structure
    categorizeTreatment(treatmentCategory, treatmentName) {
        const category = CONFIG.CATEGORIES;

        // Check if it's a beauty treatment
        if (category.BEAUTY.subcategories.SURGERY.procedures.includes(treatmentName) ||
            category.BEAUTY.subcategories.DERMATOLOGY.procedures.includes(treatmentName) ||
            category.BEAUTY.subcategories.HAIR_REMOVAL.procedures.includes(treatmentName)) {

            if (category.BEAUTY.subcategories.SURGERY.procedures.includes(treatmentName)) {
                return {
                    main: '美容',
                    sub: '外科',
                    procedure: treatmentName
                };
            } else if (category.BEAUTY.subcategories.DERMATOLOGY.procedures.includes(treatmentName)) {
                return {
                    main: '美容',
                    sub: '皮膚科',
                    procedure: treatmentName
                };
            } else if (category.BEAUTY.subcategories.HAIR_REMOVAL.procedures.includes(treatmentName)) {
                return {
                    main: '美容',
                    sub: '脱毛',
                    procedure: treatmentName
                };
            }
        }

        // Check if it's an "other" treatment
        if (category.OTHER.subcategories.PIERCING.procedures.includes(treatmentName) ||
            category.OTHER.subcategories.PRODUCTS.procedures.includes(treatmentName) ||
            category.OTHER.subcategories.ANESTHESIA.procedures.includes(treatmentName)) {

            if (category.OTHER.subcategories.PIERCING.procedures.includes(treatmentName)) {
                return {
                    main: 'その他',
                    sub: 'ピアス',
                    procedure: treatmentName
                };
            } else if (category.OTHER.subcategories.PRODUCTS.procedures.includes(treatmentName)) {
                return {
                    main: 'その他',
                    sub: '物販',
                    procedure: treatmentName
                };
            } else if (category.OTHER.subcategories.ANESTHESIA.procedures.includes(treatmentName)) {
                return {
                    main: 'その他',
                    sub: '麻酔・針・パック',
                    procedure: treatmentName
                };
            }
        }

        // Default to "その他" if not categorized
        return {
            main: 'その他',
            sub: 'その他',
            procedure: treatmentName
        };
    }

    // Determine patient type (新規/既存/その他)
    determinePatientType(patient, accountingData) {
        const treatment = this.categorizeTreatment(patient.treatmentCategory, patient.treatmentName);

        // If it's an "other" treatment, don't count in new/existing
        if (treatment.main === 'その他') {
            return CONFIG.PATIENT_TYPES.OTHER;
        }

        // Check if patient has previous visits
        const previousVisits = accountingData.filter(account =>
            account.patientId === patient.id &&
            account.paymentDate < patient.visitDate
        );

        return previousVisits.length > 0 ? CONFIG.PATIENT_TYPES.EXISTING : CONFIG.PATIENT_TYPES.NEW;
    }

    // Calculate revenue metrics
    calculateRevenueMetrics(patientData, accountingData, date) {
        const dayData = {
            date: date,
            totalRevenue: 0,
            newPatients: [],
            existingPatients: [],
            otherPatients: [],
            sameDayNewAverage: 0,
            newAverage: 0,
            existingAverage: 0
        };

        // Filter data for the specific date
        const dayPatients = patientData.filter(patient =>
            this.isSameDay(patient.visitDate, date)
        );

        const dayAccounting = accountingData.filter(account =>
            this.isSameDay(account.paymentDate, date)
        );

        // Process each patient
        dayPatients.forEach(patient => {
            const patientType = this.determinePatientType(patient, accountingData);
            const patientAccounting = dayAccounting.filter(account =>
                account.patientId === patient.id
            );

            if (patientType === CONFIG.PATIENT_TYPES.NEW) {
                dayData.newPatients.push({
                    patient: patient,
                    accounting: patientAccounting,
                    sameDayAmount: patientAccounting.reduce((sum, acc) => sum + acc.amount, 0),
                    totalAmount: this.calculateTotalAmount(patient.id, accountingData)
                });
            } else if (patientType === CONFIG.PATIENT_TYPES.EXISTING) {
                dayData.existingPatients.push({
                    patient: patient,
                    accounting: patientAccounting,
                    sameDayAmount: patientAccounting.reduce((sum, acc) => sum + acc.amount, 0),
                    totalAmount: this.calculateTotalAmount(patient.id, accountingData)
                });
            } else {
                dayData.otherPatients.push({
                    patient: patient,
                    accounting: patientAccounting,
                    sameDayAmount: patientAccounting.reduce((sum, acc) => sum + acc.amount, 0)
                });
            }
        });

        // Calculate totals
        dayData.totalRevenue = dayAccounting.reduce((sum, account) => sum + account.amount, 0);

        // Calculate averages
        if (dayData.newPatients.length > 0) {
            dayData.sameDayNewAverage = dayData.newPatients.reduce((sum, p) => sum + p.sameDayAmount, 0) / dayData.newPatients.length;
            dayData.newAverage = dayData.newPatients.reduce((sum, p) => sum + p.totalAmount, 0) / dayData.newPatients.length;
        }

        if (dayData.existingPatients.length > 0) {
            dayData.existingAverage = dayData.existingPatients.reduce((sum, p) => sum + p.totalAmount, 0) / dayData.existingPatients.length;
        }

        return dayData;
    }

    // Helper methods
    isSameDay(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }

    calculateTotalAmount(patientId, accountingData) {
        return accountingData
            .filter(account => account.patientId === patientId)
            .reduce((sum, account) => sum + account.amount, 0);
    }

    // Validate data integrity
    validateData(patientData, accountingData) {
        const errors = [];

        patientData.forEach((patient, index) => {
            if (!patient.id) {
                errors.push({
                    type: 'MISSING_PATIENT_CODE',
                    message: CONFIG.ERROR_MESSAGES.MISSING_PATIENT_CODE,
                    row: index + 1,
                    data: patient
                });
            }

            if (patient.age === 0) {
                errors.push({
                    type: 'MISSING_AGE',
                    message: CONFIG.ERROR_MESSAGES.MISSING_AGE,
                    row: index + 1,
                    data: patient
                });
            }

            if (!patient.referralSource) {
                errors.push({
                    type: 'MISSING_REFERRAL_SOURCE',
                    message: CONFIG.ERROR_MESSAGES.MISSING_REFERRAL_SOURCE,
                    row: index + 1,
                    data: patient
                });
            }

            if (!patient.appointmentRoute) {
                errors.push({
                    type: 'MISSING_APPOINTMENT_ROUTE',
                    message: CONFIG.ERROR_MESSAGES.MISSING_APPOINTMENT_ROUTE,
                    row: index + 1,
                    data: patient
                });
            }

            if (!patient.treatmentCategory) {
                errors.push({
                    type: 'MISSING_TREATMENT_CATEGORY',
                    message: CONFIG.ERROR_MESSAGES.MISSING_TREATMENT_CATEGORY,
                    row: index + 1,
                    data: patient
                });
            }

            if (!patient.staff) {
                errors.push({
                    type: 'MISSING_STAFF',
                    message: CONFIG.ERROR_MESSAGES.MISSING_STAFF,
                    row: index + 1,
                    data: patient
                });
            }
        });

        return errors;
    }
}

// Export classes
window.MedicalForceAPI = MedicalForceAPI;
window.DataProcessor = DataProcessor;