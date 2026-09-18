import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CustomerLayout } from './components/layouts/CustomerLayout';
import { PartnerLayout } from './components/layouts/PartnerLayout';
import { AuthLayout } from './components/layouts/AuthLayout';
import { Home } from './pages/Home';
import { Tracking } from './pages/Tracking';
import { Services } from './pages/Services';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { SavedAddresses } from './pages/SavedAddresses';
import { PaymentMethods } from './pages/PaymentMethods';
import { Notifications } from './pages/Notifications';
import { HelpSupport } from './pages/HelpSupport';
import { Settings } from './pages/Settings';
import { RiderDashboard } from './pages/RiderDashboard';
import { RiderMapTrips } from './pages/RiderMapTrips';
import { RiderRequests } from './pages/RiderRequests';
import { RiderEarnings } from './pages/RiderEarnings';
import { RiderProfile } from './pages/RiderProfile';
import { DeliveryPartnerLanding } from './pages/DeliveryPartnerLanding';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Faq } from './pages/Faq';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { Terms } from './pages/Terms';
import { NotFound } from './pages/NotFound';
import { VisualSitemap } from './pages/VisualSitemap';
import { useAuth } from './hooks/useAuth';

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
  );
}
