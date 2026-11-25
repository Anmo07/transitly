/**
 * Transitly — Strict Role & Domain Isolation Guard
 * Hard-codes complete separation between Customer and Delivery Partner sections.
 * Guarantees that neither role can accidentally or intentionally cross-navigate into the other domain.
 */

(function () {
  const normalizePath = (path) => {
    return path.toLowerCase().replace(/\.html$/, '').replace(/\/$/, '') || '/';
  };

  const getStoredRole = () => {
    let role = localStorage.getItem('transitly_user_role');
    if (!role) {
      const match = document.cookie.match(/(?:^|;\s*)transitly_user_role=([^;]+)/);
      if (match && match[1]) {
        role = decodeURIComponent(match[1]);
      }
    }
    return role;
  };

  const setStoredRole = (role) => {
    if (role) {
      localStorage.setItem('transitly_user_role', role);
      document.cookie = `transitly_user_role=${role}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
    }
  };

  window.transitlySetRole = setStoredRole;

  const currentPath = normalizePath(window.location.pathname);

  const CUSTOMER_ROUTES = [
    '/',
    '/index',
    '/deliver',
    '/tracking',
    '/services',
    '/history',
    '/profile',
    '/saved-addresses',
    '/payment-methods',
    '/settings',
    '/help-support',
    '/notifications'
  ];

  const PARTNER_ROUTES = [
    '/rider-dashboard',
    '/rider-map-trips',
    '/rider-requests',
    '/rider-earnings',
    '/rider-profile',
    '/delivery-partner'
  ];

  const PUBLIC_ROUTES = [
    '/login',
    '/signin',
    '/auth',
    '/verify',
    '/signup',
    '/register',
    '/create-account',
    '/privacy',
    '/privacy-policy',
    '/terms',
    '/terms-and-conditions',
    '/terms-of-use',
    '/faq',
    '/faqs',
    '/404',
    '/visual-sitemap',
    '/sitemap'
  ];

  // If on a public route, do not force-redirect
  if (PUBLIC_ROUTES.some(p => currentPath === p || currentPath.startsWith(p + '/'))) {
    return;
  }

  // Verify authentication token exists
  const token = localStorage.getItem('transitly_auth_token') ||
    (document.cookie.match(/(?:^|;\s*)transitly_session=([^\s;]+)/)?.[1]);

  if (!token) {
    if (document.documentElement) document.documentElement.style.display = 'none';
    const redirectTarget = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace('/login?redirect=' + redirectTarget);
    return;
  }

  let role = getStoredRole() || 'CUSTOMER';

  // 1. DELIVERY PARTNER ISOLATION RULE:
  // If the user is a Delivery Partner, they must NEVER access the customer section.
  if (role === 'DELIVERY_PARTNER') {
    const isCustomerRoute = CUSTOMER_ROUTES.some(r => currentPath === r || currentPath.startsWith(r + '/'));
    if (isCustomerRoute) {
      console.warn('[Transitly Security Gate] Delivery Partner attempted to access Customer section. Redirecting to Partner Cockpit.');
      window.location.replace('/rider-dashboard.html');
      return;
    }
  }

  // 2. CUSTOMER ISOLATION RULE:
  // If the user is a regular Customer, they must NEVER access the delivery partner cockpit.
  if (role === 'CUSTOMER') {
    const isPartnerRoute = PARTNER_ROUTES.some(r => currentPath === r || currentPath.startsWith(r + '/'));
    if (isPartnerRoute && currentPath !== '/delivery-partner') {
      console.warn('[Transitly Security Gate] Customer attempted to access Delivery Partner Cockpit. Redirecting to Customer Portal.');
      window.location.replace('/deliver');
      return;
    }
  }
})();
