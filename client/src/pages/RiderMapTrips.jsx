import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card3D } from '../components/atoms/Card3D';
import { Button3D } from '../components/atoms/Button3D';
import { Badge } from '../components/atoms/Badge';
import { Icon } from '../components/atoms/Icon';
import { OtpPinInput } from '../components/molecules/OtpPinInput';
import { SwipeConfirm } from '../components/molecules/SwipeConfirm';
import { LiveMap } from '../components/organisms/LiveMap';

export const RiderMapTrips = () => {
  const navigate = useNavigate();
  const [pin, setPin] = useState('4820');
  const [verified, setVerified] = useState(false);

  const handleDeliveryComplete = () => {
    setVerified(true);
    setTimeout(() => {
      navigate('/rider-dashboard');
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {/* Navigation Map Viewport */}
      <div className="relative w-full h-[360px] rounded-3xl overflow-hidden shadow-lg border border-slate-200">
        <LiveMap
          center={[30.7333, 76.7794]}
          zoom={14}
          interactive={true}
        />

        {/* Turn Instruction HUD */}
        <div className="absolute top-3 left-3 right-3 z-10 glass-panel p-3.5 rounded-2xl flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0066ff] text-white flex items-center justify-center">
              <Icon name="turn_right" size="sm" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#191b24]">In 250m • Turn Right</div>
              <div className="text-[11px] text-slate-500">Onto Himalaya Marg (Sector 35)</div>
            </div>
          </div>
          <div className="text-right font-mono">
            <div className="text-xs font-black text-[#0050cb]">11 min</div>
            <div className="text-[10px] text-slate-500">3.2 km</div>
          </div>
        </div>
      </div>

      {/* Recipient Details & Contact Bar */}
      <Card3D className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-[#0050cb] font-bold flex items-center justify-center text-sm">
              RV
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-[#191b24]">Rohan Verma</h4>
              <p className="text-[11px] text-slate-500">Sector 35-B, House #142</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:+919810234567"
              className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center hover:bg-emerald-100 transition active:scale-95"
            >
              <Icon name="call" size="sm" />
            </a>
            <button
              type="button"
              className="w-10 h-10 rounded-xl bg-blue-50 text-[#0050cb] border border-blue-200 flex items-center justify-center hover:bg-blue-100 transition active:scale-95"
            >
              <Icon name="chat" size="sm" />
            </button>
          </div>
        </div>

        {/* 4-Digit Verification PIN Entry */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Recipient 4-Digit Handoff PIN:</span>
            <Badge variant="online">Protected</Badge>
          </div>

          <OtpPinInput
            length={4}
            value={pin}
            onChange={setPin}
          />
        </div>

        {/* Slide to Complete Delivery */}
        <div className="pt-2">
          <SwipeConfirm
            label="Swipe to Complete Delivery"
            onConfirm={handleDeliveryComplete}
            successText="✔ ₹14.80 Credited to Wallet"
          />
        </div>
      </Card3D>
    </div>
  );
};
