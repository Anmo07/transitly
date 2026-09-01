/**
 * Transitly — Delivery History Controller
 * Handles live search query filtering, status chip tabs, and
 * Delivery Details Dialog Modal Popup (without redirecting).
 */

document.addEventListener('DOMContentLoaded', () => {
  const historyChips = document.querySelectorAll('.history-chip');
  const historyCards = document.querySelectorAll('.history-item-card');
  const historySearchInput = document.getElementById('historySearchInput');
  const btnClearHistorySearch = document.getElementById('btnClearHistorySearch');
  const emptyState = document.getElementById('historyEmptyState');

  // Modal Elements
  const modal = document.getElementById('modalDeliveryDetails');
  const btnCloseModal = document.getElementById('btnCloseDeliveryModal');
  const btnModalCloseSecondary = document.getElementById('btnModalCloseSecondary');
  const btnCopyDetailTrackingId = document.getElementById('btnCopyDetailTrackingId');
  const btnModalDownloadReceipt = document.getElementById('btnModalDownloadReceipt');
  const modalLiveTrackingLink = document.getElementById('btnModalLiveTrackingLink');

  let activeHistoryFilter = 'ALL';

  /**
   * Rich Master Database for Delivery Records
   */
  const DELIVERIES_DATA = {
    'TRK-88219': {
      trackingId: 'TRK-88219',
      title: 'Chandigarh ISBT Sector 17',
      status: 'IN_TRANSIT',
      statusLabel: 'In Transit',
      statusBadgeClass: 'bg-primary-container/20 text-primary',
      icon: 'directions_bus',
      iconClass: 'bg-primary-container/10 text-primary border border-primary-container/30',
      origin: 'ISBT Kashmiri Gate, Delhi',
      sender: 'Aarav Sharma • +91 98765 43210',
      carrier: 'Fleet Bus #402 (Haryana Roadways Express • HR-68-A-1001)',
      destination: 'ISBT Sector 17, Chandigarh',
      receiver: 'Rohan Verma • +91 98123 45678',
      weight: '5.0 kg',
      serviceTier: 'Express Corridors',
      fare: '₹450.00 (Prepaid UPI)',
      date: 'Today, Oct 28',
      securityText: 'QR Seal #QR-88219 Active • Recipient OTP required',
      timeline: [
        { time: '10:00 AM', label: 'Order Confirmed & Pickup Handoff', done: true },
        { time: '11:15 AM', label: 'Loaded into Bus Luggage Bay (QR Seal Scanned)', done: true },
        { time: '12:45 PM', label: 'En-Route GT Road Highway (Crossed Karnal Oasis)', done: true, active: true },
        { time: 'Est. 02:30 PM', label: 'Expected Arrival at Chandigarh Terminal', done: false }
      ]
    },
    'TRK-60912': {
      trackingId: 'TRK-60912',
      title: '124 Maple Street, Apt 4B, Jaipur',
      status: 'DELIVERED',
      statusLabel: 'Delivered',
      statusBadgeClass: 'bg-[#e6f4ea] text-[#137333]',
      icon: 'check_circle',
      iconClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      origin: 'Tikri Hub, Delhi West',
      sender: 'Priya Mehta • +91 98990 11223',
      carrier: 'Uber Direct First-Mile + Fleet Bus #108 (Jaipur Express)',
      destination: '124 Maple Street, Apt 4B, Jaipur',
      receiver: 'Amit Roy • +91 97881 22334',
      weight: '3.2 kg',
      serviceTier: 'Door-to-Door Standard',
      fare: '$12.50 (₹380.00)',
      date: 'Oct 24, 2023',
      securityText: 'Delivered to Doorstep • Verified with OTP (882194)',
      timeline: [
        { time: '08:30 AM', label: 'First-Mile Pickup completed by Uber Direct', done: true },
        { time: '10:15 AM', label: 'Loaded into Express Bus at Dhaula Kuan Hub', done: true },
        { time: '01:45 PM', label: 'Arrived at Sindhi Camp Terminal Jaipur', done: true },
        { time: '02:30 PM', label: 'Handed over to recipient (Digital Signature & OTP)', done: true }
      ]
    },
    'TRK-74911': {
      trackingId: 'TRK-74911',
      title: '890 Tech Blvd, Suite 200, Sirsa',
      status: 'DELIVERED',
      statusLabel: 'Delivered',
      statusBadgeClass: 'bg-[#e6f4ea] text-[#137333]',
      icon: 'check_circle',
      iconClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      origin: 'Delhi Connaught Place Hub',
      sender: 'Devansh Singla • +91 98111 22334',
      carrier: 'CitySprint Logistics + Haryana Roadways Bus #204',
      destination: '890 Tech Blvd, Suite 200, Sirsa',
      receiver: 'Tech Innovations Ltd • +91 98222 33445',
      weight: '1.5 kg',
      serviceTier: 'Express Bus Cargo',
      fare: '$8.00 (₹240.00)',
      date: 'Oct 21, 2023',
      securityText: 'Delivered • Proof of Delivery archived in system',
      timeline: [
        { time: '07:00 AM', label: 'Package sealed with tamper-proof QR lock', done: true },
        { time: '08:00 AM', label: 'Dispatched on Delhi-Sirsa Direct Corridor', done: true },
        { time: '10:15 AM', label: 'Delivered at Sirsa Tech Hub Reception', done: true }
      ]
    },
    'TRK-45123': {
      trackingId: 'TRK-45123',
      title: '45 West End Ave, Delhi',
      status: 'DELIVERED',
      statusLabel: 'Delivered',
      statusBadgeClass: 'bg-[#e6f4ea] text-[#137333]',
      icon: 'check_circle',
      iconClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      origin: 'Ambala Cantt Hub, Haryana',
      sender: 'Karan Mehra • +91 98444 55667',
      carrier: 'inDrive Courier + State Transport Express',
      destination: '45 West End Ave, Delhi',
      receiver: 'Simran Kaur • +91 98555 66778',
      weight: '4.8 kg',
      serviceTier: 'Standard Transit',
      fare: '$15.75 (₹420.00)',
      date: 'Sep 15, 2023',
      securityText: 'Delivered • Verified OTP and photo proof captured',
      timeline: [
        { time: '01:00 PM', label: 'Dropped at Ambala Cantt Bus Depot', done: true },
        { time: '03:30 PM', label: 'Intercity Highway Transit completed', done: true },
        { time: '06:45 PM', label: 'Final delivery completed to recipient', done: true }
      ]
    },
    'TRK-99012': {
      trackingId: 'TRK-99012',
      title: '770 Pine Street, Panipat',
      status: 'CANCELLED',
      statusLabel: 'Cancelled',
      statusBadgeClass: 'bg-surface-variant text-on-surface-variant',
      icon: 'cancel',
      iconClass: 'bg-rose-100 text-rose-700 border border-rose-200',
      origin: 'ISBT Kashmiri Gate, Delhi',
      sender: 'Neha Gupta • +91 98666 77889',
      carrier: 'FastTrack Cargo',
      destination: '770 Pine Street, Panipat',
      receiver: 'Vikram Joshi • +91 98777 88990',
      weight: '2.0 kg',
      serviceTier: 'Standard Delivery',
      fare: '$9.00 (₹250.00 - Refunded)',
      date: 'Sep 02, 2023',
      securityText: 'Order cancelled before bus departure • 100% refund credited',
      timeline: [
        { time: '11:00 AM', label: 'Order created online', done: true },
        { time: '01:00 PM', label: 'Cancelled by Sender (Full refund processed)', done: true, cancelled: true }
      ]
    }
  };

  /**
   * Open Details Modal with Delivery Information
   */
  const openDeliveryModal = (trackingId) => {
    const data = DELIVERIES_DATA[trackingId] || {
      trackingId: trackingId || 'TRK-88219',
      title: 'Intercity Parcel Delivery',
      status: 'DELIVERED',
      statusLabel: 'Delivered',
      statusBadgeClass: 'bg-[#e6f4ea] text-[#137333]',
      icon: 'local_shipping',
      iconClass: 'bg-primary/10 text-primary',
      origin: 'Delhi Central Hub',
      sender: 'Registered Shipper',
      carrier: 'Haryana Roadways Express Bus Network',
      destination: 'Regional Transit Terminal',
      receiver: 'Authorized Consignee',
      weight: '3.0 kg',
      serviceTier: 'Express Corridors',
      fare: '₹350.00',
      date: 'Completed',
      securityText: 'Tamper-proof HMAC seal & OTP verified',
      timeline: [
        { time: 'Start', label: 'Dispatched from origin hub', done: true },
        { time: 'Completed', label: 'Delivered and signed', done: true }
      ]
    };

    if (!modal) return;
    currentActiveDeliveryData = data;

    // Fill Modal Data
    document.getElementById('modalDetailTrackingId').textContent = data.trackingId;
    document.getElementById('modalDetailTitle').textContent = data.title;
    document.getElementById('modalDetailOrigin').textContent = data.origin;
    document.getElementById('modalDetailSender').textContent = data.sender;
    document.getElementById('modalDetailCarrier').textContent = data.carrier;
    document.getElementById('modalDetailDestination').textContent = data.destination;
    document.getElementById('modalDetailReceiver').textContent = data.receiver;
    document.getElementById('modalDetailWeight').textContent = data.weight;
    document.getElementById('modalDetailServiceTier').textContent = data.serviceTier;
    document.getElementById('modalDetailFare').textContent = data.fare;
    document.getElementById('modalDetailDate').textContent = data.date;
    document.getElementById('modalDetailSecurityText').textContent = data.securityText;

    // Status Badge
    const badgeEl = document.getElementById('modalDetailStatusBadge');
    badgeEl.className = `${data.statusBadgeClass} font-bold text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1`;
    badgeEl.innerHTML = `
      <span class="w-1.5 h-1.5 rounded-full ${data.status === 'IN_TRANSIT' ? 'bg-primary animate-pulse' : data.status === 'DELIVERED' ? 'bg-emerald-600' : 'bg-outline'}"></span>
      <span>${data.statusLabel}</span>
    `;

    // Icon
    const iconEl = document.getElementById('modalDetailIcon');
    const iconWrap = document.getElementById('modalDetailIconWrap');
    if (iconEl) iconEl.textContent = data.icon;
    if (iconWrap) iconWrap.className = `w-10 h-10 rounded-2xl ${data.iconClass} flex items-center justify-center shrink-0 shadow-sm`;

    // Live Tracking Link
    if (modalLiveTrackingLink) {
      modalLiveTrackingLink.href = `/tracking?id=${encodeURIComponent(data.trackingId)}`;
    }

    // Timeline Rendering
    const timelineContainer = document.getElementById('modalDetailTimelineContainer');
    if (timelineContainer && data.timeline) {
      let tHtml = '';
      data.timeline.forEach((step, idx) => {
        const isLast = idx === data.timeline.length - 1;
        const bulletColor = step.active
          ? 'bg-primary ring-4 ring-primary/20 animate-pulse'
          : step.cancelled
          ? 'bg-rose-500'
          : step.done
          ? 'bg-emerald-600 text-white'
          : 'bg-outline-variant/50';

        const line = isLast ? '' : '<div class="w-0.5 h-6 bg-outline-variant/30 ml-2 my-0.5"></div>';

        tHtml += `
          <div class="flex items-start gap-3">
            <div class="flex flex-col items-center">
              <span class="w-4 h-4 rounded-full ${bulletColor} flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                ${step.done && !step.active && !step.cancelled ? '✓' : ''}
              </span>
              ${line}
            </div>
            <div class="flex-1 min-w-0 pb-1">
              <div class="flex items-center justify-between">
                <span class="font-bold text-xs ${step.active ? 'text-primary' : 'text-on-surface'}">${step.label}</span>
                <span class="text-[10px] text-on-surface-variant font-medium">${step.time}</span>
              </div>
            </div>
          </div>
        `;
      });
      timelineContainer.innerHTML = tHtml;
    }

    // Open Modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  };

  /**
   * Close Details Modal
   */
  const closeDeliveryModal = () => {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  };

  if (btnCloseModal) btnCloseModal.addEventListener('click', closeDeliveryModal);
  if (btnModalCloseSecondary) btnModalCloseSecondary.addEventListener('click', closeDeliveryModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeDeliveryModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeDeliveryModal();
    }
  });

  let currentActiveDeliveryData = null;

  // Copy tracking ID
  if (btnCopyDetailTrackingId) {
    btnCopyDetailTrackingId.addEventListener('click', () => {
      const trackingId = document.getElementById('modalDetailTrackingId').textContent;
      navigator.clipboard.writeText(trackingId);
      btnCopyDetailTrackingId.innerHTML = `<span class="material-symbols-outlined text-[14px] text-emerald-600">check</span>`;
      setTimeout(() => {
        btnCopyDetailTrackingId.innerHTML = `<span class="material-symbols-outlined text-[14px]">content_copy</span>`;
      }, 1500);
    });
  }

  // Automated Tax Invoice & Consignment Receipt Generation
  if (btnModalDownloadReceipt) {
    btnModalDownloadReceipt.addEventListener('click', () => {
      const trackingId = document.getElementById('modalDetailTrackingId').textContent;
      const data = currentActiveDeliveryData || DELIVERIES_DATA[trackingId] || { trackingId };

      btnModalDownloadReceipt.innerHTML = `<span class="material-symbols-outlined text-[15px] animate-spin">refresh</span> <span>Generating...</span>`;
      
      setTimeout(() => {
        if (typeof window.generateTransitlyInvoice === 'function') {
          window.generateTransitlyInvoice(data);
        }
        btnModalDownloadReceipt.innerHTML = `<span class="material-symbols-outlined text-[15px] text-emerald-600">check</span> <span class="text-emerald-600 font-bold">Generated!</span>`;
        setTimeout(() => {
          btnModalDownloadReceipt.innerHTML = `<span class="material-symbols-outlined text-[15px]">download</span> <span>Receipt</span>`;
        }, 2500);
      }, 500);
    });
  }

  /**
   * Filter cards based on active filter chip + search query
   */
  const filterHistory = () => {
    const rawQuery = historySearchInput ? historySearchInput.value : '';
    const query = rawQuery.toLowerCase().trim();

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

      const matchesStatus = activeHistoryFilter === 'ALL' || status === activeHistoryFilter;
      const matchesSearch = query === '' || searchData.includes(query) || textContent.includes(query);
      const isVisible = matchesStatus && matchesSearch;

      card.style.display = isVisible ? 'flex' : 'none';
      if (isVisible) visibleCount++;
    });

    document.querySelectorAll('.history-month-section').forEach((section) => {
      const cards = section.querySelectorAll('.history-item-card');
      const hasVisible = Array.from(cards).some((c) => c.style.display !== 'none');
      section.style.display = hasVisible ? 'block' : 'none';
    });

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

  // Click card to open Delivery Details Popup Dialog (instead of redirecting)
  historyCards.forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const trackingId = card.getAttribute('data-tracking-id') || 'TRK-88219';
      openDeliveryModal(trackingId);
    });
  });

  // Initial execution
  filterHistory();
});
