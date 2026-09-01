/**
 * Transitly — Saved Addresses Controller
 * Fully integrated with backend REST API endpoints (/api/v1/addresses)
 * with Real-Time LocalStorage, Cookie persistence, and instant Optimistic UI.
 */

document.addEventListener('DOMContentLoaded', () => {
  const addressesContainer = document.getElementById('addressesContainer');
  const btnOpenAddAddressModal = document.getElementById('btnOpenAddAddressModal');
  const addressModal = document.getElementById('addressModal');
  const btnCloseAddressModal = document.getElementById('btnCloseAddressModal');
  const btnCancelAddressModal = document.getElementById('btnCancelAddressModal');
  const formAddress = document.getElementById('formAddress');
  const addressModalTitle = document.getElementById('addressModalTitle');

  const inputAddressId = document.getElementById('inputAddressId');
  const inputAddressLabel = document.getElementById('inputAddressLabel');
  const inputAddressLine = document.getElementById('inputAddressLine');
  const inputAddressTag = document.getElementById('inputAddressTag');
  const inputAddressDefault = document.getElementById('inputAddressDefault');

  const DEFAULT_SEED_ADDRESSES = [
    { id: 1, _id: '1', label: 'Home (Flat 402)', addressLine: 'House 402, Sector 17, Chandigarh, Punjab', tag: 'home', isDefault: true },
    { id: 2, _id: '2', label: 'Work HQ (Office)', addressLine: 'Alphaa Tech Hub, Cyber City Phase 2, Gurgaon, Haryana', tag: 'work', isDefault: false },
    { id: 3, _id: '3', label: 'Transit Central Warehouse', addressLine: 'Plot 88, Industrial Focal Point, Phase 8B, Mohali, Punjab', tag: 'store', isDefault: false }
  ];

  let currentAddresses = [];

  /**
   * Save addresses to persistent LocalStorage and Cookie
   */
  const persistAddresses = (items) => {
    try {
      localStorage.setItem('transitly_saved_addresses', JSON.stringify(items));
      document.cookie = `transitly_saved_addresses=${encodeURIComponent(JSON.stringify(items))};path=/;max-age=31536000`;
    } catch (_) {}
  };

  /**
   * Read addresses from persistent cache
   */
  const getCachedAddresses = () => {
    try {
      const stored = localStorage.getItem('transitly_saved_addresses');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return DEFAULT_SEED_ADDRESSES;
  };

  /**
   * Render address list into DOM
   */
  const renderAddresses = (items) => {
    if (!addressesContainer) return;

    if (!items || items.length === 0) {
      addressesContainer.innerHTML = `
        <div class="text-center py-12 bg-surface rounded-2xl border border-outline-variant/20 shadow-sm">
          <span class="material-symbols-outlined text-4xl text-outline mb-2">location_off</span>
          <p class="font-bold text-on-surface text-sm">No saved addresses</p>
          <p class="text-xs text-on-surface-variant mt-1">Add your frequent pickup or drop locations.</p>
        </div>
      `;
      return;
    }

    addressesContainer.innerHTML = items.map((addr) => {
      const addrId = addr.id || addr._id || String(Date.now());
      const label = addr.label || 'Saved Location';
      const addressLine = addr.addressLine || addr.address_line || '';
      const isDefault = !!(addr.isDefault || addr.is_default);
      const isHome = label.toLowerCase().includes('home') || addr.tag === 'home';
      const isWork = label.toLowerCase().includes('work') || addr.tag === 'work';
      const isStore = label.toLowerCase().includes('warehouse') || addr.tag === 'store';

      const icon = addr.tag || (isHome ? 'home' : isWork ? 'apartment' : isStore ? 'store' : 'pin_drop');
      const iconBg = isDefault ? 'bg-primary-fixed text-primary' : 'bg-surface-container-highest text-on-surface-variant';

      return `
        <div class="bg-surface-container-lowest rounded-[16px] shadow-level-1 p-4 flex items-center justify-between group hover:bg-surface-container-low transition-all duration-200 border ${isDefault ? 'border-primary/30 ring-1 ring-primary/10' : 'border-outline-variant/15'}">
          <div class="flex items-center gap-4 flex-1 cursor-pointer min-w-0" onclick="selectAddressAsActive('${encodeURIComponent(addressLine)}')">
            <div class="w-12 h-12 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0 shadow-sm">
              <span class="material-symbols-outlined text-[24px] ${isDefault ? 'fill' : ''}">${icon}</span>
            </div>
            <div class="flex flex-col min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-label-md font-label-md text-on-surface font-bold truncate">${label}</span>
                ${isDefault ? '<span class="bg-primary/10 text-primary text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">Default</span>' : ''}
              </div>
              <span class="text-label-sm font-label-sm text-on-surface-variant mt-0.5 line-clamp-1 truncate">${addressLine}</span>
            </div>
          </div>
          <div class="flex items-center gap-1 shrink-0 ml-2">
            <button type="button" onclick="editAddress('${addrId}')" aria-label="Edit Address" class="w-9 h-9 flex items-center justify-center rounded-full text-outline hover:text-primary hover:bg-surface-container transition-colors duration-150 active:scale-90" title="Edit address">
              <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button type="button" onclick="deleteAddress('${addrId}')" aria-label="Delete Address" class="w-9 h-9 flex items-center justify-center rounded-full text-outline hover:text-error hover:bg-error-container/20 transition-colors duration-150 active:scale-90" title="Delete address">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  };

  /**
   * Fetch and render addresses from Backend REST API + Cache
   */
  const loadAddresses = async () => {
    // 1. Instant render from local persistent cache
    currentAddresses = getCachedAddresses();
    renderAddresses(currentAddresses);

    // 2. Fetch from backend API
    try {
      const res = await fetch('/api/v1/addresses');
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          currentAddresses = json.data;
          persistAddresses(currentAddresses);
          renderAddresses(currentAddresses);
        }
      }
    } catch (_) {}
  };

  /**
   * Modal Open / Close
   */
  const openModal = (isEdit = false, addr = null) => {
    if (!addressModal) return;
    addressModal.classList.remove('hidden');

    if (isEdit && addr) {
      if (addressModalTitle) addressModalTitle.innerText = 'Edit Address';
      inputAddressId.value = addr.id || addr._id;
      inputAddressLabel.value = addr.label || '';
      inputAddressLine.value = addr.addressLine || addr.address_line || '';
      inputAddressTag.value = addr.tag || 'home';
      inputAddressDefault.checked = !!(addr.isDefault || addr.is_default);
    } else {
      if (addressModalTitle) addressModalTitle.innerText = 'Add New Address';
      inputAddressId.value = '';
      inputAddressLabel.value = '';
      inputAddressLine.value = '';
      inputAddressTag.value = 'home';
      inputAddressDefault.checked = false;
    }
  };

  const closeModal = () => {
    if (addressModal) addressModal.classList.add('hidden');
  };

  if (btnOpenAddAddressModal) btnOpenAddAddressModal.addEventListener('click', () => openModal(false));
  if (btnCloseAddressModal) btnCloseAddressModal.addEventListener('click', closeModal);
  if (btnCancelAddressModal) btnCancelAddressModal.addEventListener('click', closeModal);

  if (addressModal) {
    addressModal.addEventListener('click', (e) => {
      if (e.target === addressModal) closeModal();
    });
  }

  /**
   * Form Submission (Add or Edit)
   */
  if (formAddress) {
    formAddress.addEventListener('submit', async (e) => {
      e.preventDefault();

      const id = inputAddressId.value;
      const isDefault = inputAddressDefault.checked;
      const payload = {
        label: inputAddressLabel.value.trim(),
        addressLine: inputAddressLine.value.trim(),
        tag: inputAddressTag.value,
        isDefault: isDefault
      };

      // Optimistic Local Update
      if (id) {
        currentAddresses = currentAddresses.map(a => {
          const match = String(a.id || a._id) === String(id);
          if (match) {
            return { ...a, ...payload, id: a.id || a._id, _id: a._id || a.id };
          }
          if (isDefault) return { ...a, isDefault: false, is_default: false };
          return a;
        });
      } else {
        const newId = Date.now();
        if (isDefault) {
          currentAddresses = currentAddresses.map(a => ({ ...a, isDefault: false, is_default: false }));
        }
        currentAddresses.unshift({
          id: newId,
          _id: String(newId),
          ...payload
        });
      }

      persistAddresses(currentAddresses);
      renderAddresses(currentAddresses);
      closeModal();

      // Backend sync
      try {
        if (id) {
          await fetch(`/api/v1/addresses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } else {
          await fetch('/api/v1/addresses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
      } catch (_) {}
    });
  }

  // Global functions for inline onclick handlers
  window.editAddress = (id) => {
    const found = currentAddresses.find(a => String(a.id || a._id) === String(id));
    if (found) openModal(true, found);
  };

  window.deleteAddress = async (id) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    // Optimistic delete
    currentAddresses = currentAddresses.filter(a => String(a.id || a._id) !== String(id));
    persistAddresses(currentAddresses);
    renderAddresses(currentAddresses);

    try {
      await fetch(`/api/v1/addresses/${id}`, { method: 'DELETE' });
    } catch (_) {}
  };

  window.selectAddressAsActive = (line) => {
    localStorage.setItem('transitly_pickup_location', JSON.stringify({
      name: decodeURIComponent(line),
      lat: 28.4595,
      lng: 77.0266,
      time: Date.now()
    }));
    window.location.href = '/';
  };

  // Initial Load
  loadAddresses();
});
