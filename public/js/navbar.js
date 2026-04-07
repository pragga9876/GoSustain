document.addEventListener("DOMContentLoaded", () => {
  const htmlElement = document.documentElement;

  // Sidebar elements
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const sidebarCloseBtn = document.getElementById("sidebar-close-btn");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebar-overlay");

  // Theme toggle elements
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const themeToggleIcon = document.getElementById("theme-toggle-icon");
  const themeToggleText = document.getElementById("theme-toggle-text");

  // --- Sidebar Scroll Lock ---
  function disableBodyScroll() {
    document.body.style.overflow = "hidden"; // prevent body scroll
  }

  function enableBodyScroll() {
    document.body.style.overflow = ""; // restore body scroll
  }

  // --- Sidebar Toggle Logic ---
  function openSidebar() {
    if (sidebar) sidebar.classList.add("open");
    if (sidebarOverlay) sidebarOverlay.classList.add("open");
    disableBodyScroll(); // ✅ stop background from scrolling
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove("open");
    if (sidebarOverlay) sidebarOverlay.classList.remove("open");
    enableBodyScroll(); // ✅ restore background scroll
  }

  if (hamburgerBtn) hamburgerBtn.addEventListener("click", openSidebar);
  if (sidebarCloseBtn) sidebarCloseBtn.addEventListener("click", closeSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebar);

  // --- Make sidebar scrollable internally ---
  if (sidebar) {
    sidebar.style.overflowY = "auto"; // ✅ allow sidebar itself to scroll
    sidebar.style.maxHeight = "100vh"; // full height scroll area
  }

  // --- Dark Mode Toggle Logic ---
  function setTheme(theme) {
    if (theme === "dark") {
      htmlElement.classList.remove("light");
      htmlElement.classList.add("dark");
      if (themeToggleIcon) themeToggleIcon.textContent = "light_mode";
      if (themeToggleText) themeToggleText.textContent = "Light Mode";
      localStorage.setItem("theme", "dark");
    } else {
      htmlElement.classList.remove("dark");
      htmlElement.classList.add("light");
      if (themeToggleIcon) themeToggleIcon.textContent = "dark_mode";
      if (themeToggleText) themeToggleText.textContent = "Dark Mode";
      localStorage.setItem("theme", "light");
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      if (htmlElement.classList.contains("light")) {
        setTheme("dark");
      } else {
        setTheme("light");
      }
    });
  }

  // --- Load saved theme on start ---
  const savedTheme = localStorage.getItem("theme");
  setTheme(savedTheme || "light");
});
