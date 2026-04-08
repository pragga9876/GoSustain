document.addEventListener('DOMContentLoaded', () => {
    setupAesthetics();
    initializeDashboard();
});

function setupAesthetics() {
    createFloatingParticles();

    const activeGlows = [];
    document.addEventListener('mousemove', e => {
        const glow = document.createElement('div');
        glow.className = 'mouse-glow';
        glow.style.left = `${e.clientX}px`;
        glow.style.top = `${e.clientY}px`;
        document.body.appendChild(glow);
        activeGlows.push(glow);

        setTimeout(() => {
            glow.remove();
            const index = activeGlows.indexOf(glow);
            if (index > -1) activeGlows.splice(index, 1);
        }, 800);

        if (activeGlows.length > 20) {
            activeGlows.shift().remove();
        }
    });
}

function createFloatingParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
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

function initializeDashboard() {
    const totalEl = document.getElementById('yourFootprintValue');
    const total = parseFloat(totalEl?.textContent) || 0;

    const breakdown = {
        travel: getCategoryValue('travel'),
        home: getCategoryValue('home'),
        food: getCategoryValue('food'),
        waste: getCategoryValue('waste')
    };

    const percentages = calculatePercentages(breakdown, total);

    const comparisonCard = document.getElementById('comparisonCard');
    if (comparisonCard) {
        const statusInfo = determineStatus(total);
        const statusText = comparisonCard.querySelector('.status-text');
        const statusDetail = comparisonCard.querySelector('.status-detail');

        if (statusText) statusText.textContent = statusInfo.text;
        if (statusDetail) statusDetail.textContent = statusInfo.detail;
        comparisonCard.className = `summary-card comparison-result ${statusInfo.status}`;
    }

    updateCategoryCards(percentages);
    drawDoughnutChart(breakdown);
    renderLegend(breakdown, total);
}

function getCategoryValue(cat) {
    const card = document.querySelector(`.category-card.${cat}`);
    if (!card) return 0;
    const valueEl = card.querySelector('.category-value');
    return parseFloat(valueEl?.textContent) || 0;
}

function calculatePercentages(data, total) {
    if (total === 0) return { travel: 0, home: 0, food: 0, waste: 0 };
    return {
        travel: Math.round((data.travel / total) * 100),
        home: Math.round((data.home / total) * 100),
        food: Math.round((data.food / total) * 100),
        waste: Math.round((data.waste / total) * 100)
    };
}

function determineStatus(total) {
    if (total < 50) return { status: 'low', text: 'Low', detail: 'Below Average' };
    if (total <= 90) return { status: 'average', text: 'Average', detail: 'Near Global Average' };
    return { status: 'high', text: 'High', detail: 'Above Average' };
}

function updateCategoryCards(percentages) {
    ['travel', 'home', 'food', 'waste'].forEach(cat => {
        const card = document.querySelector(`.category-card.${cat}`);
        if (!card) return;

        const percentEl = card.querySelector('.category-percentage');
        const progressEl = card.querySelector('.progress-fill');

        if (percentEl) percentEl.textContent = `${percentages[cat]}%`;
        if (progressEl) progressEl.style.width = `${percentages[cat]}%`;
    });
}

function drawDoughnutChart(data) {
    const ctx = document.getElementById('doughnutChart')?.getContext('2d');
    if (!ctx || typeof Chart === "undefined") return;

    const values = [data.travel, data.home, data.food, data.waste];

    if (window.doughnutChartInstance) {
        window.doughnutChartInstance.destroy();
    }

    window.doughnutChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Travel', 'Energy', 'Food', 'Waste'],
            datasets: [{
                data: values,
                backgroundColor: ['#EF4444', '#F59E0B', '#10B981', '#8B5CF6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            cutout: '68%',
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function renderLegend(data, total) {
    const legend = document.getElementById('chartLegend');
    if (!legend) return;

    const items = [
        { label: 'Travel', value: data.travel, color: '#EF4444' },
        { label: 'Energy', value: data.home, color: '#F59E0B' },
        { label: 'Food', value: data.food, color: '#10B981' },
        { label: 'Waste', value: data.waste, color: '#8B5CF6' }
    ];

    legend.innerHTML = items.map(item => {
        const pct = total ? Math.round((item.value / total) * 100) : 0;
        return `
            <div class="legend-item">
                <span class="legend-color" style="background:${item.color}; display:inline-block; width:12px; height:12px; border-radius:50%; margin-right:8px;"></span>
                <span>${item.label}: ${item.value.toFixed(1)} kg (${pct}%)</span>
            </div>
        `;
    }).join('');
}