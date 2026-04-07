// Utilities
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

// Debounce helper (300ms as required)
function debounce(fn, delay = 300) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// Exact match vocabulary (case-insensitive normalization)
const TERMS = ["india", "kolkata", "tripura", "mumbai", "new york", "pakistan", "los angeles", "paris", "germany", "poland", "delhi", "kashmir", "odisha"];

// AQI helper using EPA breakpoints (PM2.5) with linear interpolation, rounded to nearest integer.
function aqiFromPm25(pm25) {
    const bp = [
        { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
        { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
        { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
        { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
        { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
        { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
        { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 }
    ];
    if (pm25 <= 0) return 0;
    const seg = bp.find(b => pm25 >= b.cLow && pm25 <= b.cHigh) || bp[bp.length - 1];
    const { cLow, cHigh, iLow, iHigh } = seg;
    const aqi = ((iHigh - iLow) / (cHigh - cLow)) * (pm25 - cLow) + iLow;
    return Math.round(aqi);
}

// Unit checks per EPA guidance
console.assert(aqiFromPm25(12.0) === 50, 'aqiFromPm25(12.0) should be 50');
console.assert(aqiFromPm25(35.5) === 101, 'aqiFromPm25(35.5) should be 101');

// Mock dataset: realistic PM2.5 and timestamps; AQI computed on render for consistency
const MOCK = {
    "india": {
        label: "India",
        pm25: 58.2,
        updatedAt: "2025-07-14T08:42:00Z",
        source: "National composite",
        breakdown: { pm25: 52, pm10: 18, no2: 10, so2: 6, o3: 10, co: 4 }
    },
    "kolkata": {
        label: "Kolkata, IN",
        pm25: 96.5,
        updatedAt: "2025-07-14T06:10:00Z",
        source: "City stations",
        breakdown: { pm25: 64, pm10: 16, no2: 6, so2: 4, o3: 6, co: 4 }
    },
    "tripura": {
        label: "Tripura, IN",
        pm25: 38.4,
        updatedAt: "2025-07-13T23:18:00Z",
        source: "Regional monitors",
        breakdown: { pm25: 46, pm10: 20, no2: 8, so2: 6, o3: 14, co: 6 }
    },
    "mumbai": {
        label: "Mumbai, IN",
        pm25: 42.0,
        updatedAt: "2025-07-14T05:55:00Z",
        source: "City stations",
        breakdown: { pm25: 48, pm10: 22, no2: 10, so2: 4, o3: 10, co: 6 }
    },
    "new york": {
        label: "New York, US",
        pm25: 14.8,
        updatedAt: "2025-07-14T09:02:00Z",
        source: "Regional average",
        breakdown: { pm25: 28, pm10: 10, no2: 18, so2: 6, o3: 32, co: 6 }
    },
    "pakistan": {
        label: "Pakistan",
        pm25: 82.3,
        updatedAt: "2025-07-14T07:22:00Z",
        source: "National composite",
        breakdown: { pm25: 60, pm10: 16, no2: 6, so2: 4, o3: 8, co: 6 }
    },
    "los angeles": {
        label: "Los Angeles, US",
        pm25: 22.6,
        updatedAt: "2025-07-14T10:15:00Z",
        source: "Regional monitors",
        breakdown: { pm25: 34, pm10: 16, no2: 18, so2: 4, o3: 22, co: 6 }
    },
    "paris": {
        label: "Paris, FR",
        pm25: 18.3,
        updatedAt: "2025-07-14T09:40:00Z",
        source: "City stations",
        breakdown: { pm25: 30, pm10: 14, no2: 24, so2: 4, o3: 22, co: 6 }
    },
    "germany": {
        label: "Germany",
        pm25: 12.9,
        updatedAt: "2025-07-14T08:55:00Z",
        source: "National composite",
        breakdown: { pm25: 26, pm10: 18, no2: 16, so2: 6, o3: 28, co: 6 }
    },
    "poland": {
        label: "Poland",
        pm25: 24.1,
        updatedAt: "2025-07-14T07:58:00Z",
        source: "National composite",
        breakdown: { pm25: 40, pm10: 24, no2: 10, so2: 6, o3: 12, co: 8 }
    },
    "delhi": {
        label: "Delhi, IN",
        pm25: 110.4,
        updatedAt: "2025-07-14T06:48:00Z",
        source: "City stations",
        breakdown: { pm25: 66, pm10: 14, no2: 6, so2: 4, o3: 6, co: 4 }
    },
    "kashmir": {
        label: "Kashmir, IN",
        pm25: 28.7,
        updatedAt: "2025-07-14T05:36:00Z",
        source: "Regional monitors",
        breakdown: { pm25: 42, pm10: 22, no2: 8, so2: 6, o3: 16, co: 6 }
    },
    "odisha": {
        label: "Odisha, IN",
        pm25: 32.5,
        updatedAt: "2025-07-14T04:50:00Z",
        source: "Regional monitors",
        breakdown: { pm25: 44, pm10: 22, no2: 10, so2: 6, o3: 12, co: 6 }
    }
};

// Theme persistence
const THEME_KEY = 'airefy:theme';
const LAST_KEY = 'airefy:last';
const COMPARE_KEY = 'airefy:compareTarget';

function getSavedTheme() {
    const t = localStorage.getItem(THEME_KEY);
    if (t === 'light' || t === 'dark') return t;
    return 'dark';
}
function applyTheme(theme) {
    const root = document.documentElement;
    const isLight = theme === 'light';
    root.classList.toggle('light', isLight);
    const themeBtn = $('#themeBtn');
    if (themeBtn) themeBtn.setAttribute('aria-pressed', String(!isLight));
    localStorage.setItem(THEME_KEY, theme);
}

// Suggestions disabled
function openSuggestions(_) { /* no-op */ }
function closeSuggestions() { /* no-op */ }

const debouncedSuggest = debounce(value => {
    const q = (value || '').trim().toLowerCase();
    if (!q) return;
    if (TERMS.includes(q)) { tryMatch(q); }
}, 300);

// Server -> UI payload mapper
// Edit this to match your server's JSON keys
function mapServerToPayload(server) {
    if (!server) return null;
    return {
        label: server.label || server.name || (server.city ? `${server.city}` : 'Unknown'),
        pm25: Number(server.pm25 ?? server.pm2_5 ?? server.pm_2_5 ?? 0),
        updatedAt: server.updatedAt || server.updated_at || server.lastUpdated || new Date().toISOString(),
        source: server.source || server.provider || '',
        breakdown: {
            pm25: Number(server.breakdown?.pm25 ?? server.breakdown?.pm2_5 ?? 0),
            pm10: Number(server.breakdown?.pm10 ?? 0),
            no2: Number(server.breakdown?.no2 ?? 0),
            so2: Number(server.breakdown?.so2 ?? 0),
            o3: Number(server.breakdown?.o3 ?? 0),
            co: Number(server.breakdown?.co ?? 0)
        }
    };
}

// Production-ready fetchAQIData (replace the demo function)
async function fetchAQIData(query) {
    if (!query) return null;
    // CHANGE THIS to your actual API endpoint:
    const url = `/api/aqi?q=${encodeURIComponent(query)}`;

    // Timeout helper
    const controller = new AbortController();
    const timeoutMs = 8000; // 8s timeout (adjust if you want)
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const resp = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                // 'Authorization': 'Bearer <token>', // uncomment / set if you need auth
            },
            signal: controller.signal,
            credentials: 'same-origin' // use 'include' if your API requires cookies
        });
        clearTimeout(timeout);

        if (!resp.ok) {
            // Treat non-2xx as 'no data' so UI shows friendly message
            console.warn('fetchAQIData non-ok response', resp.status, resp.statusText);
            return null;
        }

        const serverJson = await resp.json();

        // Map server response to the UI payload shape. Edit mapper above if your server differs.
        const payload = mapServerToPayload(serverJson);
        return payload;
    } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
            console.warn('fetchAQIData aborted (timeout)');
        } else {
            console.warn('fetchAQIData error', err);
        }
        return null;
    }
}

// Expose for backend developers to call from the console/tests
window.airefy = {
    fetchAQIData, // implement/change this in production
    renderResult: null, // placeholder; set later (renderResult defined below)
    aqiFromPm25
};

// Render function (accepts the same shape as MOCK entries)
function renderResult(key, payload) {
    if (!payload) return;
    const aqi = aqiFromPm25(payload.pm25);

    // comparator selection
    const compareSel = $('#compareSelect');
    const compareTarget = (compareSel?.value) || localStorage.getItem(COMPARE_KEY) || 'baseline';
    const compareIsBaseline = compareTarget === 'baseline' || !MOCK[compareTarget];
    const compareLabel = compareIsBaseline ? 'Very Good (PM2.5 12)' : (MOCK[compareTarget]?.label || compareTarget);
    const compareAqi = compareIsBaseline ? aqiFromPm25(12.0) : aqiFromPm25(MOCK[compareTarget].pm25);

    const hcur = $('#h-current');
    if (hcur) hcur.textContent = payload.label || key;
    const upd = $('#updated');
    if (upd) upd.textContent = payload.updatedAt ? new Date(payload.updatedAt).toLocaleString() : '—';
    const chip = $('#aqiChip');
    if (chip) chip.textContent = `AQI ${aqi}`;
    const pmEl = $('#pm25');
    if (pmEl) pmEl.textContent = (payload.pm25 ?? 0).toFixed(1);

    const placeBar = $('#barPlace > span');
    const goodBar = $('#barGood > span');
    const bad = aqi >= 101;
    const barPlaceElem = $('#barPlace');
    if (barPlaceElem) barPlaceElem.classList.toggle('bad', bad);

    // Health recommendations
    const recs = healthAdviceForAqi(aqi);
    const recList = $('#recs');
    if (recList) recList.innerHTML = recs.map(r => `<li>${r}</li>`).join('');
    const healthIntro = $('#healthIntro');
    if (healthIntro) healthIntro.textContent = `Based on AQI ${aqi}, here are some precautions:`;

    // Pollutant breakdown
    const bd = payload.breakdown || { pm25: 50, pm10: 20, no2: 10, so2: 5, o3: 10, co: 5 };
    const total = Object.values(bd).reduce((a, b) => a + b, 0) || 1;
    const clampPct = v => Math.max(0, Math.min(100, Math.round((v / total) * 100)));

    const setWidth = (sel, val) => { const el = $(sel); if (el) el.style.width = val; };
    setWidth('#bdPM25', clampPct(bd.pm25) + '%');
    setWidth('#bdPM10', clampPct(bd.pm10) + '%');
    setWidth('#bdNO2', clampPct(bd.no2) + '%');
    setWidth('#bdSO2', clampPct(bd.so2) + '%');
    setWidth('#bdO3', clampPct(bd.o3) + '%');
    setWidth('#bdCO', clampPct(bd.co) + '%');

    const legend = [
        { key: 'PM2.5', val: clampPct(bd.pm25), color: 'var(--c-pm25)' },
        { key: 'PM10', val: clampPct(bd.pm10), color: 'var(--c-pm10)' },
        { key: 'NO₂', val: clampPct(bd.no2), color: 'var(--c-no2)' },
        { key: 'SO₂', val: clampPct(bd.so2), color: 'var(--c-so2)' },
        { key: 'O₃', val: clampPct(bd.o3), color: 'var(--c-o3)' },
        { key: 'CO', val: clampPct(bd.co), color: 'var(--c-co)' }
    ];
    const bdLegend = $('#bdLegend');
    if (bdLegend) bdLegend.innerHTML = legend.map(i => `<div class="item"><span class="swatch" style="background:${i.color}"></span><span>${i.key}: <strong>${i.val}%</strong></span></div>`).join('');

    // Update comparator UI
    const compareTextEl = $('#compareText');
    if (compareTextEl) compareTextEl.textContent = 'Comparing with:';
    if (compareSel) compareSel.value = compareIsBaseline ? 'baseline' : compareTarget;
    const barGoodElem = $('#barGood');
    if (barGoodElem) barGoodElem.setAttribute('title', `${compareLabel} — AQI ${compareAqi}`);

    // Visual scaling (cap at a sensible max for visualization)
    const maxForVis = 200;
    const toPct = v => Math.max(0, Math.min(100, Math.round((v / maxForVis) * 100)));
    requestAnimationFrame(() => {
        if (placeBar) placeBar.style.width = toPct(aqi) + '%';
        if (goodBar) goodBar.style.width = toPct(compareAqi) + '%';
    });

    try {
        localStorage.setItem(LAST_KEY, JSON.stringify({ term: key, pm25: payload.pm25, updatedAt: payload.updatedAt }));
    } catch (e) { /* ignore localStorage errors */ }
}

// Try exact match and render immediately if supported
function tryMatch(input) {
    const key = (input || '').trim().toLowerCase();
    if (!TERMS.includes(key)) return false;
    if (MOCK[key]) {
        renderResult(key, MOCK[key]);
        return true;
    }
    return false;
}

// Health advice helper by AQI ranges
function healthAdviceForAqi(aqi) {
    if (aqi <= 50) return [
        'Air quality is good — enjoy outdoor activities.',
        'Keep windows open to ventilate if temperatures allow.',
        'Sensitive individuals can proceed as normal.'
    ];
    if (aqi <= 100) return [
        'Moderate: Unusually sensitive people should limit prolonged outdoor exertion.',
        'Consider moving intense workouts to morning/evening.',
        'If you have respiratory issues, keep medications handy.'
    ];
    if (aqi <= 150) return [
        'USG: Children, elderly, and people with heart/lung disease should reduce prolonged or heavy exertion outdoors.',
        'Consider a well-fitted mask (KN95) if spending time outside.',
        'Use an air purifier indoors if available.'
    ];
    if (aqi <= 200) return [
        'Unhealthy: Everyone should reduce or limit outdoor activity.',
        'Shift workouts indoors; wear a KN95/N95 if you need to be outside.',
        'Close windows; set HVAC to recirculate; run air purifiers.'
    ];
    if (aqi <= 300) return [
        'Very Unhealthy: Avoid outdoor activity.',
        'Use a fit-tested N95 if you must go outside.',
        'Run purifiers on high; set AC to recirculation.'
    ];
    return [
        'Hazardous: Stay indoors in a clean room if possible.',
        'Only go out if essential; wear a fit-tested N95.',
        'Avoid indoor sources of pollution (cooking smoke, candles). Follow local advisories.'
    ];
}

// Init
(function init() {
    // Theme
    applyTheme(getSavedTheme());
    const themeBtn = $('#themeBtn');
    if (themeBtn) themeBtn.addEventListener('click', () => {
        const now = localStorage.getItem(THEME_KEY) === 'light' ? 'dark' : 'light';
        applyTheme(now);
    });

    // Search interactions
    const input = $('#searchInput');
    if (input) {
        input.addEventListener('input', e => debouncedSuggest(e.target.value));
        input.addEventListener('keydown', async e => {
            if (e.key === 'Escape') input.blur();
            if (e.key === 'Enter') {
                e.preventDefault();
                const q = input.value.trim();
                if (!q) return;
                const api = await fetchAQIData(q);
                if (api) renderResult(q, api);
                else if (!tryMatch(q)) {
                    // Not found — friendly UI message
                    const hcur = $('#h-current'); if (hcur) hcur.textContent = 'No data';
                    const upd = $('#updated'); if (upd) upd.textContent = '—';
                    const chip = $('#aqiChip'); if (chip) chip.textContent = 'AQI —';
                    const pmEl = $('#pm25'); if (pmEl) pmEl.textContent = '—';
                    const recList = $('#recs'); if (recList) recList.innerHTML = '<li>No data for this location in the demo. Try a nearby city or check API logs.</li>';
                    // Optionally clear the bars
                    ['#barPlace > span', '#barGood > span'].forEach(sel => { const el = $(sel); if (el) el.style.width = '0%'; });
                }
            }
        });
    }

    // Suggestions disabled

    // Comparator setup
    const compareSel = $('#compareSelect');
    if (compareSel) {
        // Populate comparator options: try server first, fall back to MOCK
        (async function populateCompareOptions() {
            const baselineOpt = document.createElement('option');
            baselineOpt.value = 'baseline';
            baselineOpt.textContent = 'Very Good (PM2.5 12)';
            compareSel.appendChild(baselineOpt);

            try {
                const resp = await fetch('/api/compare-options', { method: 'GET', headers: { 'Accept': 'application/json' }, credentials: 'same-origin' });
                if (resp.ok) {
                    const list = await resp.json(); // expected: [{ id: 'new-york', label: 'New York, US' }, ...]
                    (list || []).forEach(item => {
                        const opt = document.createElement('option');
                        opt.value = item.id;
                        opt.textContent = item.label;
                        compareSel.appendChild(opt);
                    });
                } else {
                    // fallback: populate from MOCK
                    Object.keys(MOCK).forEach(key => {
                        const opt = document.createElement('option');
                        opt.value = key;
                        opt.textContent = MOCK[key].label;
                        compareSel.appendChild(opt);
                    });
                }
            } catch (e) {
                // network issue — fallback to MOCK
                Object.keys(MOCK).forEach(key => {
                    const opt = document.createElement('option');
                    opt.value = key;
                    opt.textContent = MOCK[key].label;
                    compareSel.appendChild(opt);
                });
            }

            // restore saved comparator
            compareSel.value = localStorage.getItem(COMPARE_KEY) || 'baseline';
            compareSel.addEventListener('change', () => {
                localStorage.setItem(COMPARE_KEY, compareSel.value);
                try {
                    const last = JSON.parse(localStorage.getItem(LAST_KEY) || 'null');
                    if (last && last.term && MOCK[last.term]) renderResult(last.term, MOCK[last.term]);
                } catch (err) { /* ignore */ }
            });
        })();
    }

    // Reset
    const resetBtn = $('#resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            try { localStorage.removeItem(THEME_KEY); localStorage.removeItem(LAST_KEY); } catch (e) { /* ignore */ }
            applyTheme('dark');
            const hcur = $('#h-current'); if (hcur) hcur.textContent = '—';
            const upd = $('#updated'); if (upd) upd.textContent = '—';
            const chip = $('#aqiChip'); if (chip) chip.textContent = 'AQI —';
            const pmEl = $('#pm25'); if (pmEl) pmEl.textContent = '—';
            const p1 = $('#barPlace > span'); if (p1) p1.style.width = '0%';
            const p2 = $('#barGood > span'); if (p2) p2.style.width = '0%';
            // Reset breakdown
            ['#bdPM25', '#bdPM10', '#bdNO2', '#bdSO2', '#bdO3', '#bdCO'].forEach(sel => { const el = $(sel); if (el) el.style.width = '0%'; });
            const bdLegend = $('#bdLegend'); if (bdLegend) bdLegend.innerHTML = '';
            const healthIntro = $('#healthIntro'); if (healthIntro) healthIntro.textContent = 'Guidance updates when you select a location.';
            const recList = $('#recs'); if (recList) recList.innerHTML = '<li>Search a supported location to see recommendations.</li>';
        });
    }

    // Restore last result
    try {
        const last = JSON.parse(localStorage.getItem(LAST_KEY) || 'null');
        if (last && TERMS.includes(last.term) && MOCK[last.term]) {
            renderResult(last.term, MOCK[last.term]);
            if (input) input.value = last.term;
        }
    } catch { /* ignore parse errors */ }

    // Footer year
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Touch devices: disable mouse glow
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const glow = $('#glow');
    // Apply proximity glow to all card containers
    const proxElems = $$('.card');
    proxElems.forEach(el => el.classList.add('proximity-glow'));

    // Disable cursor-following glow and proximity tracking
    if (glow) glow.style.display = 'none';

    // assign renderResult into public API
    window.airefy.renderResult = renderResult;
})();