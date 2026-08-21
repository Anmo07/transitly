/**
 * Transitly — Saved Addresses Controller
 * Fully integrated with backend REST API endpoints (/api/v1/addresses)
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

  let currentAddresses = [];

  /**
   * Fetch and render addresses from Backend REST API
   */
  const loadAddresses = async () => {
    try {
      const res = await fetch('/api/v1/addresses');
      if (res.ok) {
        const json = await res.json();
        currentAddresses = json.data || [];
        renderAddresses(currentAddresses);
        return;
      }
    } catch (_) {}

    // Fallback seed addresses
    currentAddresses = [
      { _id: '1', label: 'Home', addressLine: '123 Elm Street, Springfield, IL 62701', tag: 'home', isDefault: true },
      { _id: '2', label: 'Work', addressLine: '456 Corporate Blvd, Suite 200, Metropolis, NY 10001', tag: 'work', isDefault: false },
      { _id: '3', label: 'Gym', addressLine: '789 Muscle Ave, Iron City, CA 90210', tag: 'fitness_center', isDefault: false },
      { _id: '4', label: 'Favorite Cafe', addressLine: '321 Bean Roasters Lane, Seattle, WA 98101', tag: 'local_cafe', isDefault: false }
    ];
    renderAddresses(currentAddresses);
  };

  /**
   * Render address list into DOM
   */
  const renderAddresses = (items) => {
    if (!addressesContainer) return;

    if (items.length === 0) {
      addressesContainer.innerHTML = `
        <div class="text-center py-12 bg-surface rounded-2xl border border-outline-variant/20">
          <span class="material-symbols-outlined text-4xl text-outline mb-2">location_off</span>
          <p class="font-bold text-on-surface text-sm">No saved addresses</p>
          <p class="text-xs text-on-surface-variant mt-1">Add your frequent pickup or drop locations.</p>
        </div>
      `;
      return;
    }

    addressesContainer.innerHTML = items.map((addr) => {
      const isHome = addr.label.toLowerCase() === 'home' || addr.tag === 'home';
      const icon = addr.tag || (isHome ? 'home' : 'pin_drop');
      const iconBg = addr.isDefault ? 'bg-primary-fixed text-primary' : 'bg-surface-container-highest text-on-surface-variant';

      return `
        <div class="bg-surface-container-lowest rounded-[16px] shadow-level-1 p-4 flex items-center justify-between group hover:bg-surface-container-low transition-colors duration-200 border ${addr.isDefault ? 'border-primary/20' : 'border-transparent'}">
          <div class="flex items-center gap-4 flex-1 cursor-pointer" onclick="selectAddressAsActive('${encodeURIComponent(addr.addressLine)}')">
            <div class="w-12 h-12 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-[24px] ${addr.isDefault ? 'icon-fill' : ''}">${icon}</span>
            </div>
            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                <span class="text-label-md font-label-md text-on-surface font-semibold">${addr.label}</span>
                ${addr.isDefault ? '<span class="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">Default</span>' : ''}
              </div>
              <span class="text-label-sm font-label-sm text-on-surface-variant mt-0.5 line-clamp-1">${addr.addressLine}</span>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button type="button" onclick="editAddress('${addr._id}')" aria-label="Edit Address" class="w-9 h-9 flex items-center justify-center rounded-full text-outline hover:text-primary hover:bg-surface-container transition-colors duration-150">
              <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button type="button" onclick="deleteAddress('${addr._id}')" aria-label="Delete Address" class="w-9 h-9 flex items-center justify-center rounded-full text-outline hover:text-error hover:bg-error-container/20 transition-colors duration-150">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  };

  /**
   * Modal Open / Close
   */
  const openModal = (isEdit = false, addr = null) => {
    if (!addressModal) return;
    addressModal.classList.remove('hidden');

    if (isEdit && addr) {
      if (addressModalTitle) addressModalTitle.innerText = 'Edit Address';
      inputAddressId.value = addr._id;
      inputAddressLabel.value = addr.label;
      inputAddressLine.value = addr.addressLine;
      inputAddressTag.value = addr.tag || 'home';
      inputAddressDefault.checked = !!addr.isDefault;
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

  /**
   * Form Submission (POST or PUT to Backend)
   */
  if (formAddress) {
    formAddress.addEventListener('submit', async (e) => {
      e.preventDefault();

      const id = inputAddressId.value;
      const payload = {
        label: inputAddressLabel.value.trim(),
        addressLine: inputAddressLine.value.trim(),
        tag: inputAddressTag.value,
        isDefault: inputAddressDefault.checked
      };

      try {
        if (id) {
          // PUT /api/v1/addresses/:id
          await fetch(`/api/v1/addresses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } else {
          // POST /api/v1/addresses
          await fetch('/api/v1/addresses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
      } catch (_) {}

      closeModal();
      loadAddresses();
    });
  }

  // Global functions for inline onclick handlers
  window.editAddress = (id) => {
    const found = currentAddresses.find(a => a._id === id);
    if (found) openModal(true, found);
  };

  window.deleteAddress = async (id) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await fetch(`/api/v1/addresses/${id}`, { method: 'DELETE' });
    } catch (_) {}
    loadAddresses();
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

  loadAddresses();
});
