document.addEventListener('DOMContentLoaded', () => {
  // --- Element References ---
  const htmlElement = document.documentElement;

  // Sidebar elements
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');

  // Theme toggle elements
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeToggleIcon = document.getElementById('theme-toggle-icon');
  const themeToggleText = document.getElementById('theme-toggle-text');

  // Other interactive elements
  const startButton = document.querySelector('.button-primary');
  const faqCard = document.querySelector('.faq-card');

  // --- NEW: Sidebar Toggle Logic ---
  function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('open');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
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

  // --- UPDATED: Dark Mode Toggle Logic ---
  function setTheme(theme) {
    if (theme === 'dark') {
      htmlElement.classList.remove('light');
      htmlElement.classList.add('dark');
      themeToggleIcon.textContent = 'light_mode';
      themeToggleText.textContent = 'Light Mode';
      localStorage.setItem('theme', 'dark');
    } else {
      htmlElement.classList.remove('dark');
      htmlElement.classList.add('light');
      themeToggleIcon.textContent = 'dark_mode';
      themeToggleText.textContent = 'Dark Mode';
      localStorage.setItem('theme', 'light');
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      if (htmlElement.classList.contains('light')) {
        setTheme('dark');
      } else {
        setTheme('light');
      }
    });
  }

  // --- Check for saved theme preference on load ---
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    // Optional: Check system preference
    /*
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
    */
    // Default to light if no preference
    setTheme('light');
  }


  // --- Other Interactions (from original script) ---
  if (startButton) {
    startButton.addEventListener('click', () => {
      console.log('Start Your Journey button clicked!');
      // Add navigation or other logic here
    });
  }

  if (faqCard) {
    faqCard.addEventListener('click', () => {
      console.log('FAQ card clicked!');
      // Navigate to FAQ page, e.g., window.location.href = '/faq';
    });
  }
  // 
  // =====================================================
  // NEW: "How it Works" Toggle Logic
  // =====================================================
  //
  const howItWorksToggle = document.getElementById('how-it-works-toggle');
  const howItWorksSection = document.getElementById('how-it-works-section');

  if (howItWorksToggle && howItWorksSection) {
    howItWorksToggle.addEventListener('click', () => {
      // Check the current state from the aria-expanded attribute
      const isExpanded = howItWorksToggle.getAttribute('aria-expanded') === 'true';

      if (isExpanded) {
        // It's open, so close it
        howItWorksToggle.setAttribute('aria-expanded', 'false');
        howItWorksSection.classList.remove('open');
      } else {
        // It's closed, so open it
        howItWorksToggle.setAttribute('aria-expanded', 'true');
        howItWorksSection.classList.add('open');
      }
    });
  }
});