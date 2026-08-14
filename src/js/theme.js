import * as dom from './dom.js';

export function setTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  const isDark = theme === 'dark';

  if (dom.hljsLightTheme) dom.hljsLightTheme.disabled = isDark;
  if (dom.hljsDarkTheme) dom.hljsDarkTheme.disabled = !isDark;

  const lightIcon = dom.$('#themeIconLight');
  const darkIcon = dom.$('#themeIconDark');
  if (lightIcon) lightIcon.style.display = isDark ? 'none' : 'block';
  if (darkIcon) darkIcon.style.display = isDark ? 'block' : 'none';
}

export function initializeTheme() {
  dom.themeToggle.addEventListener('click', () => {
    const newTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  });

  const savedTheme = localStorage.getItem('theme') ?? 'light';
  setTheme(savedTheme);
}