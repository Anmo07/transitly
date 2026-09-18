import React, { useState } from 'react';
import { Card3D } from '../components/atoms/Card3D';
import { Button3D } from '../components/atoms/Button3D';
import { Icon } from '../components/atoms/Icon';
import { useNavigate } from 'react-router-dom';

export const Settings = () => {
  const navigate = useNavigate();
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [twoFactor, setTwoFactor] = useState(true);
  const [language, setLanguage] = useState('en');

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100"
        >
          <Icon name="arrow_back" size="sm" />
        </button>
        <div>
          <h1 className="text-xl font-black text-[#191b24]">Settings & Preferences</h1>
          <p className="text-xs text-slate-500">Security, telemetry notifications and language</p>
        </div>
      </div>

      {/* Notifications Group */}
      <div className="space-y-3">
        <h2 className="font-extrabold text-sm text-[#191b24]">Telemetry & Alerts</h2>
        <Card3D className="p-4 border border-[#ecedfa] divide-y divide-slate-100">
          <div className="py-2.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#191b24]">WhatsApp Corridor Alerts</div>
              <div className="text-[11px] text-slate-400">Live bus departure, highway checkpoint & PIN alerts</div>
            </div>
            <input
              type="checkbox"
              checked={whatsappAlerts}
              onChange={(e) => setWhatsappAlerts(e.target.checked)}
              className="w-4 h-4 text-[#0050cb] rounded focus:ring-[#0050cb]"
            />
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#191b24]">SMS Backup Notifications</div>
              <div className="text-[11px] text-slate-400">Critical delivery handoff OTP and arrival codes</div>
            </div>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="w-4 h-4 text-[#0050cb] rounded focus:ring-[#0050cb]"
            />
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#191b24]">In-App Push Telematics</div>
              <div className="text-[11px] text-slate-400">Live speed and distance count-downs</div>
            </div>
            <input
              type="checkbox"
              checked={pushAlerts}
              onChange={(e) => setPushAlerts(e.target.checked)}
              className="w-4 h-4 text-[#0050cb] rounded focus:ring-[#0050cb]"
            />
          </div>
        </Card3D>
      </div>

      {/* Security Group */}
      <div className="space-y-3">
        <h2 className="font-extrabold text-sm text-[#191b24]">Account Security & DPDP</h2>
        <Card3D className="p-4 border border-[#ecedfa] divide-y divide-slate-100">
          <div className="py-2.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#191b24]">Two-Factor Authentication (2FA)</div>
              <div className="text-[11px] text-slate-400">Require 6-digit OTP for every new session</div>
            </div>
            <input
              type="checkbox"
              checked={twoFactor}
              onChange={(e) => setTwoFactor(e.target.checked)}
              className="w-4 h-4 text-[#0050cb] rounded focus:ring-[#0050cb]"
            />
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#191b24]">App Language</div>
              <div className="text-[11px] text-slate-400">Choose preferred interface language</div>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-xs font-bold bg-[#f6f8fc] border border-slate-200 rounded-lg px-2 py-1 outline-none"
            >
              <option value="en">English (India)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>
        </Card3D>
      </div>

      {/* DPDP Compliance Notice */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-500 space-y-1">
        <div className="font-bold text-slate-700">DPDP Act (2023) Data Rights</div>
        <p>
          You have the right to request a complete archive of your intercity consignments and telemetry traces, or request irreversible account erasure.
        </p>
        <button
          type="button"
          onClick={() => alert('Data export initiated. An encrypted link will be sent to your registered email.')}
          className="text-[#0050cb] font-bold hover:underline block pt-1"
        >
          Request Encrypted Data Archive ➔
        </button>
      </div>
    </div>
  );
};
