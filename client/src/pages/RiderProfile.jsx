import React, { useState } from 'react';
import { Card3D } from '../components/atoms/Card3D';
import { Button3D } from '../components/atoms/Button3D';
import { Icon } from '../components/atoms/Icon';
import { Badge } from '../components/atoms/Badge';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const RiderProfile = () => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const [sosTriggered, setSosTriggered] = useState(false);

  const DOCUMENTS = [
    { title: 'Commercial / Two-Wheeler DL', status: 'VERIFIED', expiry: 'Exp: 2032' },
    { title: 'Vehicle RC (DL-01-AB-1234)', status: 'VERIFIED', expiry: 'Fitness Valid' },
    { title: 'Aadhaar Biometric KYC', status: 'VERIFIED', expiry: 'UIDAI Linked' },
    { title: 'State Police Background Check', status: 'CLEARED', expiry: 'Annual Clearance' }
  ];

  const handleSos = () => {
    setSosTriggered(true);
    setTimeout(() => {
      alert('EMERGENCY SOS: GPS coordinates and bus terminal dispatch alerted. Highway patrol notified.');
      setSosTriggered(false);
    }, 500);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
      {/* Rider Header Card */}
      <Card3D className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl rounded-3xl space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-[#0050cb] text-white flex items-center justify-center font-black text-2xl shadow-lg border-2 border-blue-400">
            {user?.name?.[0]?.toUpperCase() || 'R'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg">{user?.name || 'Rajesh Kumar'}</h1>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-900">
                GOLD CARRIER
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span className="text-amber-400 font-bold">★ 4.92 Rating</span>
              <span>•</span>
              <span>342 Trips Completed</span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Bajaj Pulsar 150 • DL-01-AB-1234</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-700/60 text-center">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Acceptance</span>
            <span className="font-bold text-sm text-emerald-400">96.4%</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">On-Time SLA</span>
            <span className="font-bold text-sm text-blue-400">99.1%</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Cancellation</span>
            <span className="font-bold text-sm text-slate-300">0.8%</span>
          </div>
        </div>
      </Card3D>

      {/* Emergency SOS Button */}
      <div className="p-4 bg-red-50 border border-red-200 rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center">
            <Icon name="sos" size="md" />
          </div>
          <div>
            <div className="font-bold text-xs text-red-900">Emergency Highway SOS</div>
            <div className="text-[11px] text-red-700">Broadcast live GPS to Transitly Patrol</div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSos}
          disabled={sosTriggered}
          className="px-4 py-2 rounded-xl bg-red-600 text-white font-extrabold text-xs shadow-md hover:bg-red-700 transition"
        >
          {sosTriggered ? 'Broadcasting...' : 'TRIGGER SOS'}
        </button>
      </div>

      {/* KYC & Verified Compliance Documents */}
      <div className="space-y-3">
        <h2 className="font-extrabold text-sm text-[#191b24]">Compliance & Verification</h2>
        <Card3D className="p-4 border border-[#ecedfa] divide-y divide-slate-100">
          {DOCUMENTS.map((doc, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-[#191b24]">{doc.title}</div>
                <div className="text-[10px] text-slate-400">{doc.expiry}</div>
              </div>
              <Badge variant="verified">{doc.status}</Badge>
            </div>
          ))}
        </Card3D>
      </div>

      {/* Payout Bank Account */}
      <div className="space-y-3">
        <h2 className="font-extrabold text-sm text-[#191b24]">Payout Bank Account</h2>
        <Card3D className="p-4 border border-[#ecedfa] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0050cb] flex items-center justify-center">
              <Icon name="account_balance" size="md" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#191b24]">HDFC Bank Ltd</div>
              <div className="text-[11px] text-slate-400 font-mono">A/C: ••••••••4092 • IFSC: HDFC0000123</div>
            </div>
          </div>
          <Badge variant="verified">PRIMARY</Badge>
        </Card3D>
      </div>

      {/* Switch to Customer Mode */}
      <div className="pt-2 flex flex-col gap-2">
        <Button3D
          variant="secondary"
          size="full"
          icon="switch_account"
          onClick={() => {
            switchRole('CUSTOMER');
            navigate('/');
          }}
        >
          Switch to Customer Mode ➔
        </Button3D>

        <Button3D
          variant="secondary"
          size="full"
          icon="logout"
          onClick={logout}
          className="text-red-600 hover:bg-red-50 hover:border-red-200"
        >
          Sign Out of Partner Account
        </Button3D>
      </div>
    </div>
  );
};
