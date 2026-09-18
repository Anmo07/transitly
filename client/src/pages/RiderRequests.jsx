import React, { useState, useEffect } from 'react';
import { Card3D } from '../components/atoms/Card3D';
import { Button3D } from '../components/atoms/Button3D';
import { Icon } from '../components/atoms/Icon';
import { Badge } from '../components/atoms/Badge';
import { DispatchQueue } from '../components/molecules/DispatchQueue';
import { DutyToggle } from '../components/molecules/DutyToggle';
import { useNavigate } from 'react-router-dom';

export const RiderRequests = () => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const [activeOffer, setActiveOffer] = useState({
    id: 1,
    payout: 185,
    pickupDistance: '0.8 km away (3 mins)',
    pickupLocation: 'B-42 Defence Colony, New Delhi',
    dropoffDistance: '4.2 km leg (12 mins)',
    dropoffLocation: 'ISBT Kashmiri Gate (Bus Bay 3)',
    packageType: 'High Priority Pharma Pouch',
    weight: '1.4 kg'
  });

  const [poolOrders, setPoolOrders] = useState([
    {
      id: 2,
      payout: 140,
      pickup: 'Anand Vihar ISBT, Bay 7',
      dropoff: 'Sector 62 Commercial Hub, Noida',
      dist: '5.1 km',
      weight: '3.0 kg'
    },
    {
      id: 3,
      payout: 220,
      pickup: 'Dhaula Kuan Express Bus Stand',
      dropoff: 'Cyber City Building 10, Gurugram',
      dist: '8.4 km',
      weight: '4.5 kg'
    }
  ]);

  const handleAcceptTrip = async (orderId) => {
    try {
      await fetch(`/api/v1/dispatch/orders/${orderId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ACCEPT' })
      });
    } catch (e) {
      console.warn('Dispatch API fallback', e);
    }
    // Navigate to active trip screen
    navigate('/rider-map-trips');
  };

  const handleDeclineTrip = (orderId, reason) => {
    setActiveOffer(null);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
      {/* Duty Status Switch */}
      <DutyToggle
        isOnline={isOnline}
        onToggle={(val) => setIsOnline(val)}
        autoAccept={autoAccept}
        onAutoAcceptToggle={(val) => setAutoAccept(val)}
      />

      {isOnline ? (
        <>
          {/* Priority Incoming Dispatch Offer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Priority Dispatch Offer (Direct Allocation)
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live PostGIS Match
              </span>
            </div>

            <DispatchQueue
              order={activeOffer}
              onAccept={handleAcceptTrip}
              onDecline={handleDeclineTrip}
              autoAccept={autoAccept}
            />
          </div>

          {/* Available Trip Pool Filter */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-sm text-[#191b24]">Nearby Available Pool</h2>
              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                {['all', 'high_payout'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setActiveFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                      activeFilter === f
                        ? 'bg-white text-[#0050cb] shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    {f === 'high_payout' ? '₹150+ High Payout' : 'All'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              {poolOrders.map((pool) => (
                <Card3D
                  key={pool.id}
                  className="p-4 border border-[#ecedfa] flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-emerald-600">
                        ₹{pool.payout}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">{pool.dist} leg</span>
                    </div>
                    <div className="text-xs font-bold text-[#191b24]">{pool.pickup} ➔ {pool.dropoff}</div>
                    <div className="text-[10px] text-slate-400">{pool.weight} package</div>
                  </div>

                  <Button3D
                    variant="primary"
                    size="sm"
                    onClick={() => handleAcceptTrip(pool.id)}
                  >
                    Claim ➔
                  </Button3D>
                </Card3D>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#ecedfa] space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Icon name="bedtime" size="lg" />
          </div>
          <h2 className="font-black text-base text-[#191b24]">You are Currently Offline</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Switch your duty toggle to Online to start receiving high-payout intercity hub dispatches.
          </p>
          <Button3D
            variant="emerald"
            size="md"
            icon="power_settings_new"
            onClick={() => setIsOnline(true)}
          >
            Go Online Now
          </Button3D>
        </div>
      )}
    </div>
  );
};
