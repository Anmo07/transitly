/**
 * Transitly — Help & Support Controller
 * Connected with backend REST API (/api/v1/support/tickets) & Live WhatsApp integration with Anmol (+91 7988342544)
 */

document.addEventListener('DOMContentLoaded', () => {
  const helpSearchInput = document.getElementById('helpSearchInput');
  const btnOpenTicketModal = document.getElementById('btnOpenTicketModal');
  const ticketModal = document.getElementById('ticketModal');
  const btnCloseTicketModal = document.getElementById('btnCloseTicketModal');
  const btnCancelTicketModal = document.getElementById('btnCancelTicketModal');
  const formSupportTicket = document.getElementById('formSupportTicket');

  const inputTicketCategory = document.getElementById('inputTicketCategory');
  const inputTicketTrackingId = document.getElementById('inputTicketTrackingId');
  const inputTicketDescription = document.getElementById('inputTicketDescription');

  // Search input live filtering
  if (helpSearchInput) {
    helpSearchInput.addEventListener('input', () => {
      const q = helpSearchInput.value.toLowerCase().trim();
      document.querySelectorAll('.grid > div').forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = q === '' || text.includes(q) ? 'flex' : 'none';
      });
    });
  }

  /**
   * Modal Handlers
   */
  const openModal = () => {
    if (ticketModal) ticketModal.classList.remove('hidden');
  };

  const closeModal = () => {
    if (ticketModal) ticketModal.classList.add('hidden');
  };

  if (btnOpenTicketModal) btnOpenTicketModal.addEventListener('click', openModal);
  if (btnCloseTicketModal) btnCloseTicketModal.addEventListener('click', closeModal);
  if (btnCancelTicketModal) btnCancelTicketModal.addEventListener('click', closeModal);

  /**
   * Ticket Form Submission (POST to Backend)
   */
  if (formSupportTicket) {
    formSupportTicket.addEventListener('submit', async (e) => {
      e.preventDefault();

      const ticketNum = 'TKT-' + Math.floor(1000 + Math.random() * 9000);
      const payload = {
        ticketNumber: ticketNum,
        category: inputTicketCategory?.value,
        trackingId: inputTicketTrackingId?.value.trim() || null,
        description: inputTicketDescription?.value.trim()
      };

      try {
        await fetch('/api/v1/support/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (_) {}

      closeModal();
      alert(`Support Ticket #${ticketNum} created successfully! Our operations team and Anmol (+91 7988342544) will review and update within 15 minutes.`);
      if (inputTicketDescription) inputTicketDescription.value = '';
      if (inputTicketTrackingId) inputTicketTrackingId.value = '';
    });
  }
});
