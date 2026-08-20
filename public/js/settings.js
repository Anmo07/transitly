/**
 * Transitly — Settings Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.toggle-checkbox').forEach((toggle) => {
    toggle.addEventListener('change', (e) => {
      console.log('[Settings] Preference updated:', e.target.checked);
    });
  });
});
