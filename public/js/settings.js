/**
 * Transitly — Settings Controller
 * Connected with backend REST API (/api/v1/settings) & Local Preference Synchronization
 */

document.addEventListener('DOMContentLoaded', () => {
  const togglePush = document.getElementById('togglePush');
  const toggleSms = document.getElementById('toggleSms');
  const toggleLocation = document.getElementById('toggleLocation');
  const toggleBiometrics = document.getElementById('toggleBiometrics');
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
   * Load settings from backend API
   */
  const loadSettings = async () => {
    try {
      const res = await fetch('/api/v1/settings');
      if (res.ok) {
        const json = await res.json();
        const s = json.data || {};
        if (togglePush) togglePush.checked = s.pushNotifications !== false;
        if (toggleSms) toggleSms.checked = s.smsUpdates !== false;
        if (toggleLocation) toggleLocation.checked = s.locationServices !== false;
        if (toggleBiometrics) toggleBiometrics.checked = !!s.biometrics;
        if (labelCurrentLanguage && s.language) labelCurrentLanguage.innerText = s.language;
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

  if (toggleBiometrics) {
    toggleBiometrics.addEventListener('change', () => {
      updateSetting('biometrics', toggleBiometrics.checked, 'Biometric Lock');
    });
  }

  // Language Modal
  if (btnLanguageSelector) {
    btnLanguageSelector.addEventListener('click', () => {
      if (languageModal) languageModal.classList.remove('hidden');
    });
  }

  if (btnCloseLanguageModal) {
    btnCloseLanguageModal.addEventListener('click', () => {
      if (languageModal) languageModal.classList.add('hidden');
    });
  }

  document.querySelectorAll('.btn-lang-choice').forEach(btn => {
    btn.addEventListener('click', async () => {
      const lang = btn.getAttribute('data-lang');
      if (labelCurrentLanguage) labelCurrentLanguage.innerText = lang;
      if (languageModal) languageModal.classList.add('hidden');
      await updateSetting('language', lang, 'Language set to ' + lang);
    });
  });

  // Sign out
  if (btnSignOut) {
    btnSignOut.addEventListener('click', () => {
      if (confirm('Sign out of Transitly?')) {
        localStorage.clear();
        showToast('Signed out successfully.');
        setTimeout(() => {
          window.location.href = '/';
        }, 800);
      }
    });
  }

  loadSettings();
});
