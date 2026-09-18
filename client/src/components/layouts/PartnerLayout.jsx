import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Icon } from '../atoms/Icon';
import { Badge } from '../atoms/Badge';
import { useAuth } from '../../hooks/useAuth';

export const PartnerLayout = () => {
  const { switchRole } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);

  const navItems = [
    { to: '/rider-dashboard', label: 'Cockpit', icon: 'dashboard', end: true },
    { to: '/rider-map-trips', label: 'Live Trip', icon: 'navigation' },
    { to: '/rider-requests', label: 'Queue', icon: 'list_alt' },
    { to: '/rider-earnings', label: 'Earnings', icon: 'payments' },
    { to: '/rider-profile', label: 'Profile', icon: 'person' }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#faf8ff] text-[#191b24] pb-24">
      {/* Top Cockpit Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-xl border-b border-[#ecedfa] pt-safe">
        <div className="max-w-screen-md mx-auto h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsOnline(!isOnline)}
              className="cursor-pointer"
            >
              <Badge variant={isOnline ? 'online' : 'neutral'} pulse={isOnline}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </Badge>
            </button>
            <div className="flex items-center gap-1 bg-[#f2f3ff] px-2.5 py-1 rounded-full text-xs font-bold text-[#0050cb]">
              <Icon name="account_balance_wallet" size="xs" />
              <span>₹148.50</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                switchRole('CUSTOMER');
                navigate('/');
              }}
              className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full hover:bg-slate-200 transition"
            >
              Customer Mode ➔
            </button>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-screen-md w-full mx-auto pt-20 px-4">
        <Outlet />
      </main>

      {/* Bottom Driver Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe bg-white/90 backdrop-blur-xl border-t border-[#ecedfa]">
        <div className="max-w-screen-md mx-auto h-16 px-4 flex items-center justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-[#0050cb] font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-600 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon name={item.icon} size="md" filled={isActive} />
                  <span className="text-[10px] tracking-tight">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};
