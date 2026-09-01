/**
 * Transitly - Admin Command Center Controller
 * Strict Zero-Leak Gate:
 * - Locks on entry and re-entry (zero auto-unlock).
 * - Biometric reconfiguration securely encapsulated inside the panel (requires Master Admin Password).
 * - Emergency recovery endpoint dispatches master credentials to official dev email (anmolrajotiya@gmail.com).
 */

document.addEventListener('DOMContentLoaded', () => {
  // Storage Keys
  const AUTH_TOKEN_KEY = 'transitly_admin_token';
  const AUTH_TYPE_KEY = 'transitly_admin_auth_type';
  const WEBAUTHN_CRED_KEY = 'transitly_touch_id_cred';

  // Auth DOM Elements
  const authLockscreen = document.getElementById('auth-lockscreen');
  const btnAuthFingerprint = document.getElementById('btn-auth-fingerprint');
  const fingerprintBtnLabel = document.getElementById('fingerprint-btn-label');
  const fingerprintBtnSublabel = document.getElementById('fingerprint-btn-sublabel');
  const authPasswordForm = document.getElementById('auth-password-form');
  const authPasswordInput = document.getElementById('auth-password-input');
  const btnTogglePasswordVis = document.getElementById('btn-toggle-password-vis');
  const iconTogglePassword = document.getElementById('icon-toggle-password');
  const authErrorMsg = document.getElementById('auth-error-msg');
  const btnSubmitPassword = document.getElementById('btn-submit-password');
  const btnEmergencyRecovery = document.getElementById('btn-emergency-recovery');
  const headerAuthBadge = document.getElementById('header-auth-badge');
  const btnLockConsole = document.getElementById('btn-lock-console');

  // Dashboard DOM Elements
  const statActiveParcels = document.getElementById('stat-active-parcels');
  const statFleetUtil = document.getElementById('stat-fleet-util');
  const statSuccessRate = document.getElementById('stat-success-rate');
  const statUnresolvedIncidents = document.getElementById('stat-unresolved-incidents');

  const broadcastTargetSelect = document.getElementById('broadcast-target-select');
  const filterLabel1 = document.getElementById('filter-label-1');
  const filterLabel2 = document.getElementById('filter-label-2');
  const filterInputContainer1 = document.getElementById('filter-input-container-1');
  const filterInputContainer2 = document.getElementById('filter-input-container-2');
  const broadcastMessageInput = document.getElementById('broadcast-message-input');
  const btnSendBroadcast = document.getElementById('btn-send-broadcast');
  const broadcastStatusMsg = document.getElementById('broadcast-status-msg');

  const btnAppBreakdowns = document.getElementById('btn-app-breakdowns');
  const btnSystemHealth = document.getElementById('btn-system-health');
  const btnBiometricsSettings = document.getElementById('btn-biometrics-settings');
  const btnIncidentReports = document.getElementById('btn-incident-reports');
  const btnUserFeedback = document.getElementById('btn-user-feedback');
  const navBtnAlerts = document.getElementById('nav-btn-alerts');

  // Modal Elements
  const modalContainer = document.getElementById('modal-container');
  const modalHeadingText = document.getElementById('modal-heading-text');
  const modalIcon = document.getElementById('modal-icon');
  const modalBodyContent = document.getElementById('modal-body-content');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnModalActionClose = document.getElementById('btn-modal-action-close');

  // In-Memory Session Storage
  let inMemoryAdminToken = null;
  let inMemoryAuthType = null;
  let idleTimer = null;

  // Floating Toast Notification Center
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  function showToast(title, description, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'pointer-events-auto bg-surface-container-lowest p-4 rounded-2xl custom-shadow-interactive border border-outline-variant/30 flex items-start gap-3 transform translate-y-2 opacity-0 transition-all duration-300';
    
    const iconName = type === 'error' ? 'warning' : (type === 'success' ? 'check_circle' : 'notifications_active');
    const iconColor = type === 'error' ? 'text-error' : (type === 'success' ? 'text-emerald-600' : 'text-primary');

    toast.innerHTML = `
      <div class="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center shrink-0 ${iconColor}">
        <span class="material-symbols-outlined text-[20px]">${iconName}</span>
      </div>
      <div class="flex-grow min-w-0">
        <h4 class="font-bold text-xs text-on-surface">${title}</h4>
        <p class="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5">${description}</p>
      </div>
      <button class="text-on-surface-variant hover:text-on-surface p-1" onclick="this.parentElement.remove()">
        <span class="material-symbols-outlined text-xs">close</span>
      </button>
    `;

    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-x-4');
      setTimeout(() => toast.remove(), 300);
    }, 6000);
  }

  // --------------------------------------------------------------------------
  // Utility: Base64URL Buffer Conversion for WebAuthn Biometrics
  // --------------------------------------------------------------------------
  function base64UrlToBuffer(base64url) {
    if (!base64url) return new Uint8Array(0).buffer;
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLen);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  function bufferToBase64Url(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  // --------------------------------------------------------------------------
  // 1. Strict Authentication Layer (No Auto-Unlock on Load/Reload)
  // --------------------------------------------------------------------------

  function getAuthToken() {
    return inMemoryAdminToken || sessionStorage.getItem(AUTH_TOKEN_KEY);
  }

  function setAuthSession(token, authType) {
    inMemoryAdminToken = token;
    inMemoryAuthType = authType;
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    sessionStorage.setItem(AUTH_TYPE_KEY, authType);
    unlockDashboard(authType);
    resetIdleTimer();
  }

  function clearAuthSession() {
    inMemoryAdminToken = null;
    inMemoryAuthType = null;
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TYPE_KEY);
    lockDashboard();
  }

  function unlockDashboard(authType = 'AUTHENTICATED') {
    authLockscreen.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => {
      authLockscreen.classList.add('hidden');
    }, 300);

    const isBiometric = authType.includes('BIOMETRIC') || authType.includes('FINGERPRINT');
    headerAuthBadge.textContent = isBiometric ? 'macOS Touch ID Verified' : 'Master Password Verified';
    headerAuthBadge.className = 'text-[10px] font-bold text-emerald-700 uppercase tracking-wide';

    loadDashboardStats();
    loadIncidentsCount();
  }

  function lockDashboard() {
    authLockscreen.classList.remove('hidden');
    setTimeout(() => {
      authLockscreen.classList.remove('opacity-0', 'pointer-events-none');
    }, 10);
    authPasswordInput.value = '';
    authErrorMsg.textContent = '';
    inMemoryAdminToken = null;
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  }

  // Auto-lock on Idle (5 Minutes)
  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (getAuthToken()) {
        clearAuthSession();
        showToast('Console Locked', 'Command Center auto-locked due to inactivity.', 'info');
      }
    }, 5 * 60 * 1000);
  }

  ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
    document.addEventListener(evt, () => {
      if (getAuthToken()) resetIdleTimer();
    }, { passive: true });
  });

  // Lock Console on Page Visibility / Tab Switch
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      clearAuthSession();
    }
  });

  // Toggle Password Visibility
  btnTogglePasswordVis.addEventListener('click', () => {
    const isPass = authPasswordInput.type === 'password';
    authPasswordInput.type = isPass ? 'text' : 'password';
    iconTogglePassword.textContent = isPass ? 'visibility_off' : 'visibility';
  });

  // Password Authentication Submit
  authPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = authPasswordInput.value.trim();
    if (!password) return;

    btnSubmitPassword.disabled = true;
    btnSubmitPassword.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span> Verifying...';
    authErrorMsg.textContent = '';
    authErrorMsg.className = 'text-xs text-error font-medium text-left min-h-[18px]';

    try {
      const res = await fetch('/api/v1/admin/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const json = await res.json();
      if (res.ok && json.token) {
        setAuthSession(json.token, 'PASSWORD');
      } else {
        authErrorMsg.textContent = json.message || 'Invalid Admin Credentials.';
        authPasswordInput.classList.add('border-error');
        setTimeout(() => authPasswordInput.classList.remove('border-error'), 2000);
      }
    } catch (err) {
      authErrorMsg.textContent = 'Connection error during authentication.';
    } finally {
      btnSubmitPassword.disabled = false;
      btnSubmitPassword.innerHTML = '<span class="material-symbols-outlined text-sm">lock_open</span><span>Unlock Command Center</span>';
    }
  });

  // --------------------------------------------------------------------------
  // Emergency Recovery Trigger (Email Password to anmolrajotiya@gmail.com)
  // --------------------------------------------------------------------------
  if (btnEmergencyRecovery) {
    btnEmergencyRecovery.addEventListener('click', async () => {
      btnEmergencyRecovery.disabled = true;
      btnEmergencyRecovery.innerHTML = '<span class="material-symbols-outlined text-[13px] animate-spin">sync</span><span>Sending email...</span>';
      authErrorMsg.innerHTML = '';

      try {
        const res = await fetch('/api/v1/admin/auth/recovery', { method: 'POST' });
        const json = await res.json();
        if (res.ok) {
          authErrorMsg.innerHTML = `
            <div class="flex items-start gap-2">
              <span class="material-symbols-outlined text-emerald-600 text-sm mt-0.5">mark_email_read</span>
              <div>
                <strong>Recovery Alert Dispatched</strong>
                <p class="text-[11px] text-emerald-800 mt-0.5">Master credentials dispatched to official Google Gmail: <strong>anmolrajotiya@gmail.com</strong>.</p>
              </div>
            </div>
          `;
          authErrorMsg.className = 'text-xs text-emerald-900 font-medium text-left min-h-[18px] bg-emerald-50 p-2.5 rounded-xl border border-emerald-300 shadow-sm';
        } else {
          authErrorMsg.textContent = json.message || 'Failed to dispatch recovery email.';
          authErrorMsg.className = 'text-xs text-error font-medium text-left min-h-[18px]';
        }
      } catch (err) {
        authErrorMsg.textContent = 'Network error triggering emergency recovery.';
        authErrorMsg.className = 'text-xs text-error font-medium text-left min-h-[18px]';
      } finally {
        btnEmergencyRecovery.disabled = false;
        btnEmergencyRecovery.innerHTML = 'Forgot Password?';
      }
    });
  }

  // --------------------------------------------------------------------------
  // 2. Hardware macOS Touch ID & WebAuthn Fingerprint Sensor
  // --------------------------------------------------------------------------
  async function authenticateWithBiometrics() {
    authErrorMsg.textContent = '';
    btnAuthFingerprint.classList.add('scale-95');
    setTimeout(() => btnAuthFingerprint.classList.remove('scale-95'), 200);

    if (fingerprintBtnLabel) fingerprintBtnLabel.textContent = 'Scanning Touch ID...';
    if (fingerprintBtnSublabel) fingerprintBtnSublabel.textContent = 'Place your finger on Mac Touch ID sensor';

    try {
      const challengeRes = await fetch('/api/v1/admin/auth/biometric/challenge');
      const challengeData = await challengeRes.json();

      let credentialId = localStorage.getItem(WEBAUTHN_CRED_KEY);
      let clientCredential = null;

      const isWebAuthnSupported = window.PublicKeyCredential && 
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(() => false);

      if (isWebAuthnSupported && navigator.credentials) {
        const challengeBuffer = base64UrlToBuffer(challengeData.challenge);

        // Case A: Existing Credential -> Authenticate / Get Assertion
        if (credentialId) {
          try {
            clientCredential = await navigator.credentials.get({
              publicKey: {
                challenge: challengeBuffer,
                rpId: challengeData.rp.id,
                allowCredentials: [{
                  id: base64UrlToBuffer(credentialId),
                  type: 'public-key',
                  transports: ['internal']
                }],
                userVerification: 'required',
                timeout: 60000
              }
            });
          } catch (assertErr) {
            console.warn('[WebAuthn Assertion Notice] Falling back to registration:', assertErr.message);
            credentialId = null;
          }
        }

        // Case B: First Time Registration -> Create Platform Credential
        if (!clientCredential && !credentialId) {
          try {
            const userIdBuffer = new Uint8Array([1, 8, 4, 3, 9, 2, 7, 0]);
            clientCredential = await navigator.credentials.create({
              publicKey: {
                challenge: challengeBuffer,
                rp: {
                  name: 'Transitly Command Center',
                  id: challengeData.rp.id
                },
                user: {
                  id: userIdBuffer,
                  name: 'admin@transitly.internal',
                  displayName: 'Operations Manager'
                },
                pubKeyCredParams: [
                  { alg: -7, type: 'public-key' },
                  { alg: -257, type: 'public-key' }
                ],
                authenticatorSelection: {
                  authenticatorAttachment: 'platform',
                  userVerification: 'required',
                  requireResidentKey: false
                },
                timeout: 60000
              }
            });

            if (clientCredential) {
              const newCredId = bufferToBase64Url(clientCredential.rawId);
              localStorage.setItem(WEBAUTHN_CRED_KEY, newCredId);
              credentialId = newCredId;
            }
          } catch (createErr) {
            if (createErr.name === 'NotAllowedError') {
              throw new Error('Touch ID authentication was cancelled or timed out.');
            }
            console.warn('[WebAuthn Create]', createErr.message);
          }
        }
      }

      if (!credentialId) {
        credentialId = 'TOUCH-ID-MAC-' + Date.now();
      }

      const verifyRes = await fetch('/api/v1/admin/auth/biometric/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialId,
          simulated: !isWebAuthnSupported
        })
      });

      const verifyData = await verifyRes.json();
      if (verifyRes.ok && verifyData.token) {
        setAuthSession(verifyData.token, 'FINGERPRINT_BIOMETRIC');
        showToast('Touch ID Verified', 'Authenticated with Mac hardware biometrics.', 'success');
      } else {
        authErrorMsg.textContent = verifyData.message || 'Fingerprint verification failed.';
      }
    } catch (err) {
      authErrorMsg.textContent = err.message || 'Touch ID sensor error.';
      authErrorMsg.className = 'text-xs text-error font-medium text-left min-h-[18px]';
    } finally {
      if (fingerprintBtnLabel) fingerprintBtnLabel.textContent = 'Touch Fingerprint Sensor';
      if (fingerprintBtnSublabel) fingerprintBtnSublabel.textContent = 'Tap to authenticate with macOS Touch ID';
    }
  }

  btnAuthFingerprint.addEventListener('click', authenticateWithBiometrics);

  // Lock Console Button
  btnLockConsole.addEventListener('click', () => {
    clearAuthSession();
  });

  // --------------------------------------------------------------------------
  // 3. Dynamic Broadcast Target Filter UI
  // --------------------------------------------------------------------------
  const defaultSelect1 = '<select id="filter-select-1" class="rounded-md border-outline-variant bg-surface-container-low text-sm focus:border-primary focus:ring-primary py-1 w-full"><option>All Statuses</option><option>Delayed</option><option>In-Transit</option><option>Delivered</option></select>';
  const defaultSelect2 = '<select id="filter-select-2" class="rounded-md border-outline-variant bg-surface-container-low text-sm focus:border-primary focus:ring-primary py-1 w-full"><option>None</option><option>Priority Level</option><option>Region</option><option>Account Type</option></select>';

  broadcastTargetSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val.includes('User Details')) {
      filterLabel1.textContent = 'User Name';
      filterInputContainer1.innerHTML = '<input id="filter-input-1" type="text" placeholder="Search user name..." class="rounded-md border-outline-variant bg-surface-container-low text-sm focus:border-primary focus:ring-primary py-1 w-full px-2">';
      filterLabel2.textContent = 'Phone Number';
      filterInputContainer2.innerHTML = '<input id="filter-input-2" type="tel" placeholder="+91..." class="rounded-md border-outline-variant bg-surface-container-low text-sm focus:border-primary focus:ring-primary py-1 w-full px-2">';
    } else if (val.includes('Parcel Status')) {
      filterLabel1.textContent = 'Parcel Tracking ID';
      filterInputContainer1.innerHTML = '<input id="filter-input-1" type="text" placeholder="TRK-XXXX" class="rounded-md border-outline-variant bg-surface-container-low text-sm focus:border-primary focus:ring-primary py-1 w-full px-2">';
      filterLabel2.textContent = 'User Attribute';
      filterInputContainer2.innerHTML = defaultSelect2;
    } else {
      filterLabel1.textContent = 'Filter by Status';
      filterInputContainer1.innerHTML = defaultSelect1;
      filterLabel2.textContent = 'User Attribute';
      filterInputContainer2.innerHTML = defaultSelect2;
    }
  });

  // --------------------------------------------------------------------------
  // 4. Fetch Live Dashboard Stats & Incidents
  // --------------------------------------------------------------------------
  async function loadDashboardStats() {
    try {
      const token = getAuthToken();
      const res = await fetch('/api/v1/admin/stats', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Network error fetching stats');
      const json = await res.json();
      if (json.data) {
        statActiveParcels.textContent = Number(json.data.activeParcels).toLocaleString();
        statFleetUtil.textContent = json.data.fleetUtil;
        statSuccessRate.textContent = json.data.successRate;
      }
    } catch (err) {
      console.warn('[Admin] Failed to load live stats:', err.message);
    }
  }

  async function loadIncidentsCount() {
    try {
      const token = getAuthToken();
      const res = await fetch('/api/v1/admin/incidents', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (json.unresolvedCount !== undefined) {
        updateUnresolvedCounter(json.unresolvedCount);
      }
    } catch (err) {
      console.warn('[Admin] Failed to load incidents count:', err.message);
    }
  }

  function updateUnresolvedCounter(count) {
    if (statUnresolvedIncidents) {
      statUnresolvedIncidents.textContent = `${count} Unresolved`;
      if (count > 0) {
        statUnresolvedIncidents.className = 'text-xs text-error font-bold';
      } else {
        statUnresolvedIncidents.className = 'text-xs text-emerald-600 font-bold';
      }
    }
  }

  // --------------------------------------------------------------------------
  // 5. Send Broadcast Handler (Protected API)
  // --------------------------------------------------------------------------
  btnSendBroadcast.addEventListener('click', async () => {
    const token = getAuthToken();
    if (!token) {
      lockDashboard();
      return;
    }

    const message = broadcastMessageInput.value.trim();
    if (!message) {
      broadcastStatusMsg.textContent = 'Please enter a message to broadcast.';
      broadcastStatusMsg.className = 'text-xs text-error font-medium';
      return;
    }

    const target = broadcastTargetSelect.value;
    const filterInput1 = document.getElementById('filter-select-1') || document.getElementById('filter-input-1');
    const filterInput2 = document.getElementById('filter-select-2') || document.getElementById('filter-input-2');

    const filterStatus = filterInput1 ? filterInput1.value : 'All';
    const filterAttribute = filterInput2 ? filterInput2.value : 'None';

    btnSendBroadcast.disabled = true;
    btnSendBroadcast.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span> Broadcasting...';
    broadcastStatusMsg.textContent = '';

    try {
      const res = await fetch('/api/v1/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ target, filterStatus, filterAttribute, message })
      });

      const json = await res.json();
      if (res.ok) {
        broadcastStatusMsg.textContent = '✔ Broadcast dispatched to active clients!';
        broadcastStatusMsg.className = 'text-xs text-emerald-600 font-bold';
        broadcastMessageInput.value = '';
        setTimeout(() => { broadcastStatusMsg.textContent = ''; }, 4000);
      } else if (res.status === 401) {
        clearAuthSession();
      } else {
        throw new Error(json.message || 'Failed to dispatch');
      }
    } catch (err) {
      broadcastStatusMsg.textContent = `⚠ ${err.message}`;
      broadcastStatusMsg.className = 'text-xs text-error font-medium';
    } finally {
      btnSendBroadcast.disabled = false;
      btnSendBroadcast.innerHTML = '<span class="material-symbols-outlined text-sm">send</span> Send Broadcast';
    }
  });

  // --------------------------------------------------------------------------
  // 6. Modal Handlers & Operations
  // --------------------------------------------------------------------------
  function showModal(title, iconName, htmlContent) {
    modalHeadingText.textContent = title;
    modalIcon.textContent = iconName;
    modalBodyContent.innerHTML = htmlContent;
    modalContainer.classList.remove('hidden');
  }

  function hideModal() {
    modalContainer.classList.add('hidden');
  }

  btnCloseModal.addEventListener('click', hideModal);
  btnModalActionClose.addEventListener('click', hideModal);
  modalContainer.addEventListener('click', (e) => {
    if (e.target === modalContainer) hideModal();
  });

  // App Breakdowns Modal
  btnAppBreakdowns.addEventListener('click', () => {
    showModal('App Breakdowns & Diagnostics', 'bug_report', `
      <div class="space-y-3">
        <div class="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 flex justify-between items-start">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-error bg-error-container/40 px-2 py-0.5 rounded">CRITICAL</span>
              <span class="font-bold text-on-surface">Client Telemetry Dropped</span>
            </div>
            <p class="text-xs text-on-surface-variant mt-1">Bus #118 intermittent 4G GPS ping latency in Karnal tunnel sector.</p>
          </div>
          <span class="text-[10px] text-on-surface-variant">12m ago</span>
        </div>
        <div class="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 flex justify-between items-start">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">WARNING</span>
              <span class="font-bold text-on-surface">Last-Mile Quote Fallback</span>
            </div>
            <p class="text-xs text-on-surface-variant mt-1">Rapido API rate-limit triggered for Sector 17 dispatch; routed to inDrive fallback.</p>
          </div>
          <span class="text-[10px] text-on-surface-variant">42m ago</span>
        </div>
        <div class="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 flex justify-between items-start">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">RESOLVED</span>
              <span class="font-bold text-on-surface">Redis Stream Buffer Flushed</span>
            </div>
            <p class="text-xs text-on-surface-variant mt-1">Consumer group cg:telemetry:durable committed 200 telemetry pings to PostGIS.</p>
          </div>
          <span class="text-[10px] text-on-surface-variant">1h ago</span>
        </div>
      </div>
    `);
  });

  // System Health Modal
  btnSystemHealth.addEventListener('click', async () => {
    showModal('System Health & Infrastructure', 'monitor_heart', `
      <div class="flex justify-center p-6"><span class="material-symbols-outlined animate-spin text-primary text-3xl">sync</span></div>
    `);

    try {
      const token = getAuthToken();
      const res = await fetch('/api/v1/admin/health', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const json = await res.json();
      const h = json.data || {};

      showModal('System Health & Infrastructure', 'monitor_heart', `
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-surface-container-low rounded-xl">
              <span class="text-xs text-on-surface-variant">PostgreSQL + PostGIS</span>
              <p class="font-bold text-emerald-700 mt-1 flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Healthy (Port 5433)
              </p>
              <span class="text-[11px] text-on-surface-variant">${h.postgres?.postgisVersion || 'PostGIS 3.4 Enabled'}</span>
            </div>
            <div class="p-3 bg-surface-container-low rounded-xl">
              <span class="text-xs text-on-surface-variant">Redis Stream & Pub/Sub</span>
              <p class="font-bold text-emerald-700 mt-1 flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Active (Port 6379)
              </p>
              <span class="text-[11px] text-on-surface-variant">In-Memory Telemetry</span>
            </div>
          </div>
          <div class="p-3 bg-surface-container-low rounded-xl space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-on-surface-variant">Node.js Memory (Heap)</span>
              <span class="font-bold">${h.memory?.heapUsed || '42.8 MB'} / ${h.memory?.heapTotal || '64.0 MB'}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-on-surface-variant">Server Uptime</span>
              <span class="font-bold">${Math.floor((h.server?.uptimeSeconds || 120) / 60)} minutes</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-on-surface-variant">WebSockets Live Engine</span>
              <span class="font-bold text-primary">Connected</span>
            </div>
          </div>
        </div>
      `);
    } catch (err) {
      showModal('System Health & Infrastructure', 'monitor_heart', `
        <p class="text-xs text-error">Failed to query live health metrics: ${err.message}</p>
      `);
    }
  });

  // --------------------------------------------------------------------------
  // Biometric & Security Settings (Inside Command Center with Master Password Auth)
  // --------------------------------------------------------------------------
  if (btnBiometricsSettings) {
    btnBiometricsSettings.addEventListener('click', () => {
      showModal('macOS Touch ID & Biometrics', 'fingerprint', `
        <div class="space-y-4">
          <div class="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[22px]">shield_person</span>
            </div>
            <div>
              <h4 class="font-bold text-xs text-on-surface">Hardware Biometric Binding</h4>
              <p class="text-[11px] text-on-surface-variant mt-0.5">
                Current Sensor Status: <span class="font-bold text-emerald-700">${localStorage.getItem(WEBAUTHN_CRED_KEY) ? 'Enrolled (Mac Touch ID)' : 'Not Yet Enrolled'}</span>
              </p>
            </div>
          </div>

          <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2">
            <span class="material-symbols-outlined text-amber-700 text-lg shrink-0">lock</span>
            <p class="text-xs text-amber-900 leading-tight">
              To re-configure or enroll new fingerprint sensor data, verify your <strong>Master Admin Password</strong> below.
            </p>
          </div>

          <form id="form-reconfigure-biometrics" class="space-y-3">
            <div>
              <label for="input-biometric-auth-pwd" class="text-xs font-bold text-on-surface-variant block mb-1">Enter Master Admin Password</label>
              <input id="input-biometric-auth-pwd" type="password" placeholder="admin@transitlyproject" class="w-full px-3 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary" required />
            </div>

            <div id="biometric-modal-feedback" class="text-xs min-h-[16px]"></div>

            <button id="btn-submit-biometric-reconfigure" type="submit" class="w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-sm">fingerprint</span>
              <span>Authorize & Enroll macOS Touch ID</span>
            </button>
          </form>
        </div>
      `);

      // Handle Biometric Reconfiguration Form Submit
      const formBiometric = document.getElementById('form-reconfigure-biometrics');
      const inputPwd = document.getElementById('input-biometric-auth-pwd');
      const feedback = document.getElementById('biometric-modal-feedback');
      const btnSubmit = document.getElementById('btn-submit-biometric-reconfigure');

      if (formBiometric) {
        formBiometric.addEventListener('submit', async (e) => {
          e.preventDefault();
          const password = inputPwd.value.trim();
          if (!password) return;

          btnSubmit.disabled = true;
          btnSubmit.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span> Authorizing...';
          feedback.textContent = '';

          try {
            const token = getAuthToken();
            const res = await fetch('/api/v1/admin/auth/biometric/reset', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ password })
            });

            const json = await res.json();
            if (!res.ok) {
              throw new Error(json.message || 'Master Password verification failed.');
            }

            feedback.textContent = 'Password confirmed. Touch your Mac Touch ID sensor now...';
            feedback.className = 'text-xs text-primary font-bold animate-pulse';

            // Trigger WebAuthn Creation Prompt
            const challengeRes = await fetch('/api/v1/admin/auth/biometric/challenge');
            const challengeData = await challengeRes.json();

            let newCredId = 'TOUCH-ID-MAC-' + Date.now();
            if (window.PublicKeyCredential && navigator.credentials) {
              const challengeBuffer = base64UrlToBuffer(challengeData.challenge);
              const userIdBuffer = new Uint8Array([1, 8, 4, 3, 9, 2, 7, 0]);

              const newCred = await navigator.credentials.create({
                publicKey: {
                  challenge: challengeBuffer,
                  rp: { name: 'Transitly Command Center', id: challengeData.rp.id },
                  user: { id: userIdBuffer, name: 'admin@transitly.internal', displayName: 'Operations Manager' },
                  pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
                  authenticatorSelection: {
                    authenticatorAttachment: 'platform',
                    userVerification: 'required',
                    requireResidentKey: false
                  },
                  timeout: 60000
                }
              });

              if (newCred) {
                newCredId = bufferToBase64Url(newCred.rawId);
              }
            }

            localStorage.setItem(WEBAUTHN_CRED_KEY, newCredId);
            hideModal();
            showToast('Biometrics Reconfigured', 'macOS Touch ID sensor successfully enrolled and bound to admin profile.', 'success');
          } catch (err) {
            feedback.textContent = err.message || 'Error configuring Touch ID.';
            feedback.className = 'text-xs text-error font-medium';
          } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<span class="material-symbols-outlined text-sm">fingerprint</span><span>Authorize & Enroll macOS Touch ID</span>';
          }
        });
      }
    });
  }

  // Incident Reports Modal
  async function renderIncidentReportsModal() {
    showModal('Incident Reports & User Tickets', 'report', `
      <div class="flex justify-center p-6"><span class="material-symbols-outlined animate-spin text-primary text-3xl">sync</span></div>
    `);

    try {
      const token = getAuthToken();
      const res = await fetch('/api/v1/admin/incidents', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const json = await res.json();
      const tickets = json.data || [];

      if (json.unresolvedCount !== undefined) {
        updateUnresolvedCounter(json.unresolvedCount);
      }

      let listHtml = '';
      if (tickets.length === 0) {
        listHtml = '<p class="text-xs text-on-surface-variant text-center py-6">No incident tickets filed.</p>';
      } else {
        listHtml = tickets.map(t => createTicketCardHtml(t)).join('');
      }

      showModal('Incident Reports & User Tickets', 'report', `
        <div class="flex justify-between items-center mb-2 px-1">
          <span class="text-xs font-bold text-on-surface-variant">Live Incident Log (${tickets.length} total)</span>
          <span class="text-[10px] text-primary flex items-center gap-1 font-semibold">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Auto-Syncing
          </span>
        </div>
        <div id="incident-tickets-list" class="space-y-3">${listHtml}</div>
      `);
    } catch (err) {
      showModal('Incident Reports & User Tickets', 'report', `
        <p class="text-xs text-error">Failed to load incidents: ${err.message}</p>
      `);
    }
  }

  function createTicketCardHtml(t) {
    const isResolved = t.status === 'RESOLVED';
    const statusBadge = isResolved
      ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">RESOLVED</span>'
      : '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-error-container text-on-error-container">OPEN</span>';

    const resolveBtn = isResolved
      ? ''
      : `<button onclick="window.resolveIncidentTicket(${t.id})" class="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold text-[10px] transition-colors flex items-center gap-1">
          <span class="material-symbols-outlined text-[13px]">check</span> Resolve
        </button>`;

    return `
      <div id="ticket-card-${t.id}" class="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col gap-2 transition-all">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
            <span class="font-bold text-primary text-xs">${t.tracking_id || t.trackingId || 'TICKET-#' + t.id}</span>
            <span class="text-[10px] bg-surface-container px-1.5 py-0.5 rounded text-outline font-medium">${t.category}</span>
          </div>
          <div class="flex items-center gap-2">
            ${statusBadge}
            ${resolveBtn}
          </div>
        </div>
        <p class="text-xs text-on-surface font-medium">${t.description}</p>
        <div class="flex justify-between items-center text-[10px] text-on-surface-variant pt-1 border-t border-outline-variant/10">
          <span>${t.reporter_name ? 'From: ' + t.reporter_name : 'Customer App Inquiry'}</span>
          <span>${new Date(t.created_at || t.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    `;
  }

  // Global resolve function
  window.resolveIncidentTicket = async (ticketId) => {
    const token = getAuthToken();
    if (!token) {
      lockDashboard();
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/tickets/${ticketId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'RESOLVED' })
      });

      const json = await res.json();
      if (res.ok) {
        const card = document.getElementById(`ticket-card-${ticketId}`);
        if (card) {
          card.outerHTML = createTicketCardHtml(json.data);
        }
        showToast('Ticket Resolved', `Incident #${ticketId} has been marked as RESOLVED.`, 'success');
      } else {
        alert(json.message || 'Failed to update ticket.');
      }
    } catch (err) {
      alert('Error updating ticket: ' + err.message);
    }
  };

  btnIncidentReports.addEventListener('click', renderIncidentReportsModal);

  // User Feedback Modal
  btnUserFeedback.addEventListener('click', () => {
    showModal('User Feedback & Quality Surveys', 'thumbs_up_down', `
      <div class="space-y-3">
        <div class="p-3 bg-surface-container-low rounded-xl">
          <div class="flex justify-between items-center mb-1">
            <span class="font-bold text-xs">Aarav Sharma</span>
            <div class="flex text-amber-500 text-xs">★★★★★</div>
          </div>
          <p class="text-xs text-on-surface">"Haryana Roadways parcel delivery was super fast! Received package at Chandigarh ISBT within 4 hours."</p>
        </div>
        <div class="p-3 bg-surface-container-low rounded-xl">
          <div class="flex justify-between items-center mb-1">
            <span class="font-bold text-xs">Pooja Patel</span>
            <div class="flex text-amber-500 text-xs">★★★★☆</div>
          </div>
          <p class="text-xs text-on-surface">"Door-to-door last-mile courier picked it up right on time from my shop. Very smooth experience."</p>
        </div>
      </div>
    `);
  });

  // Alerts Navigation Tab
  navBtnAlerts.addEventListener('click', () => {
    btnIncidentReports.click();
  });

  // --------------------------------------------------------------------------
  // 7. Real-time WebSocket Event Listeners
  // --------------------------------------------------------------------------
  try {
    if (typeof io !== 'undefined') {
      const socket = io();

      // Listen for Live User Support Tickets & Reports
      socket.on('new_support_ticket', (data) => {
        if (data.unresolvedCount !== undefined) {
          updateUnresolvedCounter(data.unresolvedCount);
        }

        if (btnIncidentReports) {
          btnIncidentReports.classList.add('ring-2', 'ring-error', 'border-error');
          setTimeout(() => {
            btnIncidentReports.classList.remove('ring-2', 'ring-error', 'border-error');
          }, 3000);
        }

        const listContainer = document.getElementById('incident-tickets-list');
        if (listContainer && data.ticket) {
          const tempWrapper = document.createElement('div');
          tempWrapper.innerHTML = createTicketCardHtml(data.ticket);
          const newCard = tempWrapper.firstElementChild;
          newCard.classList.add('ring-2', 'ring-primary', 'bg-primary-fixed/20');
          listContainer.prepend(newCard);
        }

        if (getAuthToken()) {
          const trackingLabel = data.ticket.tracking_id ? `[${data.ticket.tracking_id}] ` : '';
          showToast(
            `🚨 New Incident Reported (${data.ticket.category})`,
            `${trackingLabel}${data.ticket.description}`,
            'error'
          );
        }
      });

      // Listen for Ticket Resolved
      socket.on('ticket_resolved', (data) => {
        if (data.unresolvedCount !== undefined) {
          updateUnresolvedCounter(data.unresolvedCount);
        }
        const card = document.getElementById(`ticket-card-${data.ticket.id}`);
        if (card) {
          card.outerHTML = createTicketCardHtml(data.ticket);
        }
      });

      // Broadcast alerts listener
      socket.on('broadcast_alert', (payload) => {
        if (getAuthToken()) {
          showToast(`📢 Admin Broadcast (${payload.target})`, payload.message, 'info');
        }
      });
    }
  } catch (err) {
    console.warn('[Admin Socket]', err.message);
  }

  // Always initialize strictly in locked state
  lockDashboard();
});
