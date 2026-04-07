// =====================================================================
//  WASTE & RECYCLING — Final JS (Fully Working)
// =====================================================================

// ------- SLIDER ELEMENTS -------
const sliderTrack = document.querySelector(".slider-track");
const sliderProgress = document.querySelector(".slider-progress");
const sliderThumb = document.querySelector(".slider-thumb");
const sliderValueDisplay = document.querySelector(".slider-value-desktop");

// Value range → 0–100 kg
const minKg = 0;
const maxKg = 100;

let isDragging = false;
let currentKg = 32; // DEFAULT KG

// ------- UPDATE SLIDER (MAIN FUNCTION) -------
function setSlider(percentage) {
    percentage = Math.max(0, Math.min(100, percentage));

    // Convert % → KG
    currentKg = Math.round((percentage / 100) * (maxKg - minKg) + minKg);

    // Apply UI updates
    sliderProgress.style.width = percentage + "%";
    sliderThumb.style.left = percentage + "%";
    sliderValueDisplay.textContent = currentKg + " kg";

    // Store inside a hidden field for backend
    document.getElementById("wasteKgInput").value = currentKg;
}

// ------- PERCENTAGE CALCULATION -------
function updateSliderFromEvent(clientX) {
    const rect = sliderTrack.getBoundingClientRect();
    const percent = ((clientX - rect.left) / rect.width) * 100;
    setSlider(percent);
}

// ------- MOUSE EVENTS -------
sliderTrack.addEventListener("mousedown", (e) => {
    isDragging = true;
    sliderThumb.classList.add("is-dragging");
    updateSliderFromEvent(e.clientX);

    document.addEventListener("mousemove", mouseMove);
    document.addEventListener("mouseup", mouseUp);
});

function mouseMove(e) {
    if (isDragging) updateSliderFromEvent(e.clientX);
}

function mouseUp() {
    isDragging = false;
    sliderThumb.classList.remove("is-dragging");

    document.removeEventListener("mousemove", mouseMove);
    document.removeEventListener("mouseup", mouseUp);
}

// ------- TOUCH EVENTS -------
sliderTrack.addEventListener("touchstart", (e) => {
    isDragging = true;
    sliderThumb.classList.add("is-dragging");
    updateSliderFromEvent(e.touches[0].clientX);

    document.addEventListener("touchmove", touchMove, { passive: false });
    document.addEventListener("touchend", touchEnd);
});

function touchMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    updateSliderFromEvent(e.touches[0].clientX);
}

function touchEnd() {
    isDragging = false;
    sliderThumb.classList.remove("is-dragging");

    document.removeEventListener("touchmove", touchMove);
    document.removeEventListener("touchend", touchEnd);
}

// ------- INITIAL SLIDER VALUE -------
setSlider(32); // default 32 kg


// =====================================================================
//  TOGGLE LOGIC — Return TRUE / FALSE
// =====================================================================

const recycleToggle = document.getElementById("recycleToggle");
const compostToggle = document.getElementById("compostToggle");

// write values to hidden inputs so backend receives them
recycleToggle.addEventListener("change", () => {
    document.getElementById("recycleInput").value = recycleToggle.checked ? "yes" : "no";
});

compostToggle.addEventListener("change", () => {
    document.getElementById("compostInput").value = compostToggle.checked ? "yes" : "no";
});


// =====================================================================
//  NEXT BUTTON → SUBMIT FORM
// =====================================================================

document.querySelector(".button-next").addEventListener("click", () => {
    document.getElementById("wasteForm").submit();
});
