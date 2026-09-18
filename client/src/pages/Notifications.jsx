import React, { useState } from 'react';
import { Card3D } from '../components/atoms/Card3D';
import { Button3D } from '../components/atoms/Button3D';
import { Icon } from '../components/atoms/Icon';
import { Badge } from '../components/atoms/Badge';
import { useNavigate } from 'react-router-dom';

export const Notifications = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'delivery',
      title: 'Bus HR-68-A-1001 Departed Karnal Hub',
      desc: 'Highway transit speed 72 km/h. ETA to Sector 43 ISBT is 02:30 PM.',
      time: '12 mins ago',
      unread: true,
      link: '/tracking?id=TRK-88219',
      icon: 'directions_bus'
    },
    {
      id: 2,
      type: 'delivery',
      title: 'First-Mile Rider Assigned',
      desc: 'Partner Rajesh Kumar is en-route with your package to Kashmiri Gate ISBT.',
      time: '1 hour ago',
      unread: false,
      link: '/tracking?id=TRK-88219',
      icon: 'two_wheeler'
    },
    {
      id: 3,
      type: 'promo',
      title: 'Flat ₹20 Off on Delhi ⇄ Chandigarh Corridor',
      desc: 'Use promo code INTERCITY20 on your next scheduled bus booking.',
      time: '5 hours ago',
      unread: false,
      link: '/services',
      icon: 'local_offer'
    },
    {
      id: 4,
      type: 'system',
      title: 'Monthly Wallet Statement Ready',
      desc: 'Your August 2026 freight and delivery statement is now available.',
      time: '1 day ago',
      unread: false,
      link: '/payment-methods',
      icon: 'description'
    }
  ]);

  const filtered = notifications.filter((n) => {
    if (filter === 'ALL') return true;
    if (filter === 'DELIVERIES') return n.type === 'delivery';
    if (filter === 'PROMOS') return n.type === 'promo';
    return true;
  });

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <Icon name="arrow_back" size="sm" />
          </button>
          <div>
            <h1 className="text-xl font-black text-[#191b24]">Notifications</h1>
            <p className="text-xs text-slate-500">Live corridor telematics and dispatch updates</p>
          </div>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          className="text-xs font-bold text-[#0050cb] hover:underline"
        >
          Mark all read
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {[
          { key: 'ALL', label: 'All' },
          { key: 'DELIVERIES', label: 'Live Deliveries' },
          { key: 'PROMOS', label: 'Offers' }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
              filter === tab.key
                ? 'bg-white text-[#0050cb] shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <Card3D
            key={item.id}
            className={`p-4 border transition-all cursor-pointer ${
              item.unread
                ? 'bg-blue-50/40 border-blue-200 shadow-sm'
                : 'bg-white border-[#ecedfa]'
            }`}
            onClick={() => navigate(item.link)}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                  item.unread
                    ? 'bg-[#0050cb] text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Icon name={item.icon} size="md" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-[#191b24]">{item.title}</h3>
                  <span className="text-[10px] text-slate-400">{item.time}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
              </div>
              {item.unread && (
                <span className="w-2 h-2 rounded-full bg-[#0050cb] shrink-0 mt-1.5" />
              )}
            </div>
          </Card3D>
        ))}
      </div>
    </div>
  );
};
