import React, { useState } from 'react';
import { Card3D } from '../components/atoms/Card3D';
import { Button3D } from '../components/atoms/Button3D';
import { Icon } from '../components/atoms/Icon';
import { Badge } from '../components/atoms/Badge';
import { useNavigate } from 'react-router-dom';

export const History = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);

  const ORDERS = [
    {
      id: 'TRK-88219',
      date: 'Today, 11:30 AM',
      from: 'ISBT Kashmiri Gate, Delhi',
      to: 'Sector 43 ISBT, Chandigarh',
      carrier: 'HR-68-A-1001 (Volvo Express)',
      status: 'in_transit',
      statusText: 'In-Transit on NH-44',
      amount: '₹148.00',
      weight: '2.5 kg',
      pin: '4829'
    },
    {
      id: 'TRK-77102',
      date: 'Yesterday, 04:15 PM',
      from: 'Swargate Bus Station, Pune',
      to: 'Dadar Asiad Stand, Mumbai',
      carrier: 'MH-12-Q-4050 (MSRTC Shivneri)',
      status: 'delivered',
      statusText: 'Delivered to Recipient',
      amount: '₹85.00',
      weight: '1.2 kg',
      pin: '9134'
    },
    {
      id: 'TRK-65490',
      date: '16 Sep 2026',
      from: 'Majestic Bus Stand, Bengaluru',
      to: 'Koyambedu CMBT, Chennai',
      carrier: 'KA-01-F-8899 (KSRTC Airavat)',
      status: 'delivered',
      statusText: 'Delivered to Recipient',
      amount: '₹120.00',
      weight: '3.8 kg',
      pin: '2280'
    },
    {
      id: 'TRK-54311',
      date: '12 Sep 2026',
      from: 'Anand Vihar ISBT, Delhi',
      to: 'Sindhi Camp, Jaipur',
      carrier: 'RJ-14-P-3341 (RSRTC Express)',
      status: 'delivered',
      statusText: 'Delivered to Recipient',
      amount: '₹95.00',
      weight: '1.8 kg',
      pin: '7741'
    }
  ];

  const filteredOrders = ORDERS.filter((order) => {
    if (filter === 'ALL') return true;
    if (filter === 'IN_TRANSIT') return order.status === 'in_transit';
    if (filter === 'DELIVERED') return order.status === 'delivered';
    return true;
  });

  const handleCopyId = (id) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#191b24] tracking-tight">Shipment History</h1>
          <p className="text-xs text-slate-500">Track and manage past and active intercity consignments</p>
        </div>
        <Button3D
          variant="primary"
          size="sm"
          icon="add"
          onClick={() => navigate('/?book=true')}
        >
          New Booking
        </Button3D>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {[
          { key: 'ALL', label: 'All Orders' },
          { key: 'IN_TRANSIT', label: 'Active In-Transit' },
          { key: 'DELIVERED', label: 'Delivered' }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === tab.key
                ? 'bg-white text-[#0050cb] shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-[#ecedfa] p-6">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0050cb] flex items-center justify-center mx-auto mb-2">
              <Icon name="inbox" size="md" />
            </div>
            <div className="font-bold text-sm text-[#191b24]">No shipments found</div>
            <p className="text-xs text-slate-400 mt-1">You have no parcels in this category.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isLive = order.status === 'in_transit';

            return (
              <Card3D
                key={order.id}
                className={`p-5 transition-all ${
                  isLive
                    ? 'border-2 border-[#0050cb] shadow-md ring-4 ring-blue-50/50'
                    : 'border border-[#ecedfa] hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyId(order.id)}
                      className="flex items-center gap-1 font-mono font-bold text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition"
                      title="Click to copy tracking ID"
                    >
                      <span>{order.id}</span>
                      <Icon name={copiedId === order.id ? 'check' : 'content_copy'} size="xs" />
                    </button>
                    <span className="text-[11px] text-slate-400 font-medium">{order.date}</span>
                  </div>

                  <Badge variant={isLive ? 'in_transit' : 'delivered'} pulse={isLive}>
                    {order.statusText}
                  </Badge>
                </div>

                {/* Route Leg */}
                <div className="py-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    <span className="text-slate-500">From:</span>
                    <span className="font-bold text-[#191b24]">{order.from}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    <span className="text-slate-500">To:</span>
                    <span className="font-bold text-[#191b24]">{order.to}</span>
                  </div>
                </div>

                {/* Meta details & Action */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">CARRIER</span>
                      <span className="font-semibold text-slate-700">{order.carrier}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">PAID</span>
                      <span className="font-black text-emerald-600">{order.amount}</span>
                    </div>
                    {isLive && (
                      <div>
                        <span className="text-slate-400 block text-[10px]">DELIVERY PIN</span>
                        <span className="font-mono font-bold text-[#0050cb]">{order.pin}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isLive ? (
                      <Button3D
                        variant="primary"
                        size="sm"
                        icon="distance"
                        onClick={() => navigate(`/tracking?id=${order.id}`)}
                      >
                        Track Telematics ➔
                      </Button3D>
                    ) : (
                      <Button3D
                        variant="secondary"
                        size="sm"
                        icon="receipt_long"
                        onClick={() => alert(`Invoice downloaded for ${order.id}`)}
                      >
                        Receipt
                      </Button3D>
                    )}
                  </div>
                </div>
              </Card3D>
            );
          })
        )}
      </div>
    </div>
  );
};
