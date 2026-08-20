/**
 * Transitly — Help & Support Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const openWhatsAppSupport = () => {
    const text = encodeURIComponent('Hi Transitly Support, I need help with my intercity bus parcel booking.');
    window.open(`https://wa.me/919876543210?text=${text}`, '_blank');
  };

  const btnChat = document.getElementById('btnHelpChatSupport');
  if (btnChat) {
    btnChat.addEventListener('click', openWhatsAppSupport);
  }

  const btnFloating = document.getElementById('btnFloatingWhatsAppHelp');
  if (btnFloating) {
    btnFloating.addEventListener('click', openWhatsAppSupport);
  }
});
