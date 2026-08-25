/**
 * Transitly — All Services Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // Service card click handlers
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('click', () => {
      const route = card.getAttribute('data-route') || 'HR-DEL-CHD';
      if (window.openBookingModal) {
        window.openBookingModal(route);
      }
    });
  });
});
