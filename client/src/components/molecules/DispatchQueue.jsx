import React, { useState, useEffect } from 'react';
import { Card3D } from '../atoms/Card3D';
import { Button3D } from '../atoms/Button3D';
import { Icon } from '../atoms/Icon';
import { Badge } from '../atoms/Badge';

export const DispatchQueue = ({ order, onAccept, onDecline, autoAccept = false }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!order || accepted) return;
    setTimeLeft(30);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onDecline) onDecline(order.id, 'TIMEOUT');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [order?.id, accepted]);

  if (!order) {
    return (
      <div className="bg-white rounded-3xl border border-[#ecedfa] p-8 text-center shadow-sm">
        <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 text-[#0050cb] flex items-center justify-center mb-3">
          <Icon name="radar" size="lg" className="animate-spin" />
        </div>
        <div className="font-bold text-base text-[#191b24]">Scanning Nearby Radius (5 km)</div>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          High demand zone active in Central Corridor. Incoming pickup dispatches will appear here automatically.
        </p>
      </div>
    );
  }

  const handleAcceptClick = async () => {
    setAccepted(true);
    if (onAccept) await onAccept(order.id);
  };

  const handleDeclineClick = () => {
    if (onDecline) onDecline(order.id, 'DECLINED_BY_RIDER');
  };

  const progressPercent = (timeLeft / 30) * 100;

  return (
    <Card3D className="border-2 border-[#0050cb] shadow-xl overflow-hidden animate-slide-up">
      {/* TTL Progress bar */}
      <div className="h-1.5 bg-slate-100 w-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            timeLeft > 10 ? 'bg-[#0050cb]' : 'bg-red-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="p-4 space-y-4">
        {/* Header with Payout & Timer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-emerald-600">₹{order.payout || 148}</span>
            <Badge variant="surge">1.2x SURGE</Badge>
          </div>
          <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-xs font-black">
            <Icon name="timer" size="xs" />
            <span>{timeLeft}s remaining</span>
          </div>
        </div>

        {/* Route Points */}
        <div className="space-y-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0050cb] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              A
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Pickup • {order.pickupDistance || '1.2 km away'}</div>
              <div className="text-xs font-bold text-[#191b24]">{order.pickupLocation || 'ISBT Kashmiri Gate, Delhi - Bay 3'}</div>
            </div>
          </div>

          <div className="border-l-2 border-dashed border-slate-300 ml-3 h-3" />

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              B
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Dropoff • {order.dropoffDistance || '4.8 km leg'}</div>
              <div className="text-xs font-bold text-[#191b24]">{order.dropoffLocation || 'Sector 18 Doorstep Hub, Noida'}</div>
            </div>
          </div>
        </div>

        {/* Cargo Specs */}
        <div className="flex items-center justify-between text-xs text-slate-600 px-1">
          <span className="flex items-center gap-1 font-semibold">
            <Icon name="package_2" size="xs" />
            <span>{order.packageType || 'Electronic Goods (Medium Pouch)'}</span>
          </span>
          <span className="font-bold text-slate-700">{order.weight || '2.4 kg'}</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button3D
            variant="secondary"
            size="md"
            onClick={handleDeclineClick}
            disabled={accepted}
          >
            Decline
          </Button3D>
          <Button3D
            variant="emerald"
            size="md"
            onClick={handleAcceptClick}
            disabled={accepted}
          >
            {accepted ? 'Accepting...' : 'Accept Task ➔'}
          </Button3D>
        </div>
      </div>
    </Card3D>
  );
};
