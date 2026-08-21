/**
 * Transitly — Help & Support Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const openWhatsAppSupport = (e) => {
    if (e) e.preventDefault();
    const text = encodeURIComponent('Hi Anmol, I need help with my Transitly parcel booking.');
    window.open(`https://wa.me/917988342544?text=${text}`, '_blank');
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
