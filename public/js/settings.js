/**
 * Transitly — Settings Controller
 * Connected with backend REST API (/api/v1/settings), i18n Language Engine & Local Cookie Persistence
 */

document.addEventListener('DOMContentLoaded', () => {
  const togglePush = document.getElementById('togglePush');
  const toggleSms = document.getElementById('toggleSms');
  const toggleLocation = document.getElementById('toggleLocation');
  const btnSignOut = document.getElementById('btnSignOut');

  const btnLanguageSelector = document.getElementById('btnLanguageSelector');
  const languageModal = document.getElementById('languageModal');
  const btnCloseLanguageModal = document.getElementById('btnCloseLanguageModal');
  const labelCurrentLanguage = document.getElementById('labelCurrentLanguage');

  const settingsToast = document.getElementById('settingsToast');
  const settingsToastText = document.getElementById('settingsToastText');

  /**
   * Show feedback toast
   */
  const showToast = (msg) => {
    if (!settingsToast || !settingsToastText) return;
    settingsToastText.innerText = msg;
    settingsToast.classList.remove('hidden');
    setTimeout(() => {
      settingsToast.classList.add('hidden');
    }, 2200);
  };

  /**
   * Sync active language visual states in modal and label
   */
  const syncLanguageUI = () => {
    const currentLang = window.TransitlyI18n ? window.TransitlyI18n.getActiveLanguage() : 'en';
    const langInfo = window.TransitlyI18n && window.TransitlyI18n.languages[currentLang] 
      ? window.TransitlyI18n.languages[currentLang] 
      : { name: 'English (IN)' };

    if (labelCurrentLanguage) {
      labelCurrentLanguage.innerText = langInfo.name;
    }

    document.querySelectorAll('.btn-lang-choice').forEach(btn => {
      const code = btn.getAttribute('data-lang-code');
      const checkIcon = btn.querySelector('.lang-check-icon');

      if (code === currentLang) {
        btn.classList.remove('bg-surface-container-low', 'text-on-surface');
        btn.classList.add('bg-primary', 'text-on-primary', 'shadow-md');
        if (checkIcon) checkIcon.classList.remove('hidden');
      } else {
        btn.classList.remove('bg-primary', 'text-on-primary', 'shadow-md');
        btn.classList.add('bg-surface-container-low', 'text-on-surface');
        if (checkIcon) checkIcon.classList.add('hidden');
      }
    });
  };

  /**
   * Load settings from backend API
   */
  const loadSettings = async () => {
    syncLanguageUI();

    try {
      const res = await fetch('/api/v1/settings');
      if (res.ok) {
        const json = await res.json();
        const s = json.data || {};
        if (togglePush) togglePush.checked = s.pushNotifications !== false;
        if (toggleSms) toggleSms.checked = s.smsUpdates !== false;
        if (toggleLocation) toggleLocation.checked = s.locationServices !== false;
      }
    } catch (_) {}
  };

  /**
   * Save setting update to backend
   */
  const updateSetting = async (key, val, friendlyName) => {
    try {
      await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: val })
      });
    } catch (_) {}

    showToast(`${friendlyName}: ${val ? 'Enabled' : 'Disabled'}`);
  };

  // Wire up toggles
  if (togglePush) {
    togglePush.addEventListener('change', () => {
      updateSetting('pushNotifications', togglePush.checked, 'Push Notifications');
    });
  }

  if (toggleSms) {
    toggleSms.addEventListener('change', () => {
      updateSetting('smsUpdates', toggleSms.checked, 'WhatsApp / SMS Alerts');
    });
  }

  if (toggleLocation) {
    toggleLocation.addEventListener('change', () => {
      updateSetting('locationServices', toggleLocation.checked, 'GPS Tracking');
    });
  }

  // Language Modal Handlers
  if (btnLanguageSelector) {
    btnLanguageSelector.addEventListener('click', () => {
      syncLanguageUI();
      if (languageModal) languageModal.classList.remove('hidden');
    });
  }

  if (btnCloseLanguageModal) {
    btnCloseLanguageModal.addEventListener('click', () => {
      if (languageModal) languageModal.classList.add('hidden');
    });
  }

  // Language selection with immediate redirection and full page re-translation
  document.querySelectorAll('.btn-lang-choice').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const langCode = btn.getAttribute('data-lang-code') || 'en';
      const langName = btn.getAttribute('data-lang') || 'English';

      if (languageModal) languageModal.classList.add('hidden');
      showToast(`🌐 ${window.TransitlyI18n ? window.TransitlyI18n.t('common_lang_changed', 'Language changed') : 'Language changed'}`);

      // Call i18n engine to set 1-year cookie, localStorage, backend sync, and reload with translated content
      if (window.TransitlyI18n && window.TransitlyI18n.setLanguage) {
        await window.TransitlyI18n.setLanguage(langCode, true);
      } else {
        localStorage.setItem('transitly_lang', langCode);
        window.location.reload();
      }
    });
  });

  // Sign out with credential clearing
  if (btnSignOut) {
    btnSignOut.addEventListener('click', () => {
      if (confirm('Sign out of Transitly?')) {
        const lang = localStorage.getItem('transitly_lang');
        localStorage.clear();
        if (lang) localStorage.setItem('transitly_lang', lang);
        showToast('Signed out successfully.');
        setTimeout(() => {
          window.location.href = '/';
        }, 800);
      }
    });
  }

  loadSettings();
});
