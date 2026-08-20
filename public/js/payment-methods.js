/**
 * Transitly — Payment Methods Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.payment-card-item');

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      cards.forEach((c) => {
        c.classList.remove('active-card', 'border-primary');
        c.classList.add('border-outline-variant/30');
      });
      card.classList.add('active-card');
      card.classList.remove('border-outline-variant/30');
    });
  });

  const btnAdd = document.getElementById('btnAddNewPaymentMethod');
  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      alert('Secure card entry dialog will open in production.');
    });
  }
});
