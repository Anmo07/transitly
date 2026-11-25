/**
 * Transitly Instant Client-Side Authorization Gate
 * Executes synchronously in <head> to eliminate unauthenticated view leakage
 * and enforce role boundaries on static CDN / Netlify deployments.
 */
(function() {
  const path = window.location.pathname.toLowerCase().replace(/\.html$/, '').replace(/\/$/, '') || '/';
  
  const PUBLIC_ROUTES = [
    '/login', '/signin', '/auth', '/verify',
    '/signup', '/register', '/create-account',
    '/privacy', '/privacy-policy',
    '/terms', '/terms-and-conditions', '/terms-of-use',
    '/faq', '/faqs',
    '/visual-sitemap', '/sitemap',
    '/404'
  ];

  if (PUBLIC_ROUTES.some(p => path === p || path.startsWith(p + '/'))) {
    return; // Public page, allow immediate access
  }

  // Extract token from localStorage or session cookie
  const token = localStorage.getItem('transitly_auth_token') || 
    (document.cookie.match(/(?:^|;\s*)transitly_session=([^\s;]+)/)?.[1]);

  if (!token) {
    // Hide DOM immediately to prevent Flash of Unauthenticated Content (FOUC)
    if (document.documentElement) {
      document.documentElement.style.display = 'none';
    }
    const redirectTarget = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace('/login?redirect=' + redirectTarget);
    return;
  }

  // Enforce Role Separation on static hosts
  const role = localStorage.getItem('transitly_user_role') || 
    (document.cookie.match(/(?:^|;\s*)transitly_user_role=([^;]+)/)?.[1]) || 'CUSTOMER';

  const partnerRoutes = [
    '/rider-dashboard', '/rider-map-trips', '/rider-requests',
    '/rider-earnings', '/rider-profile', '/delivery-partner'
  ];
  const isPartnerRoute = partnerRoutes.some(pr => path === pr || path.startsWith(pr + '/'));

  if (role === 'CUSTOMER' && isPartnerRoute) {
    if (document.documentElement) document.documentElement.style.display = 'none';
    window.location.replace('/');
    return;
  }

  if (role === 'DELIVERY_PARTNER' && !isPartnerRoute) {
    if (document.documentElement) document.documentElement.style.display = 'none';
    window.location.replace('/rider-dashboard');
    return;
  }
})();
