// Wait for the document to be fully loaded before running script
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Button Logic (from your previous file) ---
    const prevButton = document.querySelector('.button-previous');
    const nextButton = document.querySelector('.button-next');

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            // You could, for example, go to the previous page
            // window.location.href = 'previous-page.html';
            console.log('Previous button clicked');
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            // Go to the results page
            // window.location.href = 'results-page.html';
            console.log('View Results button clicked');
        });
    }

    // The toggle switches work with pure CSS (:has selector)
    // so no JS is needed for them.

    // --- 2. Slider Logic (newly added) ---
    
    // Select Slider Elements
    const sliderTrack = document.querySelector('.slider-track');
    const sliderProgress = document.querySelector('.slider-progress');
    const sliderThumb = document.querySelector('.slider-thumb');
    const sliderValueDisplay = document.querySelector('.slider-value-desktop');

    // Check if slider elements exist before adding listeners
    if (sliderTrack && sliderProgress && sliderThumb && sliderValueDisplay) {

        // --- NEW: Define the range for KG ---
        const minKg = 0;
        const maxKg = 100;
        // ------------------------------------

        let isDragging = false;

        // Main Update Function
        function setSliderValue(percentage) {
            let clampedPercentage = Math.max(0, Math.min(100, percentage));
            let percentString = clampedPercentage.toFixed(0) + '%';

            // --- NEW: Calculate KG value ---
            let kgValue = (clampedPercentage / 100) * (maxKg - minKg) + minKg;
            let kgString = kgValue.toFixed(0) + 'kg'; // e.g., "32kg"
            // -------------------------------
            
            sliderProgress.style.width = percentString;
            sliderThumb.style.left = percentString;
            sliderValueDisplay.textContent = kgString; // <-- Update to show KG
        }

        // Calculate percentage from event
        function updateSliderFromEvent(clientX) {
            const trackRect = sliderTrack.getBoundingClientRect();
            const trackWidth = trackRect.width;

            if (trackWidth === 0) return;

            const x = clientX - trackRect.left;
            let percentage = (x / trackWidth) * 100;
            setSliderValue(percentage);
        }

        // Mouse Event Handlers
        function onMouseDown(event) {
            event.preventDefault();
            isDragging = true;
            sliderThumb.classList.add('is-dragging');
            updateSliderFromEvent(event.clientX);
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }

        function onMouseMove(event) {
            if (!isDragging) return;
            updateSliderFromEvent(event.clientX);
        }

        function onMouseUp() {
            isDragging = false;
            sliderThumb.classList.remove('is-dragging');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
        
        // Touch Event Handlers
        function onTouchStart(event) {
            isDragging = true;
            sliderThumb.classList.add('is-dragging');
            updateSliderFromEvent(event.touches[0].clientX);
            document.addEventListener('touchmove', onTouchMove, { passive: false });
            document.addEventListener('touchend', onTouchEnd);
        }
        
        function onTouchMove(event) {
            if (!isDragging) return;
            event.preventDefault(); 
            updateSliderFromEvent(event.touches[0].clientX);
        }
        
        function onTouchEnd() {
            isDragging = false;
            sliderThumb.classList.remove('is-dragging');
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
        }

        // Attach Initial Listeners
        sliderTrack.addEventListener('mousedown', onMouseDown);
        sliderTrack.addEventListener('touchstart', onTouchStart, { passive: false });

        // Set Initial Value
        // --- MODIFIED: Read initial % from style, not text ---
        let initialPercentStyle = sliderProgress.style.width || '0%';
        let initialPercent = parseFloat(initialPercentStyle) || 0;
        setSliderValue(initialPercent);

    } else {
        // This is helpful for debugging if the slider isn't working
        console.warn("Slider elements not found. Skipping slider script.");
    }
});