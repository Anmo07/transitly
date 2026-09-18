import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Icon } from '../atoms/Icon';
import { useAuth } from '../../hooks/useAuth';

export const CustomerLayout = () => {
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/', label: 'Home', icon: 'home', end: true },
    { to: '/tracking', label: 'Tracking', icon: 'distance' },
    { to: '/services', label: 'Services', icon: 'local_shipping' },
    { to: '/history', label: 'History', icon: 'history' },
    { to: '/profile', label: 'Profile', icon: 'person' }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#faf8ff] text-[#191b24] pb-24">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-xl border-b border-[#ecedfa] pt-safe">
        <div className="max-w-screen-md mx-auto h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0050cb] text-white flex items-center justify-center font-black text-base shadow-sm">
              T
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-[#191b24]">Transitly</span>
              <span className="text-[10px] font-bold text-[#0050cb]">Intercity Bus Logistics</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                switchRole('DELIVERY_PARTNER');
                navigate('/rider-dashboard');
              }}
              className="text-xs font-bold text-[#0050cb] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 hover:bg-blue-100 transition"
            >
              Partner Cockpit ➔
            </button>
            <NavLink to="/notifications" className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition">
              <Icon name="notifications" size="sm" badge={2} />
            </NavLink>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-screen-md w-full mx-auto pt-20 px-4">
        <Outlet />
      </main>

      {/* Bottom Floating Navigation */}
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
