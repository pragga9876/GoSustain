//=====================================================================
// 1. PAGE INITIALIZATION
//=====================================================================

document.addEventListener('DOMContentLoaded', () => {
    setupAesthetics();
    initializeDashboard();
});

//=====================================================================
// 2. AESTHETICS & EFFECTS
//=====================================================================

function setupAesthetics() {
    createFloatingParticles();

    // Mouse trail glow effect (limit number of active glows)
    const activeGlows = [];
    document.addEventListener('mousemove', e => {
        const glow = document.createElement('div');
        glow.className = 'mouse-glow';
        glow.style.left = `${e.clientX}px`;
        glow.style.top = `${e.clientY}px`;
        document.body.appendChild(glow);
        activeGlows.push(glow);

        // Remove after 800ms
        setTimeout(() => {
            glow.remove();
            const index = activeGlows.indexOf(glow);
            if (index > -1) activeGlows.splice(index, 1);
        }, 800);

        // Limit maximum glows to 20
        if (activeGlows.length > 20) {
            activeGlows.shift().remove();
        }
    });
}

function createFloatingParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    // Prevent duplicate particles
    if (container.childElementCount > 0) return;

    for (let i = 0; i < 15; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = Math.random() * 5 + 3;
        p.style.width = p.style.height = `${size}px`;
        p.style.left = `${Math.random() * 100}%`;
        p.style.animationDuration = `${15 + Math.random() * 10}s`;
        p.style.animationDelay = `${Math.random() * 15}s`;
        container.appendChild(p);
    }
}

//=====================================================================
// 3. DASHBOARD INITIALIZATION
//=====================================================================

function initializeDashboard() {
    const totalEl = document.getElementById('yourFootprintValue');
    const chartCenterValue = document.getElementById('chartCenterValue');

    // Read server-rendered values
    const total = parseFloat(totalEl?.textContent) || 0;

    const breakdownEls = document.querySelectorAll('.category-card');
    const breakdown = {};
    breakdownEls.forEach(card => {
        const cat = card.classList[1]; // travel, energy, food, waste
        const valueEl = card.querySelector('.category-value');
        breakdown[cat] = parseFloat(valueEl?.textContent) || 0;
    });

    const percentages = calculatePercentages(breakdown, total);

    // Update summary cards (status)
    const comparisonCard = document.getElementById('comparisonCard');
    if (comparisonCard) {
        const statusInfo = determineStatus(total);
        comparisonCard.querySelector('.status-text').textContent = statusInfo.text;
        comparisonCard.querySelector('.status-detail').textContent = statusInfo.detail;
        comparisonCard.className = `summary-card comparison-result ${statusInfo.status}`;
    }

    // Update category cards progress bar & percentage
    updateCategoryCards(breakdown, percentages);

    // Doughnut Chart
    drawDoughnutChart(breakdown);

    // Insights and badges are already rendered by server, no overwrite needed
}

//=====================================================================
// 4. UTILS
//=====================================================================

function calculatePercentages(data, total) {
    if (total === 0) return { travel: 0, energy: 0, food: 0, waste: 0 };
    const percentages = {};
    for (let key in data) {
        percentages[key] = Math.round((data[key] / total) * 100);
    }
    return percentages;
}

function determineStatus(total) {
    if (total < 50) return { status: 'low', text: 'Low', detail: 'Below Average' };
    if (total <= 90) return { status: 'average', text: 'Average', detail: 'Near Global Average' };
    return { status: 'high', text: 'High', detail: 'Above Average' };
}

//=====================================================================
// 5. CATEGORY CARDS
//=====================================================================

function updateCategoryCards(data, percentages) {
    ['travel', 'energy', 'food', 'waste'].forEach(cat => {
        const card = document.querySelector(`.category-card.${cat}`);
        if (!card) return;
        const percentEl = card.querySelector('.category-percentage');
        const progressEl = card.querySelector('.progress-fill');

        if (percentEl) percentEl.textContent = `${percentages[cat]}%`;
        if (progressEl) progressEl.style.width = `${percentages[cat]}%`;
    });
}

//=====================================================================
// 6. DOUGHNUT CHART
//=====================================================================

function drawDoughnutChart(data) {
    const ctx = document.getElementById('doughnutChart')?.getContext('2d');
    if (!ctx) return;

    const values = ['travel', 'energy', 'food', 'waste'].map(cat => parseFloat(data[cat]) || 0);

    // Destroy previous chart instance if exists
    if (window.doughnutChartInstance) {
        window.doughnutChartInstance.destroy();
    }

    window.doughnutChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Travel', 'Energy', 'Food', 'Waste'],
            datasets: [{
                data: values,
                backgroundColor: ['#EF4444', '#F59E0B', '#10B981', '#8B5CF6']
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}
