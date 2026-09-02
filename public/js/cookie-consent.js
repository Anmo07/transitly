/**
 * Transitly — Cookies & Telematics Consent Controller
 * DPDP Act 2023 & GDPR Compliant Granular Cookie Consent Management.
 */

(function () {
  const STORAGE_KEY = 'transitly_cookie_consent';

  // Check if consent has already been registered
  const getStoredConsent = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  const saveConsent = (preferences) => {
    try {
      const record = {
        consented: true,
        essential: true,
        telemetry: !!preferences.telemetry,
        analytics: !!preferences.analytics,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
      hideBanner();
      hidePreferencesModal();
      
      // Dispatch event for other components if needed
      window.dispatchEvent(new CustomEvent('transitly:cookie_consent_saved', { detail: record }));
    } catch (e) {
      console.warn('[CookieConsent] Failed to write consent:', e);
    }
  };

  // Build Banner DOM
  const createBannerElement = () => {
    if (document.getElementById('transitlyCookieBanner')) return;

    const banner = document.createElement('div');
    banner.id = 'transitlyCookieBanner';
    banner.className = 'fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 shadow-2xl transition-all duration-300 transform translate-y-8 opacity-0 pointer-events-auto';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie Consent');

    banner.innerHTML = `
      <div class="flex items-start gap-3.5">
        <div class="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
          <span class="material-symbols-outlined text-2xl">cookie</span>
        </div>
        <div class="flex-1">
          <h4 class="font-extrabold text-slate-900 text-sm">We Value Your Privacy</h4>
          <p class="text-xs text-slate-600 mt-1 leading-relaxed">
            Transitly uses essential cookies and localized storage to calculate bus routes, maintain live GPS telematics, and preserve your preferences. Read our <a href="/privacy-policy" class="text-primary font-bold hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <button type="button" id="btnCookiePreferences" class="text-slate-600 hover:text-slate-900 font-bold underline px-1 py-1 transition-colors">
          Customize
        </button>
        <div class="flex items-center gap-2 ml-auto">
          <button type="button" id="btnCookieEssential" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all active:scale-95">
            Essential Only
          </button>
          <button type="button" id="btnCookieAcceptAll" class="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-extrabold shadow-sm active:scale-95 transition-all">
            Accept All
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Bind actions
    document.getElementById('btnCookieAcceptAll').addEventListener('click', () => {
      saveConsent({ telemetry: true, analytics: true });
    });

    document.getElementById('btnCookieEssential').addEventListener('click', () => {
      saveConsent({ telemetry: false, analytics: false });
    });

    document.getElementById('btnCookiePreferences').addEventListener('click', () => {
      openPreferencesModal();
    });

    // Trigger reveal animation
    requestAnimationFrame(() => {
      banner.classList.remove('translate-y-8', 'opacity-0');
      banner.classList.add('translate-y-0', 'opacity-100');
    });
  };

  const hideBanner = () => {
    const banner = document.getElementById('transitlyCookieBanner');
    if (banner) {
      banner.classList.add('translate-y-8', 'opacity-0');
      setTimeout(() => banner.remove(), 300);
    }
  };

  // Build Preferences Modal DOM
  const createPreferencesModal = () => {
    if (document.getElementById('transitlyCookieModal')) return;

    const modal = document.createElement('div');
    modal.id = 'transitlyCookieModal';
    modal.className = 'hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const currentConsent = getStoredConsent() || { telemetry: true, analytics: true };

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-900 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-2xl">tune</span>
            <h3 class="font-extrabold text-base">Cookie &amp; Telematics Preferences</h3>
          </div>
          <button type="button" id="btnCloseCookieModal" class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <p class="text-xs text-slate-500 mb-4 leading-relaxed">
          Manage how Transitly uses browser storage and tracking cookies. Essential cookies cannot be turned off as they are required for security and core booking mechanics.
        </p>

        <div class="space-y-3 text-xs">
          <!-- 1. Strictly Necessary -->
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
            <div>
              <span class="font-bold text-slate-900 block">Strictly Necessary Cookies</span>
              <span class="text-slate-500 text-[11px]">Enables session authentication, QR seal verification, and CSRF token security.</span>
            </div>
            <span class="px-2 py-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-extrabold uppercase shrink-0">Always On</span>
          </div>

          <!-- 2. Telematics & Corridor Memory -->
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
            <div>
              <span class="font-bold text-slate-900 block">Corridor &amp; Live Telematics Memory</span>
              <span class="text-slate-500 text-[11px]">Remembers your origin/destination hubs and live GPS caching for instant tracking.</span>
            </div>
            <input type="checkbox" id="prefToggleTelemetry" class="w-5 h-5 rounded text-primary focus:ring-primary border-slate-300" ${currentConsent.telemetry ? 'checked' : ''}>
          </div>

          <!-- 3. Performance & Diagnostics -->
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
            <div>
              <span class="font-bold text-slate-900 block">Analytics &amp; Performance</span>
              <span class="text-slate-500 text-[11px]">Anonymous metrics to evaluate intercity bus route punctuality and reduce API latency.</span>
            </div>
            <input type="checkbox" id="prefToggleAnalytics" class="w-5 h-5 rounded text-primary focus:ring-primary border-slate-300" ${currentConsent.analytics ? 'checked' : ''}>
          </div>
        </div>

        <div class="mt-6 pt-3 border-t border-slate-100 flex gap-2">
          <button type="button" id="btnSaveCookiePreferences" class="w-full py-3 rounded-2xl bg-primary hover:bg-primary-dark text-white font-extrabold text-xs shadow-sm active:scale-95 transition-all">
            Save Preferences
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('btnCloseCookieModal').addEventListener('click', hidePreferencesModal);
    document.getElementById('btnSaveCookiePreferences').addEventListener('click', () => {
      const telemetry = document.getElementById('prefToggleTelemetry').checked;
      const analytics = document.getElementById('prefToggleAnalytics').checked;
      saveConsent({ telemetry, analytics });
    });
  };

  const openPreferencesModal = () => {
    createPreferencesModal();
    const modal = document.getElementById('transitlyCookieModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  };

  const hidePreferencesModal = () => {
    const modal = document.getElementById('transitlyCookieModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  };

  // Expose global method
  window.openCookiePreferences = openPreferencesModal;

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    const consent = getStoredConsent();
    if (!consent || !consent.consented) {
      // Delay slightly for smooth page load
      setTimeout(createBannerElement, 800);
    }
  });
})();
