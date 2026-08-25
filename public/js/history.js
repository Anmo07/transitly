/**
 * Transitly — Delivery History Controller
 * Handles live search query filtering and status chip tabs (All, Delivered, In Transit, Cancelled)
 */

document.addEventListener('DOMContentLoaded', () => {
  const historyChips = document.querySelectorAll('.history-chip');
  const historyCards = document.querySelectorAll('.history-item-card');
  const historySearchInput = document.getElementById('historySearchInput');
  const btnClearHistorySearch = document.getElementById('btnClearHistorySearch');
  const emptyState = document.getElementById('historyEmptyState');
  let activeHistoryFilter = 'ALL';

  /**
   * Filter cards based on active filter chip + search query
   */
  const filterHistory = () => {
    const rawQuery = historySearchInput ? historySearchInput.value : '';
    const query = rawQuery.toLowerCase().trim();

    // Show/hide clear button
    if (btnClearHistorySearch) {
      if (query.length > 0) {
        btnClearHistorySearch.classList.remove('hidden');
      } else {
        btnClearHistorySearch.classList.add('hidden');
      }
    }

    let visibleCount = 0;

    historyCards.forEach((card) => {
      const status = card.getAttribute('data-status') || '';
      const searchData = (card.getAttribute('data-search') || '').toLowerCase();
      const textContent = card.innerText.toLowerCase();

      // Check Status Match
      const matchesStatus = activeHistoryFilter === 'ALL' || status === activeHistoryFilter;

      // Check Search Query Match
      const matchesSearch = query === '' || searchData.includes(query) || textContent.includes(query);

      const isVisible = matchesStatus && matchesSearch;

      card.style.display = isVisible ? 'flex' : 'none';
      if (isVisible) visibleCount++;
    });

    // Toggle month section header visibility if all cards in month are hidden
    document.querySelectorAll('.history-month-section').forEach((section) => {
      const cards = section.querySelectorAll('.history-item-card');
      const hasVisible = Array.from(cards).some((c) => c.style.display !== 'none');
      section.style.display = hasVisible ? 'block' : 'none';
    });

    // Show empty state if no deliveries found
    if (emptyState) {
      if (visibleCount === 0) {
        emptyState.classList.remove('hidden');
      } else {
        emptyState.classList.add('hidden');
      }
    }
  };

  // Wire up filter chips
  historyChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      activeHistoryFilter = (chip.getAttribute('data-filter') || 'ALL').toUpperCase();

      // Update chip styling
      historyChips.forEach((c) => {
        c.className = 'history-chip flex-shrink-0 bg-surface text-on-surface-variant border border-surface-variant font-label-md text-label-md px-4 py-2 rounded-full hover:bg-surface-variant transition-colors active:scale-95';
      });
      chip.className = 'history-chip flex-shrink-0 bg-primary text-on-primary font-label-md text-label-md px-4 py-2 rounded-full shadow-[0px_4px_12px_rgba(0,80,203,0.15)] transition-transform active:scale-95';

      filterHistory();
    });
  });

  // Wire up search input
  if (historySearchInput) {
    historySearchInput.addEventListener('input', filterHistory);
    historySearchInput.addEventListener('keyup', filterHistory);
  }

  // Wire up clear button
  if (btnClearHistorySearch) {
    btnClearHistorySearch.addEventListener('click', () => {
      if (historySearchInput) {
        historySearchInput.value = '';
        historySearchInput.focus();
        filterHistory();
      }
    });
  }

  // Click card to open live tracking
  historyCards.forEach((card) => {
    card.addEventListener('click', () => {
      const trackingId = card.getAttribute('data-tracking-id') || 'TRK-88219';
      window.location.href = `/tracking?id=${encodeURIComponent(trackingId)}`;
    });
  });

  // Initial execution
  filterHistory();
});
