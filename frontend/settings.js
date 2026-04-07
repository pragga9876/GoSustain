// --- Page Navigation Functions ---

// Function to handle back button click
function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    // Optional: Redirect to a home page if no history
    // window.location.href = 'home.html';
    console.log('No previous page in history');
  }
}

// Function to handle settings navigation
function navigateToSetting(setting) {
  console.log('Navigating to:', setting);
  // You can replace this with actual navigation logic
  // Example: window.location.href = `/settings/${setting}.html`;
}

// --- Theme Toggle Logic ---

/**
 * This function is called by the onchange="" in your HTML
 * It connects this page's toggle to the global theme.js
 */
function toggleAppearance() {
  const toggle = document.getElementById('appearanceToggle');
  
  // Call the global function from theme.js
  if (typeof setTheme === 'function') {
    if (toggle.checked) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  } else {
    // This error will appear if theme.js is not loaded FIRST in your HTML
    console.error('Error: theme.js is not loaded or setTheme is not defined.');
  }
}

/**
 * This code runs immediately to set the toggle's initial state.
 * It waits for the page to load, then checks localStorage
 * to see if the toggle should be 'on' or 'off'.
 */
(function() {
  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('appearanceToggle');
    if (toggle) {
      // Check the theme from localStorage (set by theme.js)
      const currentTheme = localStorage.getItem('theme') || 'light';
      
      // Set the toggle's 'checked' state to match the saved theme
      toggle.checked = (currentTheme === 'dark');
    }
  });
})();