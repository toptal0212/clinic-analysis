// Medical Force Sales Analysis Tool - Main JavaScript

// Global variables
let api = null;
let dataProcessor = null;
let currentData = {
    patients: [],
    accounting: [],
    appointments: []
};

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
});

function initializeApp() {
    // Initialize API and data processor
    api = new MedicalForceAPI();
    dataProcessor = new DataProcessor();

    // Initialize UI components
    initializeModal();
    initializeTabs();
    initializeDateSelectors();
    initializeCharts();

    // Initialize event listeners
    initializeEventListeners();

    // Show API connection modal on startup
    showApiModal();
}

function initializeModal() {
    const modal = document.getElementById('apiModal');
    const connectBtn = document.getElementById('connectApiBtn');
    const closeBtn = document.getElementById('closeApiModal');
    const cancelBtn = document.getElementById('cancelApi');
    const connectApiBtn = document.getElementById('connectApi');
    const useCsvCheckbox = document.getElementById('useCsvImport');
    const csvUpload = document.getElementById('csvUpload');

    // Show modal
    connectBtn.addEventListener('click', () => {
        modal.classList.add('show');
    });

    // Close modal
    closeBtn.addEventListener('click', hideApiModal);
    cancelBtn.addEventListener('click', hideApiModal);

    // Connect API
    connectApiBtn.addEventListener('click', handleApiConnection);

    // Toggle CSV upload
    useCsvCheckbox.addEventListener('change', (e) => {
        csvUpload.style.display = e.target.checked ? 'block' : 'none';
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideApiModal();
        }
    });
}

function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            // Remove active class from all tabs and panels
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            // Add active class to clicked tab and corresponding panel
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

function initializeDateSelectors() {
    const salesPeriod = document.getElementById('salesPeriod');
    const customDateRange = document.getElementById('customDateRange');

    salesPeriod.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            customDateRange.style.display = 'flex';
        } else {
            customDateRange.style.display = 'none';
            updateDataForPeriod(e.target.value);
        }
    });

    // Set default dates
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    document.getElementById('startDate').value = startOfMonth.toISOString().split('T')[0];
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
}

function initializeCharts() {
    // Initialize daily revenue chart
    initializeDailyRevenueChart();

    // Initialize repeat rate chart
    initializeRepeatRateChart();
}

function initializeEventListeners() {
    // Daily chart filter
    const dailyChartFilter = document.getElementById('dailyChartFilter');
    if (dailyChartFilter) {
        dailyChartFilter.addEventListener('change', updateDailyChart);
    }

    // Breakdown card clicks
    const breakdownCards = document.querySelectorAll('.breakdown-card');
    breakdownCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.getAttribute('data-category');
            showDrillDown(category);
        });
    });

    // Drill down button
    const drillDownBtn = document.getElementById('drillDownBtn');
    if (drillDownBtn) {
        drillDownBtn.addEventListener('click', () => {
            showDrillDown('all');
        });
    }
}

// API Connection Functions
function showApiModal() {
    const modal = document.getElementById('apiModal');
    modal.classList.add('show');
}

function hideApiModal() {
    const modal = document.getElementById('apiModal');
    modal.classList.remove('show');
}

async function handleApiConnection() {
    const apiKey = document.getElementById('apiKey').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const useCsv = document.getElementById('useCsvImport').checked;

    if (!apiKey && !useCsv) {
        alert('API KeyまたはCSVファイルを選択してください');
        return;
    }

    if (!startDate || !endDate) {
        alert('開始日と終了日を入力してください');
        return;
    }

    try {
        if (useCsv) {
            await handleCsvImport();
        } else {
            await connectToApi(apiKey, startDate, endDate);
        }

        hideApiModal();
        updateApiStatus(true);
        await loadData(startDate, endDate);
    } catch (error) {
        console.error('Connection failed:', error);
        alert('接続に失敗しました: ' + error.message);
    }
}

async function connectToApi(apiKey, startDate, endDate) {
    api.setApiKey(apiKey);

    // Test API connection
    await api.getClinics();

    // Store connection info
    localStorage.setItem('mf_api_key', apiKey);
    localStorage.setItem('mf_start_date', startDate);
    localStorage.setItem('mf_end_date', endDate);
}

async function handleCsvImport() {
    const patientFile = document.getElementById('patientCsv').files[0];
    const accountingFile = document.getElementById('accountingCsv').files[0];

    if (!patientFile || !accountingFile) {
        alert('来院者情報CSVと会計情報CSVの両方を選択してください');
        return;
    }

    try {
        const patientData = await parseCsvFile(patientFile);
        const accountingData = await parseCsvFile(accountingFile);

        currentData.patients = dataProcessor.processPatientData(patientData);
        currentData.accounting = dataProcessor.processAccountingData(accountingData);

        // Validate data
        const errors = dataProcessor.validateData(currentData.patients, currentData.accounting);
        if (errors.length > 0) {
            showDataValidationErrors(errors);
        }

        updateDashboard();
    } catch (error) {
        console.error('CSV import failed:', error);
        alert('CSVファイルの読み込みに失敗しました: ' + error.message);
    }
}

function parseCsvFile(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    reject(new Error('CSV解析エラー: ' + results.errors[0].message));
                } else {
                    resolve(results.data);
                }
            },
            error: (error) => {
                reject(error);
            }
        });
    });
}

async function loadData(startDate, endDate) {
    try {
        showLoadingState();

        // Load data from API
        const [patientData, accountingData, appointmentData] = await Promise.all([
            api.getPatientData(startDate, endDate),
            api.getAccountingData(startDate, endDate),
            api.getAppointmentData(startDate, endDate)
        ]);

        // Process data
        currentData.patients = dataProcessor.processPatientData(patientData);
        currentData.accounting = dataProcessor.processAccountingData(accountingData);
        currentData.appointments = appointmentData;

        // Validate data
        const errors = dataProcessor.validateData(currentData.patients, currentData.accounting);
        if (errors.length > 0) {
            showDataValidationErrors(errors);
        }

        updateDashboard();
        hideLoadingState();
    } catch (error) {
        console.error('Data loading failed:', error);
        hideLoadingState();
        alert('データの読み込みに失敗しました: ' + error.message);
    }
}

function updateApiStatus(connected) {
    const statusElement = document.getElementById('apiStatus');
    const statusText = statusElement.querySelector('span');
    const statusIcon = statusElement.querySelector('i');

    if (connected) {
        statusElement.classList.add('connected');
        statusText.textContent = 'API接続済み';
    } else {
        statusElement.classList.remove('connected');
        statusText.textContent = 'API未接続';
    }
}

// Daily Revenue Chart
function initializeDailyRevenueChart() {
    const ctx = document.getElementById('dailyRevenueChart');
    if (!ctx) return;

    const chartCtx = ctx.getContext('2d');

    new Chart(chartCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '日別売上',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f1f5f9'
                    },
                    ticks: {
                        callback: function(value) {
                            return '¥' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Demographics Chart
function initializeDemographicsChart() {
    const ctx = document.getElementById('demographicsChart').getContext('2d');

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Adults (18-65)', 'Seniors (65+)', 'Children (0-17)'],
            datasets: [{
                data: [45, 35, 20],
                backgroundColor: [
                    '#667eea',
                    '#764ba2',
                    '#f093fb'
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

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));

            // Add active class to clicked link
            this.classList.add('active');

            // Here you would typically load different content
            console.log('Navigating to:', this.getAttribute('href'));
        });
    });
}

// Time filter functionality
function initializeTimeFilter() {
    const timeFilter = document.querySelector('.time-filter');

    timeFilter.addEventListener('change', function() {
        const selectedPeriod = this.value;
        console.log('Time period changed to:', selectedPeriod);

        // Here you would typically update the charts with new data
        updateChartData(selectedPeriod);
    });
}

// Generate sample data
function generateDateLabels(days) {
    const labels = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }

    return labels;
}

function generateRevenueData(days) {
    const data = [];
    let baseRevenue = 3000;

    for (let i = 0; i < days; i++) {
        // Add some randomness and trend
        const variation = (Math.random() - 0.5) * 1000;
        const trend = Math.sin(i / 7) * 200; // Weekly pattern
        const revenue = Math.max(1000, baseRevenue + variation + trend);
        data.push(Math.round(revenue));
    }

    return data;
}

// Update chart data based on time period
function updateChartData(period) {
    let days;
    switch (period) {
        case '7d':
            days = 7;
            break;
        case '30d':
            days = 30;
            break;
        case '90d':
            days = 90;
            break;
        case '1y':
            days = 365;
            break;
        default:
            days = 30;
    }

    // In a real application, you would fetch new data from an API
    console.log(`Updating chart data for ${days} days`);
}

// Update stats with animation
function updateStats() {
    const statValues = document.querySelectorAll('.stat-value');

    statValues.forEach(stat => {
        const finalValue = stat.textContent;
        const numericValue = parseFloat(finalValue.replace(/[^0-9.-]+/g, ''));

        if (!isNaN(numericValue)) {
            animateNumber(stat, 0, numericValue, 2000, finalValue);
        }
    });
}

// Animate number counting
function animateNumber(element, start, end, duration, originalText) {
    const startTime = performance.now();
    const isCurrency = originalText.includes('$');
    const isPercentage = originalText.includes('%');

    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = start + (end - start) * easeOutQuart;

        let displayValue;
        if (isCurrency) {
            displayValue = '$' + Math.round(current).toLocaleString();
        } else if (isPercentage) {
            displayValue = Math.round(current * 10) / 10 + '%';
        } else {
            displayValue = Math.round(current).toLocaleString();
        }

        element.textContent = displayValue;

        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }

    requestAnimationFrame(updateNumber);
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

// Export functions for potential use in other modules
window.ClinicAnalysis = {
    updateChartData,
    formatCurrency,
    formatDate,
    generateRevenueData
};