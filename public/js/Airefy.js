console.log("Airefy.js loaded");

const $ = (id) => document.getElementById(id);

// Elements
const searchInput = $("searchInput");
const place = $("h-current");
const updated = $("updated");
const pm25 = $("pm25");
const recs = $("recs");
const bdBar = $("bdBar");
const bdLegend = $("bdLegend");
const resetBtn = $("resetBtn");
const themeBtn = $("themeBtn");
const compareSelect = $("compareSelect");

// ------------------- DARK MODE -------------------
document.body.classList.remove("dark-mode"); // default light
themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  themeBtn.setAttribute("aria-pressed", document.body.classList.contains("dark-mode"));
});

// ------------------- RESET -------------------
resetBtn.addEventListener("click", () => {
  searchInput.value = "";
  place.textContent = "—";
  updated.textContent = "—";
  pm25.textContent = "—";
  recs.innerHTML = "<li>Search a supported location to see recommendations.</li>";
  bdBar.innerHTML = "";
  bdLegend.innerHTML = "";
});

// ------------------- RECOMMENDATIONS -------------------
function loadRecommendations(pm) {
  recs.innerHTML = "";
  if (pm <= 50) recs.innerHTML = "<li>Air quality is good. Enjoy outdoor activities.</li>";
  else if (pm <= 100) recs.innerHTML = "<li>Moderate — sensitive groups reduce prolonged exertion.</li>";
  else if (pm <= 200) recs.innerHTML = "<li>Unhealthy for sensitive groups — wear a mask.</li>";
  else recs.innerHTML = "<li>Unhealthy — avoid outdoor activities.</li>";
}

// ------------------- MAIN AQI BAR -------------------
const pm25Bar = document.createElement("div");
pm25Bar.className = "bar";
pm25Bar.innerHTML = "<span></span>";
document.querySelector(".aqi").appendChild(pm25Bar);

function animateMainBar(value) {
  const pct = Math.min((value / 500) * 100, 100);
  const span = pm25Bar.querySelector("span");
  span.style.width = "0%";
  setTimeout(() => { span.style.width = pct + "%"; }, 50);
}

// ------------------- POLLUTANT BREAKDOWN -------------------
function updateBreakdown(breakdown) {
  bdBar.innerHTML = "";
  bdLegend.innerHTML = "";
  const pollutants = ["pm25","pm10","no2","so2","o3","co"];
  const colors = { pm25:"var(--c-pm25)", pm10:"var(--c-pm10)", no2:"var(--c-no2)", so2:"var(--c-so2)", o3:"var(--c-o3)", co:"var(--c-co)" };
  const total = Object.values(breakdown).reduce((a,b)=>a+b,0);

  pollutants.forEach(p => {
    const val = breakdown[p];
    const pct = total ? (val/total)*100 : 0;
    const span = document.createElement("span");
    span.className = "bd-segment";
    span.style.width = pct + "%";
    span.style.backgroundColor = colors[p];
    bdBar.appendChild(span);

    const legendItem = document.createElement("div");
    legendItem.className = "legend-item";
    legendItem.innerHTML = `<div class="dot" style="background-color:${colors[p]}"></div> ${p.toUpperCase()}: ${val}`;
    bdLegend.appendChild(legendItem);
  });
}

// ------------------- FETCH AQI -------------------
async function fetchAQI(q) {
  try {
    const res = await fetch(`/airefy/api/aqi?q=${q}`);
    const json = await res.json();
    if (!json.success) { alert(json.error); return; }
    const d = json.data;

    // Main display
    place.textContent = d.label;
    updated.textContent = "Updated: " + new Date(d.updatedAt).toLocaleString();
    pm25.textContent = d.pm25;

    animateMainBar(d.pm25);
    updateBreakdown(d.breakdown);
    loadRecommendations(d.pm25);

  } catch(err) { console.error(err); alert("Error fetching AQI"); }
}

// ------------------- SEARCH -------------------
function handleSearch() {
  const q = searchInput.value.trim();
  if (q) fetchAQI(q);
}
searchInput.addEventListener("keydown", (e) => { if(e.key==="Enter") handleSearch(); });

// ------------------- COMPARE OPTIONS -------------------
async function loadCompareOptions() {
  try {
    const res = await fetch("/airefy/api/compare-options");
    const options = await res.json();
    compareSelect.innerHTML = "";
    options.forEach(opt => {
      const el = document.createElement("option");
      el.value = opt.id;
      el.textContent = opt.label;
      compareSelect.appendChild(el);
    });
  } catch(err) {
    console.error(err);
    compareSelect.innerHTML = `<option value="baseline">Very Good (PM2.5 12)</option>`;
  }
}
loadCompareOptions();
