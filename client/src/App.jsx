import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CustomerLayout } from './components/layouts/CustomerLayout';
import { PartnerLayout } from './components/layouts/PartnerLayout';
import { AuthLayout } from './components/layouts/AuthLayout';
import { useAuth } from './hooks/useAuth';

// Lazy-loaded routes for code splitting
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Tracking = lazy(() => import('./pages/Tracking').then(m => ({ default: m.Tracking })));
const Services = lazy(() => import('./pages/Services').then(m => ({ default: m.Services })));
const History = lazy(() => import('./pages/History').then(m => ({ default: m.History })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const SavedAddresses = lazy(() => import('./pages/SavedAddresses').then(m => ({ default: m.SavedAddresses })));
const PaymentMethods = lazy(() => import('./pages/PaymentMethods').then(m => ({ default: m.PaymentMethods })));
const Notifications = lazy(() => import('./pages/Notifications').then(m => ({ default: m.Notifications })));
const HelpSupport = lazy(() => import('./pages/HelpSupport').then(m => ({ default: m.HelpSupport })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const RiderDashboard = lazy(() => import('./pages/RiderDashboard').then(m => ({ default: m.RiderDashboard })));
const RiderMapTrips = lazy(() => import('./pages/RiderMapTrips').then(m => ({ default: m.RiderMapTrips })));
const RiderRequests = lazy(() => import('./pages/RiderRequests').then(m => ({ default: m.RiderRequests })));
const RiderEarnings = lazy(() => import('./pages/RiderEarnings').then(m => ({ default: m.RiderEarnings })));
const RiderProfile = lazy(() => import('./pages/RiderProfile').then(m => ({ default: m.RiderProfile })));
const DeliveryPartnerLanding = lazy(() => import('./pages/DeliveryPartnerLanding').then(m => ({ default: m.DeliveryPartnerLanding })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Signup = lazy(() => import('./pages/Signup').then(m => ({ default: m.Signup })));
const Faq = lazy(() => import('./pages/Faq').then(m => ({ default: m.Faq })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const Terms = lazy(() => import('./pages/Terms').then(m => ({ default: m.Terms })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));
const VisualSitemap = lazy(() => import('./pages/VisualSitemap').then(m => ({ default: m.VisualSitemap })));

const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-8 h-8 border-3 border-[#0050cb] border-t-transparent rounded-full animate-spin" />
  </div>
);

// Strict Role Gatekeeper
const RoleRoute = ({ allowedRole, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]">
        <div className="w-8 h-8 border-3 border-[#0050cb] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to={user.role === 'DELIVERY_PARTNER' ? '/rider-dashboard' : '/'} replace />;
  }

  return children;
};

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* Public Informational & Legal Routes (Wrapped in Customer Layout for Header/Footer) */}
        <Route element={<CustomerLayout />}>
          <Route path="/faq" element={<Faq />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/delivery-partner" element={<DeliveryPartnerLanding />} />
          <Route path="/visual-sitemap" element={<VisualSitemap />} />
          <Route path="/sitemap" element={<VisualSitemap />} />
          <Route path="/404" element={<NotFound />} />
        </Route>

        {/* Customer Domain Protected Routes */}
        <Route
          element={
            <RoleRoute allowedRole="CUSTOMER">
              <CustomerLayout />
            </RoleRoute>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/services" element={<Services />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/saved-addresses" element={<SavedAddresses />} />
          <Route path="/payment-methods" element={<PaymentMethods />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/help-support" element={<HelpSupport />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Delivery Partner Domain Protected Routes */}
        <Route
          element={
            <RoleRoute allowedRole="DELIVERY_PARTNER">
              <PartnerLayout />
            </RoleRoute>
          }
        >
          <Route path="/rider-dashboard" element={<RiderDashboard />} />
          <Route path="/rider-map-trips" element={<RiderMapTrips />} />
          <Route path="/rider-requests" element={<RiderRequests />} />
          <Route path="/rider-earnings" element={<RiderEarnings />} />
          <Route path="/rider-profile" element={<RiderProfile />} />
        </Route>

        {/* Catch-all Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
