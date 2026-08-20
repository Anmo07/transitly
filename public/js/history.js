/**
 * Transitly — Delivery History Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const historyChips = document.querySelectorAll('.history-chip');
  const historyCards = document.querySelectorAll('.history-item-card');
  const historySearchInput = document.getElementById('historySearchInput');
  let activeHistoryFilter = 'ALL';

  const filterHistory = () => {
    const query = historySearchInput ? historySearchInput.value.toLowerCase().trim() : '';
    historyCards.forEach((card) => {
      const status = card.getAttribute('data-status');
      const searchData = (card.getAttribute('data-search') || '').toLowerCase();
      const matchesStatus = activeHistoryFilter === 'ALL' || status === activeHistoryFilter;
      const matchesSearch = query === '' || searchData.includes(query);
      card.style.display = (matchesStatus && matchesSearch) ? 'block' : 'none';
    });
  };

  historyChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      activeHistoryFilter = chip.getAttribute('data-filter') || 'ALL';
      historyChips.forEach((c) => {
        c.className = 'history-chip shrink-0 bg-surface text-on-surface-variant border border-outline-variant/50 text-xs font-semibold px-3.5 py-1.5 rounded-full hover:bg-surface-variant';
      });
      chip.className = 'history-chip shrink-0 bg-primary text-on-primary text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-sm';
      filterHistory();
    });
  });

  if (historySearchInput) {
    historySearchInput.addEventListener('input', filterHistory);
  }

  // Click card to track
  historyCards.forEach(card => {
    card.addEventListener('click', () => {
      window.location.href = '/tracking.html?id=TRK-88219';
    });
  });
});
