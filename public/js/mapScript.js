let map;
let currentFromCoords = null;
let currentToCoords = null;
let currentFromAddress = "";
let currentToAddress = "";
let allRoutes = [];
let selectedRouteIndex = 0;
let routeLayers = [];
let markerLayers = [];
let liveRefreshTimer = null;
let usingLiveLocationAsStart = false;

const emissionFactors = {
  driving: 192,
  walking: 0,
  cycling: 8,
  transit: 68
};

const routeColors = [
  { color: "#10b981", type: "eco-route" },
  { color: "#f59e0b", type: "balanced-route" },
  { color: "#ef4444", type: "fast-route" }
];

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initMap();
});

function initTheme() {
  const themeIcon = document.getElementById("theme-icon");
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
    if (themeIcon) themeIcon.textContent = "☀️ Light";
  } else {
    if (themeIcon) themeIcon.textContent = "🌙 Dark";
  }
}

function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  const themeIcon = document.getElementById("theme-icon");
  if (themeIcon) themeIcon.textContent = isDark ? "☀️ Light" : "🌙 Dark";
  localStorage.setItem("darkMode", isDark);
}

function initMap() {
  map = L.map("map", {
    zoomControl: true,
    attributionControl: true
  }).setView([22.5726, 88.3639], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19
  }).addTo(map);

  setTimeout(() => map.invalidateSize(), 300);
  window.addEventListener("resize", () => setTimeout(() => map.invalidateSize(), 120));
}

function showPopularPlaces() {
  const el = document.getElementById("popular-places");
  el.style.display = el.style.display === "none" ? "grid" : "none";
}

function fillDestination(place) {
  document.getElementById("to-input").value = place;
}

function updateLiveStatus(text) {
  const el = document.getElementById("live-status");
  if (el) el.textContent = text;
}

function setLoading(isLoading) {
  document.getElementById("loading").classList.toggle("active", isLoading);
}

async function geocodeAddress(address) {
  try {
    const trimmed = address.trim();

    const currentLocationMatch = trimmed.match(/^Current Location\s*\(([-\d.]+),\s*([-\d.]+)\)$/i);
    if (currentLocationMatch) {
      return {
        lat: parseFloat(currentLocationMatch[1]),
        lon: parseFloat(currentLocationMatch[2]),
        name: "Current Location"
      };
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=1&addressdetails=1`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.length) return null;

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      name: data[0].display_name
    };
  } catch (err) {
    console.error("Geocode error:", err);
    return null;
  }
}

function getOsrmProfile(mode) {
  if (mode === "walking") return "foot";
  if (mode === "cycling") return "bike";
  return "driving";
}

function buildOSRMUrl(fromCoords, toCoords, profile) {
  return `https://router.project-osrm.org/route/v1/${profile}/${fromCoords.lon},${fromCoords.lat};${toCoords.lon},${toCoords.lat}?alternatives=true&overview=full&geometries=geojson&steps=false`;
}

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

  if (mode === "walking") return 0;
  if (mode === "cycling") return Math.round(distanceKm * factor);

  let congestionPenalty = 1;
  const avgSpeed = durationMin > 0 ? distanceKm / (durationMin / 60) : 0;

  if (mode === "driving") {
    if (avgSpeed < 18) congestionPenalty += 0.25;
    else if (avgSpeed < 28) congestionPenalty += 0.12;
  }

  if (mode === "transit") {
    if (avgSpeed < 12) congestionPenalty += 0.1;
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
    return 1 - (value - min) / (max - min);
  }

  rawRoutes.forEach(route => {
    const distScore = normalize(route.distanceKm, minDist, maxDist);
    const durScore = normalize(route.durationMin, minDur, maxDur);
    const co2Score = normalize(route.co2, minCo2, maxCo2);

    let modeBonus = 0;
    if (mode === "walking") modeBonus = 20;
    else if (mode === "cycling") modeBonus = 16;
    else if (mode === "transit") modeBonus = 8;

    route.ecoScore = Math.round((co2Score * 55) + (distScore * 25) + (durScore * 20) + modeBonus);
    route.ecoScore = Math.max(0, Math.min(100, route.ecoScore));
  });

  rawRoutes.sort((a, b) => {
    if (b.ecoScore !== a.ecoScore) return b.ecoScore - a.ecoScore;
    if (a.co2 !== b.co2) return a.co2 - b.co2;
    return a.durationMin - b.durationMin;
  });

  rawRoutes.forEach((route, index) => {
    route.rankType = routeColors[index]?.type || "balanced-route";
    route.color = routeColors[index]?.color || "#3b82f6";
  });

  return rawRoutes;
}

async function fetchRealRoutes(fromCoords, toCoords, mode) {
  const profile = getOsrmProfile(mode);
  const url = buildOSRMUrl(fromCoords, toCoords, profile);

  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error("Routing request failed");

  const data = await response.json();
  const routes = data.routes || [];
  if (!routes.length) throw new Error("No routes found");

  const transformed = routes.slice(0, 3).map(route => {
    const distanceKm = +(route.distance / 1000).toFixed(2);
    const durationMin = Math.round(route.duration / 60);
    const co2 = calculateRouteCO2(mode, distanceKm, durationMin, route);

    return {
      polyline: route.geometry,
      distanceKm,
      durationMin,
      distance: distanceKm.toFixed(2),
      duration: durationMin,
      co2,
      raw: route
    };
  });

  return scoreAndRankRoutes(transformed, mode);
}

function clearMap() {
  routeLayers.forEach(layer => map.removeLayer(layer));
  markerLayers.forEach(layer => map.removeLayer(layer));
  routeLayers = [];
  markerLayers = [];
}

function drawRoutes(routes) {
  clearMap();

  routes.forEach((route, idx) => {
    const latlngs = route.polyline.coordinates.map(c => [c[1], c[0]]);
    const polyline = L.polyline(latlngs, {
      color: route.color,
      weight: idx === selectedRouteIndex ? 8 : 6,
      opacity: idx === selectedRouteIndex ? 1 : 0.65,
      dashArray: idx === selectedRouteIndex ? null : "8, 4",
      lineCap: "round",
      lineJoin: "round"
    }).addTo(map);

    polyline.on("click", () => selectRoute(idx, routes));
    routeLayers.push(polyline);
  });

  const startMarker = L.marker([currentFromCoords.lat, currentFromCoords.lon], {
    icon: L.divIcon({
      html: `<div style="background:#10b981;color:white;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);font-weight:bold;">A</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      className: ""
    })
  }).addTo(map).bindPopup(`Start: ${currentFromAddress}`);

  const endMarker = L.marker([currentToCoords.lat, currentToCoords.lon], {
    icon: L.divIcon({
      html: `<div style="background:#ef4444;color:white;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);font-weight:bold;">B</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      className: ""
    })
  }).addTo(map).bindPopup(`Destination: ${currentToAddress}`);

  markerLayers.push(startMarker, endMarker);

  const selected = routes[selectedRouteIndex] || routes[0];
  const bounds = L.latLngBounds(selected.polyline.coordinates.map(c => [c[1], c[0]]));
  map.fitBounds(bounds.pad(0.15));
}

function displayRoutes(routes) {
  const container = document.getElementById("routes-container");
  container.innerHTML = `<h3 class="routes-title">🛣️ Available Routes</h3>`;

  routes.forEach((route, idx) => {
    let label = "";
    let recommendation = "";

    if (idx === 0) {
      label = "🌱 Most Eco-Friendly";
      recommendation = "Lowest estimated emissions among available live routes";
    } else if (idx === 1) {
      label = "⚖️ Balanced";
      recommendation = "Good balance of time, distance and carbon impact";
    } else {
      label = "⚡ Faster / Higher Impact";
      recommendation = "Usually quicker, but with a higher environmental cost";
    }

    const el = document.createElement("div");
    el.className = `route-option ${route.rankType} ${idx === selectedRouteIndex ? "selected" : ""}`;
    el.innerHTML = `
      <div class="route-header">
        <div class="route-title">
          <span>${label}</span>
          <span class="route-badge">${route.ecoScore}/100</span>
        </div>
      </div>

      <div class="route-details">
        <div class="route-stat">
          <div class="stat-label">Distance</div>
          <div class="stat-value">${route.distance} km</div>
        </div>
        <div class="route-stat">
          <div class="stat-label">Duration</div>
          <div class="stat-value">${route.duration} min</div>
        </div>
        <div class="route-stat">
          <div class="stat-label">CO₂</div>
          <div class="stat-value">${route.co2} g</div>
        </div>
        <div class="route-stat">
          <div class="stat-label">Eco</div>
          <div class="stat-value">${route.ecoScore}/100</div>
        </div>
      </div>

      <div class="route-comparison">
        <strong>${recommendation}</strong>
      </div>
    `;

    el.onclick = () => selectRoute(idx, routes);
    container.appendChild(el);
  });

  container.classList.add("active");
}

function selectRoute(idx, routes) {
  selectedRouteIndex = idx;
  document.querySelectorAll(".route-option").forEach((el, i) => {
    el.classList.toggle("selected", i === idx);
  });
  drawRoutes(routes);
  renderSummary(routes);
}

function renderSummary(routes) {
  const panel = document.getElementById("summary-panel");
  panel.classList.add("active");

  const best = routes[0];
  const worst = routes[routes.length - 1];

  document.getElementById("best-route-label").textContent = best.rankType === "eco-route"
    ? "Eco Route"
    : best.rankType === "balanced-route"
    ? "Balanced Route"
    : "Fast Route";

  document.getElementById("saved-co2").textContent = `${Math.max(0, worst.co2 - best.co2)} g`;
  document.getElementById("saved-time").textContent = `${Math.max(0, worst.duration - best.duration)} min`;
  document.getElementById("top-eco-score").textContent = `${best.ecoScore}/100`;
}

async function fetchGeminiInsight(routes, mode) {
  try {
    const res = await fetch("/map/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: currentFromAddress,
        to: currentToAddress,
        mode,
        routes: routes.map((route, index) => ({
          label: index === 0 ? "Eco Route" : index === 1 ? "Balanced Route" : "Fast Route",
          distanceKm: route.distanceKm,
          durationMin: route.durationMin,
          co2g: route.co2,
          ecoScore: route.ecoScore
        }))
      })
    });

    const data = await res.json();
    const panel = document.getElementById("ai-insight-panel");
    const content = document.getElementById("ai-insight-content");

    panel.classList.add("active");
    content.textContent = data.insight || "No AI insight available right now.";
  } catch (err) {
    console.error("Gemini insight error:", err);
    const panel = document.getElementById("ai-insight-panel");
    const content = document.getElementById("ai-insight-content");
    panel.classList.add("active");
    content.textContent = "AI insight could not be loaded right now, but live route calculations are working.";
  }
}

async function planRoute() {
  const fromAddress = document.getElementById("from-input").value.trim();
  const toAddress = document.getElementById("to-input").value.trim();
  const mode = document.getElementById("mode-select").value;

  if (!fromAddress || !toAddress) {
    alert("Please enter both start and destination.");
    return;
  }

  setLoading(true);
  updateLiveStatus("Calculating live routes...");

  try {
    const fromCoords = await geocodeAddress(fromAddress);
    const toCoords = await geocodeAddress(toAddress);

    if (!fromCoords) throw new Error("Start location not found");
    if (!toCoords) throw new Error("Destination not found");

    currentFromCoords = fromCoords;
    currentToCoords = toCoords;
    currentFromAddress = fromAddress;
    currentToAddress = toAddress;
    selectedRouteIndex = 0;

    allRoutes = await fetchRealRoutes(fromCoords, toCoords, mode);

    drawRoutes(allRoutes);
    displayRoutes(allRoutes);
    renderSummary(allRoutes);
    await fetchGeminiInsight(allRoutes, mode);

    updateLiveStatus(`Live route update active for ${mode}`);
    startAutoRefresh();
  } catch (err) {
    console.error(err);
    alert(err.message || "Could not calculate routes");
    updateLiveStatus("Route calculation failed");
  } finally {
    setLoading(false);
  }
}

function startAutoRefresh() {
  if (liveRefreshTimer) clearInterval(liveRefreshTimer);

  const intervalValue = Number(document.getElementById("refresh-interval").value);
  if (!intervalValue) return;

  liveRefreshTimer = setInterval(async () => {
    if (!currentFromCoords || !currentToCoords) return;

    try {
      if (usingLiveLocationAsStart) {
        await refreshCurrentLocationSilently();
      }

      const mode = document.getElementById("mode-select").value;
      allRoutes = await fetchRealRoutes(currentFromCoords, currentToCoords, mode);
      drawRoutes(allRoutes);
      displayRoutes(allRoutes);
      renderSummary(allRoutes);
      updateLiveStatus(`Last refreshed at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      console.error("Auto refresh failed:", err);
    }
  }, intervalValue * 1000);
}

function useCurrentLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported in this browser.");
    return;
  }

  updateLiveStatus("Fetching your live location...");

  navigator.geolocation.getCurrentPosition(
    position => {
      const { latitude, longitude } = position.coords;
      currentFromCoords = { lat: latitude, lon: longitude, name: "Current Location" };
      currentFromAddress = `Current Location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
      usingLiveLocationAsStart = true;

      document.getElementById("from-input").value = currentFromAddress;
      map.setView([latitude, longitude], 14);

      updateLiveStatus("Using your current location as start point");
    },
    error => {
      console.error(error);
      alert("Unable to access current location.");
      updateLiveStatus("Could not fetch current location");
    },
    { enableHighAccuracy: true, timeout: 15000 }
  );
}

async function refreshCurrentLocationSilently() {
  if (!navigator.geolocation) return;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        currentFromCoords = { lat: latitude, lon: longitude, name: "Current Location" };
        currentFromAddress = `Current Location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
        document.getElementById("from-input").value = currentFromAddress;
        resolve();
      },
      () => resolve(),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  });
}