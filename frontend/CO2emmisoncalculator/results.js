//=====================================================================
// 1. PAGE INITIALIZATION
//=====================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Set up all visual effects
    setupAesthetics();
    // Fetch data and populate the page
    loadAndDisplayResults();
});

/**
 * Sets up all non-data-related visual effects like particles and observers.
 */
function setupAesthetics() {
    createFloatingParticles();

    // Add mouse trail effect
    document.addEventListener('mousemove', (e) => {
        const glow = document.createElement('div');
        glow.style.position = 'fixed';
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
        glow.style.width = '3px';
        glow.style.height = '3px';
        glow.style.background = 'rgba(16, 185, 129, 0.3)';
        glow.style.borderRadius = '50%';
        glow.style.pointerEvents = 'none';
        glow.style.transform = 'translate(-50%, -50%)';
        glow.style.animation = 'float 0.8s ease-out forwards';
        glow.style.zIndex = '9999';
        document.body.appendChild(glow);
        
        setTimeout(() => glow.remove(), 800);
    });

    // Add dynamic glow effects on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // entry.target.style.animation += ', glow 3s ease-in-out infinite';
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('.summary-card, .category-card, .insight-card, .badge-card').forEach(card => {
        observer.observe(card);
    });
}

/**
 * Main function to fetch data and update all UI components.
 */
async function loadAndDisplayResults() {
    // Priority 1: Check URL parameters
    let data = getURLParameters();
    
    // Priority 2: Check for user session/API data
    if (data.total === 0 && data.travel === 0 && data.energy === 0 && data.food === 0 && data.waste === 0) {
        const userId = getCurrentUserId(); // Backend integration point
        if (userId) {
            data = await BackendAPI.fetchUserResults(userId);
        } else {
            data = BackendAPI.getMockData(); // Fallback to mock
        }
    }
    
    const percentages = calculatePercentages(data);

    // --- Update all UI components ---

    // 1. Summary Cards
    updateSummaryCards(data);

    // 2. Doughnut Chart
    document.getElementById('chartCenterValue').textContent = data.total.toFixed(1);
    const canvas = document.getElementById('doughnutChart');
    setTimeout(() => {
        drawDoughnutChart(canvas, data, percentages);
    }, 300);
    updateChartLegend(data, percentages);

    // 3. Category Cards
    setTimeout(() => {
        updateCategoryCards(data, percentages); 
    }, 1000);

    // 4. Comparison Bars
    updateComparisonBars(data.total);
    
    // 5. Badges
    const badges = generateBadges(data);
    setTimeout(() => {
        renderBadges(badges);
    }, 1200);

    // 6. AI Insights (FIX APPLIED)
    updateInsights(data, percentages); 

    // 7. Save results (optional)
    const userId = getCurrentUserId();
    if (userId && !getURLParameters().total) { // Only save if data wasn't from URL
        BackendAPI.saveResults(userId, data);
    }
}

//=====================================================================
// 2. BACKEND API INTEGRATION
//=====================================================================

/* * API DOCUMENTATION FOR BACKEND DEVELOPERS
 * * Expected data format for results display:
 * {
 * total: "number (tons CO2e per year)",
 * travel: "number (tons CO2e per year)",
 * energy: "number (tons CO2e per year)", 
 * food: "number (tons CO2e per year)",
 * waste: "number (tons CO2e per year)"
 * }
 * * URL parameter format for direct access:
 * results.html?total=18.2&travel=6.1&energy=5.5&food=4.6&waste=2.0
 * * Expected API endpoints:
 * GET: "/api/carbon-footprint/{userId}" - Returns user's carbon footprint data
 * POST: "/api/carbon-footprint/save" - Saves calculated results
 */
const BackendAPI = {
    /**
     * Mock data for development.
     */
    getMockData: () => ({
        total: 18.2,
        travel: 6.1,
        energy: 5.5,
        food: 4.6,
        waste: 2.0
    }),
    
    /**
     * Fetches user results from the backend.
     * @param {string} userId - The ID of the user.
     * @returns {Promise<object>} - The user's footprint data.
     */
    fetchUserResults: async (userId) => {
        try {
            // REAL IMPLEMENTATION:
            // const response = await fetch(`/api/carbon-footprint/${userId}`);
            // if (!response.ok) throw new Error('Failed to fetch data');
            // return await response.json();
            
            // MOCK IMPLEMENTATION:
            console.log(`Fetching results for user ${userId} (mock)...`);
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
            return BackendAPI.getMockData();
        } catch (error) {
            console.error('Error fetching carbon footprint data:', error);
            return BackendAPI.getMockData(); // Fallback to mock
        }
    },
    
    /**
     * Saves user results to the backend.
     * @param {string} userId - The ID of the user.
     * @param {object} results - The results data object to save.
     */
    saveResults: async (userId, results) => {
        try {
            // REAL IMPLEMENTATION:
            // const response = await fetch('/api/carbon-footprint/save', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ userId, results })
            // });
            // if (!response.ok) throw new Error('Failed to save data');
            // return await response.json();
            
            // MOCK IMPLEMENTATION:
            console.log('Results saved (mock):', { userId, results });
        } catch (error) {
            console.error('Error saving results:', error);
        }
    }
};

/**
 * Gets the current user's ID from session/storage.
 * @returns {string|null} - The user ID or null if not found.
 */
function getCurrentUserId() {
    
    return null;
}

//=====================================================================
// 3. DATA PROCESSING & UI HELPERS
//=====================================================================

/**
 * Parses URL parameters to get footprint data.
 * @returns {object} - An object with total, travel, energy, food, and waste values.
 */
function getURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        total: parseFloat(urlParams.get('total')) || 0,
        travel: parseFloat(urlParams.get('travel')) || 0,
        energy: parseFloat(urlParams.get('energy')) || 0,
        food: parseFloat(urlParams.get('food')) || 0,
        waste: parseFloat(urlParams.get('waste')) || 0
    };
}

/**
 * Calculates percentages for each category.
 * @param {object} data - The footprint data object.
 * @returns {object} - An object with percentages for each category.
 */
function calculatePercentages(data) {
    const total = data.total || (data.travel + data.energy + data.food + data.waste);
    if (total === 0) {
        return { travel: 0, energy: 0, food: 0, waste: 0 };
    }
    return {
        travel: Math.round((data.travel / total) * 100),
        energy: Math.round((data.energy / total) * 100),
        food: Math.round((data.food / total) * 100),
        waste: Math.round((data.waste / total) * 100)
    };
}

/**
 * Updates the summary cards (Your Footprint, Status).
 * @param {object} data - The footprint data object.
 */
function updateSummaryCards(data) {
    document.getElementById('yourFootprintValue').textContent = data.total.toFixed(1);
    
    const statusInfo = determineStatus(data.total);
    const comparisonCard = document.getElementById('comparisonCard');
    const statusText = document.getElementById('statusText');
    const statusDetail = document.getElementById('statusDetail');
    
    comparisonCard.className = `summary-card comparison-result ${statusInfo.status}`;
    statusText.textContent = statusInfo.text;
    statusDetail.textContent = statusInfo.detail;
    
    const bounceIcon = comparisonCard.querySelector('.bounce-icon');
    if (statusInfo.status === 'high') {
        bounceIcon.style.color = '#DC2626';
    } else if (statusInfo.status === 'average') {
        bounceIcon.style.color = '#D97706';
    } else {
        bounceIcon.style.color = '#10B981';
    }
}

/**
 * Determines the user's status based on their total footprint.
 * @param {number} userTotal - The user's total CO2e.
 * @returns {object} - An object with status, text, and detail.
 */
function determineStatus(userTotal) {
    const globalAvg = 4.8;
    const nationalAvg = 9.0; // Example national average
    
    if (userTotal <= globalAvg) {
        return { status: 'low', text: 'Below Average', detail: 'Great job! 🌱' };
    } else if (userTotal <= nationalAvg) {
        return { status: 'average', text: 'Average', detail: 'Room for improvement' };
    } else {
        return { status: 'high', text: 'High', detail: 'Significant reduction needed' };
    }
}

/**
 * Draws the doughnut chart on the canvas.
 * @param {HTMLCanvasElement} canvas - The canvas element.
 * @param {object} data - The footprint data object.
 * @param {object} percentages - The percentage data object.
 */
function drawDoughnutChart(canvas, data, percentages) {
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = 90;
    const innerRadius = 60;
    
    const colors = {
        travel: '#EF4444',
        energy: '#F59E0B',
        food: '#10B981',
        waste: '#8B5CF6'
    };

    const categories = ['travel', 'energy', 'food', 'waste'];
    let currentAngle = -Math.PI / 2; // Start from top

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    categories.forEach((category) => {
        const percentage = percentages[category];
        if (percentage > 0) {
            const segmentAngle = (percentage / 100) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + segmentAngle);
            ctx.arc(centerX, centerY, innerRadius, currentAngle + segmentAngle, currentAngle, true);
            ctx.closePath();
            ctx.fillStyle = colors[category];
            ctx.fill();

            currentAngle += segmentAngle;
        }
    });
}

/**
 * Updates the legend below the doughnut chart.
 * @param {object} data - The footprint data object.
 * @param {object} percentages - The percentage data object.
 */
function updateChartLegend(data, percentages) {
    const legend = document.getElementById('chartLegend');
    const categories = [
        { key: 'travel', name: 'Travel', color: '#EF4444' },
        { key: 'energy', name: 'Energy', color: '#F59E0B' },
        { key: 'food', name: 'Food', color: '#10B981' },
        { key: 'waste', name: 'Waste', color: '#8B5CF6' }
    ];

    legend.innerHTML = categories.map(cat => `
        <div class="legend-item">
            <div class="legend-color" style="background-color: ${cat.color}"></div>
            <span>${cat.name}: ${percentages[cat.key]}%</span>
        </div>
    `).join('');
}

/**
 * Updates the four category cards with values and progress bars.
 * @param {object} data - The footprint data object.
 * @param {object} percentages - The percentage data object.
 */
function updateCategoryCards(data, percentages) {
    const categories = ['travel', 'energy', 'food', 'waste'];
    
    categories.forEach(category => {
        document.getElementById(`${category}Value`).textContent = data[category].toFixed(1);
        document.getElementById(`${category}Percentage`).textContent = `${percentages[category]}%`;
        
        const progressBar = document.getElementById(`${category}Progress`);
        if (progressBar) {
            progressBar.style.width = `${percentages[category]}%`;
        }
    });
}

/**
 * Updates the horizontal comparison bar chart.
 * @param {number} userTotal - The user's total CO2e.
 */
function updateComparisonBars(userTotal) {
    const worldAvg = 4.8;
    const nationalAvg = 9.0;
    const maxValue = Math.max(userTotal, nationalAvg, worldAvg) * 1.1; // Add 10% buffer
    
    document.getElementById('userBarValue').textContent = `${userTotal.toFixed(1)}t`;
    
    setTimeout(() => {
        document.getElementById('userBar').style.width = `${(userTotal / maxValue) * 100}%`;
        document.getElementById('worldBar').style.width = `${(worldAvg / maxValue) * 100}%`;
        document.getElementById('nationalBar').style.width = `${(nationalAvg / maxValue) * 100}%`;
    }, 1000); // Delay matches CSS animation
}

//=====================================================================
// 4. BADGES & INSIGHTS GENERATION
//=====================================================================

const RESULT_BADGES = [
    {
        id: "eco_champion",
        name: "🌟 Eco Champion",
        emoji: "🌟",
        description: "Your footprint is below the global average of 4.8 tons CO₂e per year!",
        condition: (total, breakdown) => total <= 4.8
    },
    {
        id: "climate_conscious",
        name: "🌱 Climate Conscious",
        emoji: "🌱",
        description: "You're doing better than most! Your footprint is under 10 tons CO₂e per year.",
        condition: (total, breakdown) => total > 4.8 && total <= 10
    },
    {
        id: "improvement_needed",
        name: "📈 Room for Growth",
        emoji: "📈",
        description: "There's potential to reduce your impact. Every step towards sustainability counts!",
        condition: (total, breakdown) => total > 10 && total <= 20
    },
    {
        id: "action_required",
        name: "⚡ Action Hero",
        emoji: "⚡",
        description: "Big changes can make a big difference. Ready to take on the climate challenge?",
        condition: (total, breakdown) => total > 20
    },
    {
        id: "travel_optimizer",
        name: "🚴 Travel Optimizer",
        emoji: "🚴",
        description: "Your travel emissions are well-managed. Keep up the sustainable mobility!",
        condition: (total, breakdown) => breakdown.travel && (breakdown.travel / total) < 0.25 && total > 0
    },
    {
        id: "energy_saver",
        name: "⚡ Energy Saver",
        emoji: "💡",
        description: "Your home energy use is efficient. You're making smart energy choices!",
        condition: (total, breakdown) => breakdown.energy && breakdown.energy < 4
    }
];

/**
 * Generates an array of earned and locked badges based on data.
 * @param {object} data - The footprint data object.
 * @returns {Array<object>} - An array of badge objects.
 */
function generateBadges(data) {
    const breakdown = {
        travel: data.travel,
        energy: data.energy,
        food: data.food,
        waste: data.waste
    };
    
    const earnedBadges = [];
    const lockedBadges = [];
    
    RESULT_BADGES.forEach((badge, index) => {
        const isEarned = badge.condition(data.total, breakdown);
        const badgeData = {
            ...badge,
            earned: isEarned,
            delay: 1.2 + (index * 0.1)
        };
        
        if (isEarned) {
            earnedBadges.push(badgeData);
        } else {
            lockedBadges.push(badgeData);
        }
    });
    
    // Show up to 3 badges (earned first, then locked)
    return [...earnedBadges, ...lockedBadges].slice(0, 3);
}

/**
 * Renders the badge objects into the HTML grid.
 * @param {Array<object>} badges - The array of badge objects.
 */
function renderBadges(badges) {
    const badgesGrid = document.getElementById('badgesGrid');
    
    badgesGrid.innerHTML = badges.map(badge => `
        <div class="badge-card ${badge.earned ? 'earned' : 'locked'}" 
             style="--badge-delay: ${badge.delay}s"
             title="${badge.name}: ${badge.description}">
            <div class="badge-circle">
                <div class="badge-emoji">${badge.emoji}</div>
                <span class="badge-status ${badge.earned ? 'earned' : 'locked'}">
                    ${badge.earned ? '✓' : '🔒'}
                </span>
            </div>
            <div class="badge-name">${badge.name.replace(/^[🌟🌱📈⚡🚴💡]+\s*/, '')}</div>
        </div>
    `).join('');
}

/**
 * Generates an array of AI insight objects based on data.
 * @param {object} data - The footprint data object.
 * @param {object} percentages - The percentage data object.
 * @returns {Array<object>} - An array of insight objects.
 */
function generateInsights(data, percentages) {
    let insights = [];
    const categories = [
        { key: 'travel', name: 'travel footprint', icon: '🚗', priority: 'high', impact: 'High' },
        { key: 'energy', name: 'energy usage', icon: '💡', priority: 'medium', impact: 'Medium' },
        { key: 'food', name: 'food choices', icon: '🥗', priority: 'medium', impact: 'Medium' },
        { key: 'waste', name: 'waste production', icon: '♻️', priority: 'low', impact: 'Low' }
    ];

    // Find highest impact category
    const highest = categories.reduce((prev, current) => 
        (percentages[prev.key] || 0) > (percentages[current.key] || 0) ? prev : current
    );

    if (percentages[highest.key] > 30) {
        insights.push({
            icon: highest.icon,
            title: `Focus on ${highest.name.split(' ')[0]}`,
            text: `Your ${highest.name} accounts for ${percentages[highest.key]}% of your total. This is your highest impact area.`,
            priority: 'high',
            impact: 'High'
        });
    }

    if (data.travel > 5) {
        insights.push({
            icon: '🚲',
            title: 'Optimize Travel',
            text: 'Your travel emissions are high. Try combining trips, using public transport, or working from home 1-2 days a week.',
            priority: 'high',
            impact: 'High'
        });
    }

    if (data.energy > 4) {
        insights.push({
            icon: '🏠',
            title: 'Boost Home Efficiency',
            text: 'Upgrading to LED lighting and smart thermostats could reduce your home energy footprint by up to 25%.',
            priority: 'medium',
            impact: 'Medium'
        });
    }

    if (data.food > 3) {
        insights.push({
            icon: '🌱',
            title: 'Try Plant-Based Meals',
            text: 'Exploring more plant-based meals just 2-3 times per week could significantly reduce your food-related emissions.',
            priority: 'medium',
            impact: 'Medium'
        });
    }

    if (data.waste > 1.5) {
        insights.push({
            icon: '📦',
            title: 'Reduce & Recycle',
            text: 'Focus on reducing packaging waste and composting organic materials to lower your waste footprint.',
            priority: 'low',
            impact: 'Low'
        });
    }

    // General insights if few specific ones apply
    if (insights.length < 2) {
        insights.push({
            icon: '🌍',
            title: 'Small Changes Add Up',
            text: 'Small daily changes like unplugging devices and choosing local products can compound into significant emission reductions.',
            priority: 'bonus',
            impact: 'Low'
        });
    }

    // Prioritize and return top 3
    const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3, 'bonus': 4 };
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    return insights.slice(0, 3);
}

/**
 * Renders the AI insight objects into the HTML grid.
 * @param {object} data - The footprint data object.
 * @param {object} percentages - The percentage data object.
 */
function updateInsights(data, percentages) {
    const insights = generateInsights(data, percentages);
    const grid = document.getElementById('insightsGrid');
    
    grid.innerHTML = insights.map((insight, index) => `
        <div class="insight-card priority-${insight.priority}" style="--insight-delay: ${1 + index * 0.1}s">
            <div class="insight-header">
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-content">
                    <div class="insight-title">${insight.title}</div>
                    <div class="insight-text">${insight.text}</div>
                </div>
            </div>
            <div class="insight-impact">💡 Impact: ${insight.impact}</div>
        </div>
    `).join('');
}



// 5. AESTHETIC HELPERS

function createFloatingParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 5 + 3; // Random size
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.bottom = `-10px`;
        
        particle.style.animationDelay = `${Math.random() * 15}s`;
        
        const baseDuration = 15 + Math.random() * 10;
        particle.style.animationDuration = `${baseDuration}s`;
        
        particlesContainer.appendChild(particle);
    }
}