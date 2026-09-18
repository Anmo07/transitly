import React from 'react';
import { Card3D } from '../components/atoms/Card3D';
import { Button3D } from '../components/atoms/Button3D';
import { Icon } from '../components/atoms/Icon';
import { Badge } from '../components/atoms/Badge';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const Profile = () => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  const MENU_ITEMS = [
    { label: 'Saved Addresses', sub: 'Home, warehouse & interstate hubs', icon: 'pin_drop', to: '/saved-addresses' },
    { label: 'Payment Methods & Wallet', sub: 'UPI, cards, Transitly credits', icon: 'account_balance_wallet', to: '/payment-methods' },
    { label: 'Shipment History', sub: 'All intercity consignment receipts', icon: 'history', to: '/history' },
    { label: 'Notification Settings', sub: 'SMS, WhatsApp & push triggers', icon: 'notifications', to: '/notifications' },
    { label: 'Help & 24x7 Support', sub: 'Corridor tracking & ticket helpline', icon: 'support_agent', to: '/help-support' },
    { label: 'Legal, Terms & Privacy', sub: 'DPDP compliance & cargo terms', icon: 'policy', to: '/privacy-policy' }
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
      {/* Profile Card */}
      <Card3D className="p-6 bg-gradient-to-br from-white to-[#f0f3fa] border border-[#ecedfa] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-[#0050cb] text-white flex items-center justify-center font-black text-2xl shadow-md">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg text-[#191b24]">{user?.name || 'Anmol Verma'}</h1>
              <Badge variant="verified">KYC VERIFIED</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email || 'anmol@transitly.in'}</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">+91 98765 43210</p>
          </div>
        </div>

        {/* Quick Balance Preview */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="wallet" size="sm" className="text-[#0050cb]" />
            <span className="text-xs font-bold text-slate-600">Transitly Pay Balance</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-emerald-600">₹450.00</span>
            <button
              type="button"
              onClick={() => navigate('/payment-methods')}
              className="text-[11px] font-bold text-[#0050cb] hover:underline"
            >
              + Top-up
            </button>
          </div>
        </div>
      </Card3D>

      {/* Role Switch Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0050cb] text-white flex items-center justify-center">
            <Icon name="two_wheeler" size="md" />
          </div>
          <div>
            <div className="font-bold text-xs text-[#0050cb]">Drive with Transitly</div>
            <div className="text-[11px] text-slate-600">Switch to Delivery Partner cockpit</div>
          </div>
        </div>
        <Button3D
          variant="primary"
          size="sm"
          onClick={() => {
            switchRole('DELIVERY_PARTNER');
            navigate('/rider-dashboard');
          }}
        >
          Partner Mode ➔
        </Button3D>
      </div>

      {/* Menu List */}
      <div className="bg-white rounded-3xl border border-[#ecedfa] divide-y divide-slate-100 overflow-hidden shadow-sm">
        {MENU_ITEMS.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => navigate(item.to)}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <Icon name={item.icon} size="sm" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#191b24]">{item.label}</div>
                <div className="text-[11px] text-slate-400">{item.sub}</div>
              </div>
            </div>
            <Icon name="chevron_right" size="sm" className="text-slate-300" />
          </button>
        ))}
      </div>

      {/* Sign Out Button */}
      <div className="pt-2">
        <Button3D
          variant="secondary"
          size="full"
          icon="logout"
          onClick={logout}
          className="text-red-600 hover:bg-red-50 hover:border-red-200"
        >
          Sign Out of Account
        </Button3D>
      </div>
    </div>
  );
};
