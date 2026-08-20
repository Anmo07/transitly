/**
 * Transitly — Saved Addresses Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.saved-address-card').forEach((card) => {
    card.addEventListener('click', () => {
      const address = card.getAttribute('data-address');
      if (address && window.openBookingModal) {
        window.openBookingModal();
        const senderInput = document.getElementById('modalSenderAddress');
        if (senderInput) senderInput.value = address;
      }
    });
  });
});
