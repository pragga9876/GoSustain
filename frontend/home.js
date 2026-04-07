document.addEventListener('DOMContentLoaded', () => {
  // --- Element References ---
  // Sidebar elements
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');

  // Other interactive elements
  const startButton = document.querySelector('.button-primary');
  const faqCard = document.querySelector('.faq-card');
  const howItWorksToggle = document.getElementById('how-it-works-toggle');
  const howItWorksSection = document.getElementById('how-it-works-section');

  // --- Sidebar Toggle Logic ---
  function openSidebar() {
    if (sidebar) sidebar.classList.add('open');
    if (sidebarOverlay) sidebarOverlay.classList.add('open');
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('open');
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', openSidebar);
  }
  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', closeSidebar);
  }
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
  }

  // --- NEW: Dark Mode Toggle Logic ---
  // Get references to the sidebar button elements
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeToggleIcon = document.getElementById('theme-toggle-icon');
  const themeToggleText = document.getElementById('theme-toggle-text');

  // Function to update the button's icon and text
  function updateSidebarButton(theme) {
    if (!themeToggleIcon || !themeToggleText) return; // Safety check

    if (theme === 'dark') {
      themeToggleIcon.textContent = 'light_mode';
      themeToggleText.textContent = 'Light Mode';
    } else {
      themeToggleIcon.textContent = 'dark_mode';
      themeToggleText.textContent = 'Dark Mode';
    }
  }

  // Add the click listener
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      // Check the CURRENT theme from the <html> tag
      const isDark = document.documentElement.classList.contains('dark');
      const newTheme = isDark ? 'light' : 'dark';
      
      // Call the global function from theme.js (must be loaded first!)
      if (typeof setTheme === 'function') {
        setTheme(newTheme); 
      } else {
        console.error('Error: theme.js is not loaded or setTheme is not defined.');
        return;
      }
      
      // Update the button's appearance
      updateSidebarButton(newTheme);
    });
  }

  // On page load, make sure the button's text is correct
  const currentTheme = localStorage.getItem('theme') || 'light';
  updateSidebarButton(currentTheme);

  // --- Other Interactions (from original script) ---
  if (startButton) {
    startButton.addEventListener('click', () => {
      console.log('Start Your Journey button clicked!');
    });
  }

  if (faqCard) {
    faqCard.addEventListener('click', () => {
      console.log('FAQ card clicked!');
    });
  }
  
  // --- "How it Works" Toggle Logic ---
  if (howItWorksToggle && howItWorksSection) {
    howItWorksToggle.addEventListener('click', () => {
      const isExpanded = howItWorksToggle.getAttribute('aria-expanded') === 'true';

      if (isExpanded) {
        howItWorksToggle.setAttribute('aria-expanded', 'false');
        howItWorksSection.classList.remove('open');
      } else {
        howItWorksToggle.setAttribute('aria-expanded', 'true');
        howItWorksSection.classList.add('open');
      }
    });
  }
});