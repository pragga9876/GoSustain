let map;
let allRoutes = [];
let selectedRouteIndex = 0;
let currentFromCoords = null;
let currentToCoords = null;
let currentFromAddress = '';
let currentToAddress = '';
let routeLayers = [];
let markerLayers = [];
let liveRefreshTimer = null;
let geoWatchId = null;
let usingLiveLocationAsStart = false;

// Initialize Leaflet map
function initMap() {
    try {
        map = L.map('map', {
            maxZoom: 19,
            minZoom: 2,
            preferCanvas: true,
            tapHold: false,
            tap: true,
            zoomControl: true,
            attributionControl: true
        }).setView([22.5726, 88.3639], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        setTimeout(() => {
            map.invalidateSize();
        }, 300);

        window.addEventListener('resize', function () {
            setTimeout(() => {
                if (map) map.invalidateSize();
            }, 100);
        });

        window.addEventListener('orientationchange', function () {
            setTimeout(() => {
                if (map) map.invalidateSize();
            }, 500);
        });

        console.log('Map initialized successfully');
    } catch (error) {
        console.error('Map init error:', error);
    }
}

const routeColors = [
    { color: '#10b981', name: 'eco-route' },
    { color: '#f59e0b', name: 'balanced-route' },
    { color: '#ef4444', name: 'fast-route' }
];

// Dark mode
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.textContent = isDark ? '☀️ Light' : '🌙 Dark';
    }
    localStorage.setItem('darkMode', isDark);
}

document.addEventListener('DOMContentLoaded', function () {
    const themeIcon = document.getElementById('theme-icon');
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        if (themeIcon) themeIcon.textContent = '☀️ Light';
    } else {
        if (themeIcon) themeIcon.textContent = '🌙 Dark';
    }
});

const emissionFactors = {
    driving: 192,
    walking: 0,
    cycling: 8,
    transit: 68
};

function estimateRouteComplexityPenalty(route) {
    const coords = route?.geometry?.coordinates || [];
    if (coords.length < 3) return 1;

    let turnCount = 0;

    for (let i = 1; i < coords.length - 1; i++) {
        const p1 = coords[i - 1];
        const p2 = coords[i];
        const p3 = coords[i + 1];

        const a1 = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
        const a2 = Math.atan2(p3[1] - p2[1], p3[0] - p2[0]);

        let diff = Math.abs((a2 - a1) * 180 / Math.PI);
        if (diff > 180) diff = 360 - diff;

        if (diff > 35) turnCount++;
    }

    return 1 + Math.min(turnCount * 0.01, 0.15);
}

function calculateRouteCO2(mode, distanceKm, durationMin, route) {
    const factor = emissionFactors[mode] || 0;

    if (mode === 'walking') return 0;
    if (mode === 'cycling') return Math.round(distanceKm * factor);

    let congestionPenalty = 1;
    const avgSpeed = durationMin > 0 ? distanceKm / (durationMin / 60) : 0;

    if (mode === 'driving') {
        if (avgSpeed < 18) congestionPenalty += 0.25;
        else if (avgSpeed < 28) congestionPenalty += 0.12;
    }

    if (mode === 'transit') {
        if (avgSpeed < 12) congestionPenalty += 0.10;
    }

    const complexityPenalty = estimateRouteComplexityPenalty(route);
    return Math.round(distanceKm * factor * congestionPenalty * complexityPenalty);
}

function scoreAndRankRoutes(rawRoutes, mode) {
    if (!rawRoutes.length) return [];

    const distances = rawRoutes.map(r => r.distanceKm);
    const durations = rawRoutes.map(r => r.durationMin);
    const co2s = rawRoutes.map(r => r.co2);

    const minDist = Math.min(...distances);
    const maxDist = Math.max(...distances);
    const minDur = Math.min(...durations);
    const maxDur = Math.max(...durations);
    const minCo2 = Math.min(...co2s);
    const maxCo2 = Math.max(...co2s);

    function normalize(value, min, max) {
        if (max === min) return 1;
        return 1 - ((value - min) / (max - min));
    }

    rawRoutes.forEach(route => {
        const distScore = normalize(route.distanceKm, minDist, maxDist);
        const durScore = normalize(route.durationMin, minDur, maxDur);
        const co2Score = normalize(route.co2, minCo2, maxCo2);

        let modeBonus = 0;
        if (mode === 'walking') modeBonus = 20;
        else if (mode === 'cycling') modeBonus = 16;
        else if (mode === 'transit') modeBonus = 8;

        route.ecoScore = Math.round(
            (co2Score * 55) +
            (distScore * 25) +
            (durScore * 20) +
            modeBonus
        );

        route.ecoScore = Math.max(0, Math.min(100, route.ecoScore));
    });

    rawRoutes.sort((a, b) => {
        if (b.ecoScore !== a.ecoScore) return b.ecoScore - a.ecoScore;
        if (a.co2 !== b.co2) return a.co2 - b.co2;
        return a.durationMin - b.durationMin;
    });

    rawRoutes.forEach((route, index) => {
        route.rankType = index === 0 ? 'eco-route' : index === 1 ? 'balanced-route' : 'fast-route';
        route.color = routeColors[index] ? routeColors[index].color : '#3b82f6';
    });

    return rawRoutes;
}

async function geocodeAddress(address) {
    try {
        const trimmed = address.trim();

        const currentLocationMatch = trimmed.match(/^Current Location\s*\(([-\d.]+),\s*([-\d.]+)\)$/i);
        if (currentLocationMatch) {
            return {
                lat: parseFloat(currentLocationMatch[1]),
                lon: parseFloat(currentLocationMatch[2]),
                name: 'Current Location'
            };
        }

        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=1&addressdetails=1`;

        const response = await fetch(url, {
            headers: {
                Accept: 'application/json'
            },
            signal: AbortSignal.timeout(15000)
        });

        if (!response.ok) {
            console.error('Geocoding response:', response.status);
            return null;
        }

        const data = await response.json();

        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
                name: data[0].display_name
            };
        }

        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

function buildOSRMUrl(fromCoords, toCoords, profile) {
    const base = 'https://router.project-osrm.org/route/v1';
    return `${base}/${profile}/${fromCoords.lon},${fromCoords.lat};${toCoords.lon},${toCoords.lat}?alternatives=true&steps=false&geometries=geojson&overview=full&annotations=false`;
}

function clearMap() {
    routeLayers.forEach(layer => map.removeLayer(layer));
    markerLayers.forEach(layer => map.removeLayer(layer));
    routeLayers = [];
    markerLayers = [];
    allRoutes = [];
}

function drawRoutes(routes) {
    try {
        routeLayers.forEach(layer => map.removeLayer(layer));
        markerLayers.forEach(layer => map.removeLayer(layer));
        routeLayers = [];
        markerLayers = [];

        routes.forEach((route, idx) => {
            if (!route.polyline || !route.polyline.coordinates) return;

            const latlngs = route.polyline.coordinates.map(c => L.latLng(c[1], c[0]));

            const polyline = L.polyline(latlngs, {
                color: route.color,
                weight: idx === selectedRouteIndex ? 8 : 6,
                opacity: idx === selectedRouteIndex ? 1 : 0.65,
                dashArray: idx === selectedRouteIndex ? null : '8, 4',
                lineCap: 'round',
                lineJoin: 'round'
            }).addTo(map);

            polyline.on('click', () => selectRoute(idx, routes));
            routeLayers.push(polyline);
        });

        const startMarker = L.marker([currentFromCoords.lat, currentFromCoords.lon], {
            icon: L.divIcon({
                html: '<div style="background: #10b981; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); font-weight: bold;">A</div>',
                iconSize: [40, 40],
                iconAnchor: [20, 20],
                className: ''
            })
        }).addTo(map).bindPopup('Start: ' + currentFromAddress);

        const endMarker = L.marker([currentToCoords.lat, currentToCoords.lon], {
            icon: L.divIcon({
                html: '<div style="background: #ef4444; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); font-weight: bold;">B</div>',
                iconSize: [40, 40],
                iconAnchor: [20, 20],
                className: ''
            })
        }).addTo(map).bindPopup('Destination: ' + currentToAddress);

        markerLayers.push(startMarker, endMarker);

        const selectedRoute = routes[selectedRouteIndex] || routes[0];
        if (selectedRoute?.polyline?.coordinates?.length) {
            const bounds = L.latLngBounds(
                selectedRoute.polyline.coordinates.map(c => [c[1], c[0]])
            );
            map.fitBounds(bounds.pad(0.15));
        }
    } catch (error) {
        console.error('Draw routes error:', error);
    }
}

function displayRoutes(routes) {
    try {
        const container = document.getElementById('routes-container');
        container.innerHTML = '';

        const title = document.createElement('h3');
        title.className = 'routes-title';
        title.textContent = '🛣️ Available Routes';
        container.appendChild(title);

        routes.forEach((route, idx) => {
            let label = '';
            let recommendation = '';
            let routeType = route.rankType || 'balanced-route';

            if (idx === 0) {
                label = '🌱 Most Eco-Friendly';
                recommendation = 'Lowest estimated emissions among available live routes';
            } else if (idx === 1) {
                label = '⚖️ Balanced';
                recommendation = 'Good balance of time, distance and carbon impact';
            } else {
                label = '⚡ Faster / Higher Impact';
                recommendation = 'Usually quicker, but with a higher environmental cost';
            }

            const routeEl = document.createElement('div');
            routeEl.className = 'route-option ' + routeType + (idx === selectedRouteIndex ? ' selected' : '');
            routeEl.innerHTML =
                '<div class="route-header">' +
                    '<div class="route-title"><span>' + label + '</span><span class="route-badge">' + route.ecoScore + '/100</span></div>' +
                '</div>' +
                '<div class="route-details">' +
                    '<div class="route-stat"><div class="stat-label">Distance</div><div class="stat-value">' + route.distance + ' km</div></div>' +
                    '<div class="route-stat"><div class="stat-label">Duration</div><div class="stat-value">' + route.duration + ' min</div></div>' +
                    '<div class="route-stat"><div class="stat-label">CO₂</div><div class="stat-value">' + route.co2 + 'g</div></div>' +
                    '<div class="route-stat"><div class="stat-label">Eco</div><div class="stat-value">' + route.ecoScore + '/100</div></div>' +
                '</div>' +
                '<div class="route-comparison"><strong>' + recommendation + '</strong></div>';

            routeEl.onclick = function () { selectRoute(idx, routes); };
            routeEl.ontouchend = function (e) {
                e.preventDefault();
                selectRoute(idx, routes);
            };

            container.appendChild(routeEl);
        });

        container.classList.add('active');
    } catch (error) {
        console.error('Display routes error:', error);
    }
}

function selectRoute(idx, routes) {
    selectedRouteIndex = idx;
    document.querySelectorAll('.route-option').forEach((el, i) => {
        el.classList.toggle('selected', i === idx);
    });
    drawRoutes(routes);
    console.log('Route', idx, 'selected');
}

function getOsrmProfile(mode) {
    if (mode === 'walking') return 'foot';
    if (mode === 'cycling') return 'bike';
    if (mode === 'transit') return 'driving';
    return 'driving';
}

async function fetchRealRoutes(fromCoords, toCoords, mode) {
    const profile = getOsrmProfile(mode);
    const url = buildOSRMUrl(fromCoords, toCoords, profile);

    const response = await fetch(url, {
        signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) {
        throw new Error(`Routing failed with status ${response.status}`);
    }

    const data = await response.json();
    const routes = data?.routes || [];

    if (!routes.length) {
        throw new Error('No routes found');
    }

    let parsed = routes.slice(0, 3).map(route => {
        const distanceKm = +(route.distance / 1000).toFixed(2);
        const durationMin = Math.max(1, Math.round(route.duration / 60));
        const co2 = calculateRouteCO2(mode, distanceKm, durationMin, route);

        return {
            polyline: route.geometry,
            distance: distanceKm.toFixed(2),
            duration: durationMin,
            co2,
            distanceKm,
            durationMin,
            rankType: 'balanced-route',
            color: '#10b981',
            ecoScore: 0
        };
    });

    if (parsed.length === 1) {
        const base = parsed[0];
        parsed.push({
            ...base,
            duration: base.duration + 2,
            durationMin: base.durationMin + 2,
            co2: Math.round(base.co2 * 1.05),
            ecoScore: 0
        });
        parsed.push({
            ...base,
            duration: base.duration + 4,
            durationMin: base.durationMin + 4,
            co2: Math.round(base.co2 * 1.10),
            ecoScore: 0
        });
    } else if (parsed.length === 2) {
        const slower = parsed[1];
        parsed.push({
            ...slower,
            duration: slower.duration + 3,
            durationMin: slower.durationMin + 3,
            co2: Math.round(slower.co2 * 1.06),
            ecoScore: 0
        });
    }

    return scoreAndRankRoutes(parsed, mode);
}

function stopLiveRefresh() {
    if (liveRefreshTimer) {
        clearInterval(liveRefreshTimer);
        liveRefreshTimer = null;
    }
    if (geoWatchId !== null) {
        navigator.geolocation.clearWatch(geoWatchId);
        geoWatchId = null;
    }
}

function startLiveRefresh() {
    stopLiveRefresh();

    if (!usingLiveLocationAsStart) return;
    if (!navigator.geolocation) return;

    geoWatchId = navigator.geolocation.watchPosition(
        function (position) {
            currentFromCoords = {
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                name: 'Current Location'
            };
            currentFromAddress = `Current Location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`;
            document.getElementById('from-input').value = currentFromAddress;
        },
        function (error) {
            console.log('Live location watch error:', error);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000
        }
    );

    liveRefreshTimer = setInterval(() => {
        const from = document.getElementById('from-input').value.trim();
        const to = document.getElementById('to-input').value.trim();
        if (from && to) {
            planRoute(true);
        }
    }, 30000);
}

async function planRoute(isSilentRefresh = false) {
    const fromAddress = document.getElementById('from-input').value.trim();
    const toAddress = document.getElementById('to-input').value.trim();

    if (!fromAddress || !toAddress) {
        if (!isSilentRefresh) alert('Please enter both addresses');
        return;
    }

    const loadingEl = document.getElementById('loading');
    const routesContainer = document.getElementById('routes-container');

    if (!isSilentRefresh) {
        loadingEl.classList.add('active');
        routesContainer.classList.remove('active');
    }

    try {
        const fromCoords = await geocodeAddress(fromAddress);
        if (!fromCoords) {
            throw new Error('Could not find the starting location');
        }

        const toCoords = await geocodeAddress(toAddress);
        if (!toCoords) {
            throw new Error('Could not find the destination');
        }

        currentFromCoords = fromCoords;
        currentToCoords = toCoords;
        currentFromAddress = fromAddress;
        currentToAddress = toAddress;

        clearMap();

        const mode = document.getElementById('mode-select').value;
        const results = await fetchRealRoutes(fromCoords, toCoords, mode);

        allRoutes = results;
        selectedRouteIndex = 0;

        drawRoutes(results);
        displayRoutes(results);

        setTimeout(function () {
            if (map) map.invalidateSize();
        }, 100);

        if (!isSilentRefresh) {
            loadingEl.classList.remove('active');
        }

        if (usingLiveLocationAsStart) {
            startLiveRefresh();
        } else {
            stopLiveRefresh();
        }
    } catch (error) {
        console.error('Plan route error:', error);
        if (!isSilentRefresh) {
            alert(error.message || 'Unable to calculate route');
            loadingEl.classList.remove('active');
        }
    }
}

function updateRoute() {
    const from = document.getElementById('from-input').value.trim();
    const to = document.getElementById('to-input').value.trim();

    if (from && to) {
        planRoute();
    }
}

function useCurrentLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation not supported');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        function (position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            usingLiveLocationAsStart = true;
            document.getElementById('from-input').value = `Current Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
            currentFromCoords = { lat, lon, name: 'Current Location' };

            if (map) {
                map.setView([lat, lon], 13);
            }
        },
        function () {
            alert('Unable to get your location');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000
        }
    );
}

function showPopularPlaces() {
    const places = document.getElementById('popular-places');
    if (places.style.display === 'none') {
        places.style.display = 'grid';
    } else {
        places.style.display = 'none';
    }
}

function fillDestination(place) {
    document.getElementById('to-input').value = place;
    document.getElementById('popular-places').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function () {
    const fromInput = document.getElementById('from-input');
    const toInput = document.getElementById('to-input');

    if (fromInput) {
        fromInput.addEventListener('input', function () {
            const value = this.value.trim();
            if (!/^Current Location\s*\(/i.test(value)) {
                usingLiveLocationAsStart = false;
                stopLiveRefresh();
            }
        });

        fromInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                toInput.focus();
            }
        });
    }

    if (toInput) {
        toInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                planRoute();
            }
        });
    }
});

document.addEventListener('touchstart', function (e) {
    if (e.target.matches('.route-option, .plan-button, .chat-button, .theme-toggle, .suggestion-btn, .place-btn')) {
        e.target.style.opacity = '0.7';
    }
}, false);

document.addEventListener('touchend', function (e) {
    if (e.target.matches('.route-option, .plan-button, .chat-button, .theme-toggle, .suggestion-btn, .place-btn')) {
        e.target.style.opacity = '1';
    }
}, false);

window.addEventListener('load', function () {
    console.log('Page loaded, initializing...');

    setTimeout(function () {
        initMap();

        if (map) map.invalidateSize();

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function (pos) {
                    try {
                        map.setView([pos.coords.latitude, pos.coords.longitude], 13);
                    } catch (e) {
                        console.log('Geolocation error:', e);
                    }
                },
                function () {
                    console.log('Geolocation denied');
                }
            );
        }
    }, 100);
});

window.addEventListener('orientationchange', function () {
    console.log('Orientation changed');
    setTimeout(function () {
        if (map) {
            map.invalidateSize();
            if (allRoutes.length > 0) {
                drawRoutes(allRoutes);
            }
        }
    }, 300);
});

console.log('Script loaded successfully');