import React from 'react';
import { Card3D } from '../components/atoms/Card3D';
import { Badge } from '../components/atoms/Badge';
import { Icon } from '../components/atoms/Icon';
import { useNavigate } from 'react-router-dom';

export const VisualSitemap = () => {
  const navigate = useNavigate();

  const DOMAINS = [
    {
      title: 'Customer Parcel Logistics Domain',
      badge: 'STRICT ROLE: CUSTOMER',
      routes: [
        { path: '/', label: 'Home Hub & Parcel Booking', icon: 'home' },
        { path: '/tracking', label: 'Live Highway Telematics Tracking', icon: 'distance' },
        { path: '/services', label: 'Corridor Services & Rate Calculator', icon: 'local_shipping' },
        { path: '/history', label: 'Consignment History & Invoices', icon: 'history' },
        { path: '/profile', label: 'Customer Account & KYC', icon: 'person' },
        { path: '/saved-addresses', label: 'Saved Addresses & Bus Terminals', icon: 'pin_drop' },
        { path: '/payment-methods', label: 'Transitly Pay Wallet & UPI', icon: 'account_balance_wallet' },
        { path: '/notifications', label: 'Telematics Notification Center', icon: 'notifications' },
        { path: '/help-support', label: '24x7 Emergency Help Desk', icon: 'support_agent' },
        { path: '/settings', label: 'Account Security & DPDP Preferences', icon: 'settings' }
      ]
    },
    {
      title: 'Delivery Partner Cockpit Domain',
      badge: 'STRICT ROLE: DELIVERY_PARTNER',
      routes: [
        { path: '/rider-dashboard', label: 'Driver Cockpit & Duty Switch', icon: 'dashboard' },
        { path: '/rider-map-trips', label: 'Live In-Transit Trip Navigation', icon: 'navigation' },
        { path: '/rider-requests', label: 'Spatial Dispatch Queue & Offers', icon: 'list_alt' },
        { path: '/rider-earnings', label: 'Partner Earnings & Instant Payout', icon: 'payments' },
        { path: '/rider-profile', label: 'Partner Profile & SOS Safety', icon: 'person' },
        { path: '/delivery-partner', label: 'Driver Recruitment Portal', icon: 'two_wheeler' }
      ]
    },
    {
      title: 'Public SEO & Compliance Domain',
      badge: 'PUBLIC ACCESS',
      routes: [
        { path: '/login', label: 'Two-Step Authentication & Passcode', icon: 'login' },
        { path: '/signup', label: 'Account Registration & KYC', icon: 'person_add' },
        { path: '/faq', label: 'Knowledge Base & FAQs', icon: 'quiz' },
        { path: '/privacy-policy', label: 'DPDP Act (2023) Privacy Policy', icon: 'policy' },
        { path: '/terms', label: 'Carriage Terms & Prohibited Cargo', icon: 'gavel' },
        { path: '/404', label: 'Tactile 404 Error Page', icon: 'error_outline' }
      ]
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto py-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge variant="verified">ARCHITECTURE GRAPH</Badge>
        <h1 className="text-2xl sm:text-3xl font-black text-[#191b24] tracking-tight">
          Visual Navigation Sitemap
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Component architecture map spanning 23 interactive views across customer, partner, and legal domains
        </p>
      </div>

      {/* Domain Trees */}
      <div className="space-y-6">
        {DOMAINS.map((domain, idx) => (
          <div key={idx} className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <h2 className="font-extrabold text-sm text-[#191b24]">{domain.title}</h2>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-[#0050cb]">
                {domain.badge}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {domain.routes.map((r) => (
                <Card3D
                  key={r.path}
                  className="p-3.5 border border-[#ecedfa] hover:border-[#0050cb] transition cursor-pointer flex items-center justify-between"
                  onClick={() => navigate(r.path)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0050cb] flex items-center justify-center">
                      <Icon name={r.icon} size="sm" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-[#191b24]">{r.label}</div>
                      <div className="text-[10px] font-mono text-slate-400">{r.path}</div>
                    </div>
                  </div>
                  <Icon name="arrow_forward" size="xs" className="text-slate-300" />
                </Card3D>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
