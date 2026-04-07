// 1. Get reference to the <html> element
const htmlElement = document.documentElement;

/**
 * 2. Define the function to set the theme.
 * This function can be called from any page's specific script.
 * @param {'light' | 'dark'} theme - The theme to set.
 */
function setTheme(theme) {
  if (theme === 'dark') {
    htmlElement.classList.remove('light');
    htmlElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    htmlElement.classList.remove('dark');
    htmlElement.classList.add('light');
    localStorage.setItem('theme', 'light');
  }
}

// 3. Run on page load: Check for a saved theme in localStorage
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  setTheme(savedTheme);
} else {
  // Default to light theme if nothing is saved
  setTheme('light'); 
}