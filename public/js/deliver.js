/**
 * Transitly — Deliver / Home Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // Corridor Quick-Picks Trigger Modal
  document.querySelectorAll('.corridor-quick-pick').forEach((card) => {
    card.addEventListener('click', () => {
      const route = card.getAttribute('data-route');
      if (window.openBookingModal) {
        window.openBookingModal(route);
      }
    });
  });

  // Home Quick Search
  const btnQuickSearch = document.getElementById('btnQuickSearch');
  const homeSearchInput = document.getElementById('homeSearchInput');

  const executeSearch = () => {
    const val = homeSearchInput ? homeSearchInput.value.trim() : '';
    if (val.toUpperCase().startsWith('TRK-') || val.length >= 5) {
      window.location.href = `/tracking.html?id=${encodeURIComponent(val)}`;
    } else {
      if (window.openBookingModal) window.openBookingModal();
    }
  };

  if (btnQuickSearch) {
    btnQuickSearch.addEventListener('click', executeSearch);
  }

  if (homeSearchInput) {
    homeSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        executeSearch();
      }
    });
  }
});
