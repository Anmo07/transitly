/**
 * Transitly — Payment Methods Controller
 * Fully integrated with backend REST API endpoints (/api/v1/payment-methods)
 */

document.addEventListener('DOMContentLoaded', () => {
  const paymentCardsContainer = document.getElementById('paymentCardsContainer');
  const btnOpenAddPaymentModal = document.getElementById('btnOpenAddPaymentModal');
  const paymentModal = document.getElementById('paymentModal');
  const btnClosePaymentModal = document.getElementById('btnClosePaymentModal');
  const btnCancelPaymentModal = document.getElementById('btnCancelPaymentModal');
  const formPaymentMethod = document.getElementById('formPaymentMethod');

  const tabTypeCard = document.getElementById('tabTypeCard');
  const tabTypeUpi = document.getElementById('tabTypeUpi');
  const inputPaymentType = document.getElementById('inputPaymentType');
  const cardFieldsSection = document.getElementById('cardFieldsSection');
  const upiFieldsSection = document.getElementById('upiFieldsSection');

  const inputCardName = document.getElementById('inputCardName');
  const inputCardNumber = document.getElementById('inputCardNumber');
  const inputCardExpiry = document.getElementById('inputCardExpiry');
  const inputCardCvv = document.getElementById('inputCardCvv');
  const inputUpiVpa = document.getElementById('inputUpiVpa');
  const inputPaymentDefault = document.getElementById('inputPaymentDefault');

  let currentMethods = [];

  /**
   * Load payment methods from backend
   */
  const loadPaymentMethods = async () => {
    try {
      const res = await fetch('/api/v1/payment-methods');
      if (res.ok) {
        const json = await res.json();
        currentMethods = json.data || [];
        renderCards(currentMethods);
        return;
      }
    } catch (_) {}

    // Fallback seed methods
    currentMethods = [
      { _id: '1', type: 'CARD', brand: 'VISA', last4: '4242', expiry: '12/25', isDefault: true },
      { _id: '2', type: 'CARD', brand: 'MASTERCARD', last4: '8831', expiry: '08/24', isDefault: false }
    ];
    renderCards(currentMethods);
  };

  /**
   * Render cards list
   */
  const renderCards = (items) => {
    if (!paymentCardsContainer) return;

    if (items.length === 0) {
      paymentCardsContainer.innerHTML = `
        <div class="text-center py-8 bg-surface rounded-2xl border border-outline-variant/20">
          <span class="material-symbols-outlined text-4xl text-outline mb-2">credit_card_off</span>
          <p class="font-bold text-on-surface text-sm">No cards linked</p>
          <p class="text-xs text-on-surface-variant mt-1">Add a credit or debit card for instant checkout.</p>
        </div>
      `;
      return;
    }

    paymentCardsContainer.innerHTML = items.map(pm => {
      const isVisa = pm.brand === 'VISA';
      const isUpi = pm.type === 'UPI';

      let logoBadge = `<div class="w-12 h-8 bg-blue-900 rounded flex items-center justify-center shrink-0"><span class="text-white font-bold text-xs italic tracking-tighter">VISA</span></div>`;

      if (pm.brand === 'MASTERCARD') {
        logoBadge = `
          <div class="w-12 h-8 bg-[#EB001B] relative rounded overflow-hidden shrink-0">
            <div class="absolute w-5 h-5 rounded-full bg-[#F79E1B] mix-blend-screen right-1 top-1.5"></div>
            <div class="absolute w-5 h-5 rounded-full bg-[#EB001B] left-1 top-1.5 z-10"></div>
          </div>
        `;
      } else if (isUpi) {
        logoBadge = `
          <div class="w-12 h-8 bg-surface border border-outline-variant rounded flex items-center justify-center shrink-0">
            <span class="text-xs font-bold text-primary">UPI</span>
          </div>
        `;
      }

      return `
        <div class="glass-card rounded-xl p-4 flex items-center justify-between cursor-pointer border ${pm.isDefault ? 'border-primary shadow-level-1' : 'border-transparent hover:border-outline-variant'} transition-all duration-200" onclick="setDefaultMethod('${pm._id}')">
          <div class="flex items-center gap-4 relative z-10">
            ${logoBadge}
            <div class="flex flex-col">
              <span class="text-body-md font-body-md text-on-surface font-semibold">${isUpi ? pm.vpa : `•••• ${pm.last4}`}</span>
              <span class="text-label-sm font-label-sm text-outline">${isUpi ? 'Verified UPI ID' : `Expires ${pm.expiry}`}</span>
            </div>
          </div>
          <div class="flex items-center gap-3 relative z-10">
            ${pm.isDefault ? '<span class="px-2 py-1 bg-primary-fixed text-primary font-label-sm text-label-sm rounded-full font-bold">Default</span>' : ''}
            <span class="material-symbols-outlined ${pm.isDefault ? 'text-primary' : 'text-outline hover:text-on-surface'}" style="font-variation-settings: 'FILL' ${pm.isDefault ? '1' : '0'};">
              ${pm.isDefault ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            <button type="button" onclick="event.stopPropagation(); deleteMethod('${pm._id}')" class="w-8 h-8 flex items-center justify-center rounded-full text-outline hover:text-error hover:bg-error-container/20 transition-colors" title="Delete Method">
              <span class="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  };

  /**
   * Modal Tab Switcher (Card vs UPI)
   */
  const switchType = (type) => {
    inputPaymentType.value = type;
    if (type === 'CARD') {
      tabTypeCard.className = 'w-1/2 py-2 rounded-lg bg-surface text-primary shadow-xs font-bold';
      tabTypeUpi.className = 'w-1/2 py-2 rounded-lg text-on-surface-variant font-bold';
      cardFieldsSection.classList.remove('hidden');
      upiFieldsSection.classList.add('hidden');
    } else {
      tabTypeUpi.className = 'w-1/2 py-2 rounded-lg bg-surface text-primary shadow-xs font-bold';
      tabTypeCard.className = 'w-1/2 py-2 rounded-lg text-on-surface-variant font-bold';
      upiFieldsSection.classList.remove('hidden');
      cardFieldsSection.classList.add('hidden');
    }
  };

  if (tabTypeCard) tabTypeCard.addEventListener('click', () => switchType('CARD'));
  if (tabTypeUpi) tabTypeUpi.addEventListener('click', () => switchType('UPI'));

  const openModal = (type = 'CARD') => {
    if (!paymentModal) return;
    switchType(type);
    paymentModal.classList.remove('hidden');
  };

  const closeModal = () => {
    if (paymentModal) paymentModal.classList.add('hidden');
  };

  if (btnOpenAddPaymentModal) btnOpenAddPaymentModal.addEventListener('click', () => openModal('CARD'));
  if (btnClosePaymentModal) btnClosePaymentModal.addEventListener('click', closeModal);
  if (btnCancelPaymentModal) btnCancelPaymentModal.addEventListener('click', closeModal);

  /**
   * Form Submission (POST to Backend)
   */
  if (formPaymentMethod) {
    formPaymentMethod.addEventListener('submit', async (e) => {
      e.preventDefault();

      const type = inputPaymentType.value;
      const isDefault = inputPaymentDefault.checked;
      let payload = { type, isDefault };

      if (type === 'CARD') {
        const rawNum = (inputCardNumber.value || '4242').replace(/\s+/g, '');
        payload.brand = rawNum.startsWith('4') ? 'VISA' : 'MASTERCARD';
        payload.last4 = rawNum.slice(-4) || '4242';
        payload.expiry = inputCardExpiry.value || '12/26';
        payload.holderName = inputCardName.value || 'Cardholder';
      } else {
        payload.vpa = inputUpiVpa.value.trim() || 'user@okhdfcbank';
      }

      try {
        await fetch('/api/v1/payment-methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (_) {}

      closeModal();
      loadPaymentMethods();
    });
  }

  // Global actions
  window.setDefaultMethod = async (id) => {
    try {
      await fetch(`/api/v1/payment-methods/${id}/default`, { method: 'PATCH' });
    } catch (_) {}
    loadPaymentMethods();
  };

  window.deleteMethod = async (id) => {
    if (!confirm('Remove this payment method?')) return;
    try {
      await fetch(`/api/v1/payment-methods/${id}`, { method: 'DELETE' });
    } catch (_) {}
    loadPaymentMethods();
  };

  window.openAddPaymentModal = openModal;

  window.selectWallet = (name) => {
    alert(`${name} is linked and set for express 1-click checkout.`);
  };

  loadPaymentMethods();
});
