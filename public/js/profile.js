/**
 * Transitly — Profile Hub Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      alert('Session ended. Successfully logged out.');
    });
  }
});
