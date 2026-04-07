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

  // --- Dark Mode Toggle Logic ---
  function setTheme(theme) {
    if (theme === 'dark') {
      htmlElement.classList.remove('light');
      htmlElement.classList.add('dark');
      if (themeToggleIcon) themeToggleIcon.textContent = 'light_mode';
      if (themeToggleText) themeToggleText.textContent = 'Light Mode';
      localStorage.setItem('theme', 'dark');
    } else {
      htmlElement.classList.remove('dark');
      htmlElement.classList.add('light');
      if (themeToggleIcon) themeToggleIcon.textContent = 'dark_mode';
      if (themeToggleText) themeToggleText.textContent = 'Dark Mode';
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
    // Default to light if no preference
    setTheme('light');
  }
});