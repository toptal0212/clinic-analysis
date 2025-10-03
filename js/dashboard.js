// Dashboard Update Functions
function updateDashboard() {
    if (currentData.patients.length === 0 || currentData.accounting.length === 0) {
        return;
    }

    // Calculate revenue metrics
    const metrics = calculateRevenueMetrics();

    // Update summary cards
    updateSummaryCards(metrics);

    // Update category breakdown
    updateCategoryBreakdown(metrics);

    // Update charts
    updateDailyRevenueChart(metrics);
}

function calculateRevenueMetrics() {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);

    const metrics = {
        totalRevenue: 0,
        visitBasedRevenue: 0,
        paymentBasedRevenue: 0,
        newPatients: [],
        existingPatients: [],
        otherPatients: [],
        newSameDayAverage: 0,
        newAverage: 0,
        existingAverage: 0,
        categoryBreakdown: {
            beauty: { revenue: 0, count: 0, surgery: 0, dermatology: 0, hairRemoval: 0 },
            other: { revenue: 0, count: 0, piercing: 0, products: 0, anesthesia: 0 }
        },
        dailyRevenue: []
    };

    // Process each day in the date range
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dayMetrics = dataProcessor.calculateRevenueMetrics(
            currentData.patients,
            currentData.accounting,
            new Date(date)
        );

        metrics.dailyRevenue.push(dayMetrics);
        metrics.totalRevenue += dayMetrics.totalRevenue;

        // Categorize patients
        dayMetrics.newPatients.forEach(patient => {
            metrics.newPatients.push(patient);
            const category = dataProcessor.categorizeTreatment(
                patient.patient.treatmentCategory,
                patient.patient.treatmentName
            );
            updateCategoryMetrics(metrics.categoryBreakdown, category, patient.totalAmount);
        });

        dayMetrics.existingPatients.forEach(patient => {
            metrics.existingPatients.push(patient);
            const category = dataProcessor.categorizeTreatment(
                patient.patient.treatmentCategory,
                patient.patient.treatmentName
            );
            updateCategoryMetrics(metrics.categoryBreakdown, category, patient.totalAmount);
        });

        dayMetrics.otherPatients.forEach(patient => {
            metrics.otherPatients.push(patient);
            const category = dataProcessor.categorizeTreatment(
                patient.patient.treatmentCategory,
                patient.patient.treatmentName
            );
            updateCategoryMetrics(metrics.categoryBreakdown, category, patient.sameDayAmount);
        });
    }

    // Calculate averages
    if (metrics.newPatients.length > 0) {
        metrics.newSameDayAverage = metrics.newPatients.reduce((sum, p) => sum + p.sameDayAmount, 0) / metrics.newPatients.length;
        metrics.newAverage = metrics.newPatients.reduce((sum, p) => sum + p.totalAmount, 0) / metrics.newPatients.length;
    }

    if (metrics.existingPatients.length > 0) {
        metrics.existingAverage = metrics.existingPatients.reduce((sum, p) => sum + p.totalAmount, 0) / metrics.existingPatients.length;
    }

    return metrics;
}

function updateCategoryMetrics(breakdown, category, amount) {
    if (category.main === '美容') {
        breakdown.beauty.revenue += amount;
        breakdown.beauty.count++;

        if (category.sub === '外科') {
            breakdown.beauty.surgery += amount;
        } else if (category.sub === '皮膚科') {
            breakdown.beauty.dermatology += amount;
        } else if (category.sub === '脱毛') {
            breakdown.beauty.hairRemoval += amount;
        }
    } else {
        breakdown.other.revenue += amount;
        breakdown.other.count++;

        if (category.sub === 'ピアス') {
            breakdown.other.piercing += amount;
        } else if (category.sub === '物販') {
            breakdown.other.products += amount;
        } else if (category.sub === '麻酔・針・パック') {
            breakdown.other.anesthesia += amount;
        }
    }
}

function updateSummaryCards(metrics) {
    // Total Revenue
    document.getElementById('totalRevenue').textContent = formatCurrency(metrics.totalRevenue);
    document.getElementById('visitBasedRevenue').textContent = formatCurrency(metrics.visitBasedRevenue);
    document.getElementById('paymentBasedRevenue').textContent = formatCurrency(metrics.paymentBasedRevenue);

    // New Patients
    document.getElementById('newPatientCount').textContent = metrics.newPatients.length;
    document.getElementById('newSameDayAverage').textContent = formatCurrency(metrics.newSameDayAverage);
    document.getElementById('newAverage').textContent = formatCurrency(metrics.newAverage);

    // Existing Patients
    document.getElementById('existingPatientCount').textContent = metrics.existingPatients.length;
    document.getElementById('existingAverage').textContent = formatCurrency(metrics.existingAverage);

    // Other Patients
    document.getElementById('otherPatientCount').textContent = metrics.otherPatients.length;
    document.getElementById('otherRevenue').textContent = formatCurrency(metrics.categoryBreakdown.other.revenue);
}

function updateCategoryBreakdown(metrics) {
    const breakdown = metrics.categoryBreakdown;

    // Beauty category
    document.getElementById('beautyRevenue').textContent = formatCurrency(breakdown.beauty.revenue);
    document.getElementById('beautyCount').textContent = breakdown.beauty.count + '件';
    document.getElementById('surgeryRevenue').textContent = formatCurrency(breakdown.beauty.surgery);
    document.getElementById('dermatologyRevenue').textContent = formatCurrency(breakdown.beauty.dermatology);
    document.getElementById('hairRemovalRevenue').textContent = formatCurrency(breakdown.beauty.hairRemoval);

    // Other category
    document.getElementById('otherCategoryRevenue').textContent = formatCurrency(breakdown.other.revenue);
    document.getElementById('otherCategoryCount').textContent = breakdown.other.count + '件';
    document.getElementById('piercingRevenue').textContent = formatCurrency(breakdown.other.piercing);
    document.getElementById('productsRevenue').textContent = formatCurrency(breakdown.other.products);
    document.getElementById('anesthesiaRevenue').textContent = formatCurrency(breakdown.other.anesthesia);
}

function updateDailyRevenueChart(metrics) {
    const chart = Chart.getChart('dailyRevenueChart');
    if (!chart) return;

    const labels = metrics.dailyRevenue.map(day =>
        day.date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
    );
    const data = metrics.dailyRevenue.map(day => day.totalRevenue);

    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
}

// Utility Functions
function formatCurrency(amount) {
    return '¥' + Math.round(amount).toLocaleString();
}

function showLoadingState() {
    // Add loading spinner or overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loadingOverlay';
    loadingOverlay.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                    background: rgba(0,0,0,0.5); display: flex; align-items: center; 
                    justify-content: center; z-index: 9999;">
            <div style="background: white; padding: 2rem; border-radius: 0.5rem; text-align: center;">
                <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; 
                            border-top: 4px solid #3498db; border-radius: 50%; 
                            animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                <p>データを読み込み中...</p>
            </div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    document.body.appendChild(loadingOverlay);
}

function hideLoadingState() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

function showDataValidationErrors(errors) {
    const errorMessage = errors.map(error =>
        `行 ${error.row}: ${error.message}`
    ).join('\n');

    alert('データ検証エラー:\n' + errorMessage);
}

function showDrillDown(category) {
    // Implement drill-down functionality
    console.log('Drill down for category:', category);
    // This would show detailed breakdown for the selected category
}

function updateDataForPeriod(period) {
    const today = new Date();
    let startDate, endDate;

    switch (period) {
        case 'today':
            startDate = endDate = today;
            break;
        case 'week':
            startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            endDate = today;
            break;
        case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = today;
            break;
        case 'quarter':
            const quarter = Math.floor(today.getMonth() / 3);
            startDate = new Date(today.getFullYear(), quarter * 3, 1);
            endDate = today;
            break;
        case 'year':
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = today;
            break;
    }

    if (startDate && endDate) {
        loadData(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
    }
}

// Initialize repeat rate chart
function initializeRepeatRateChart() {
    const ctx = document.getElementById('repeatRateChart');
    if (!ctx) return;

    const chartCtx = ctx.getContext('2d');

    new Chart(chartCtx, {
        type: 'doughnut',
        data: {
            labels: ['6ヶ月リピート', '12ヶ月リピート', '新規のみ'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    '#10b981',
                    '#3b82f6',
                    '#f59e0b'
                ],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}