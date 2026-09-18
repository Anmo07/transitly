import React, { useState } from 'react';
import { Card3D } from '../components/atoms/Card3D';
import { Button3D } from '../components/atoms/Button3D';
import { Icon } from '../components/atoms/Icon';
import { Input3D } from '../components/atoms/Input3D';
import { useNavigate } from 'react-router-dom';

export const HelpSupport = () => {
  const navigate = useNavigate();
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketSent, setTicketSent] = useState(false);

  const CATEGORIES = [
    { title: 'Track Highway Delay', desc: 'Real-time bus telematics update', icon: 'speed' },
    { title: 'Damage or Loss Claim', desc: 'Transitly Shield insurance payout', icon: 'security' },
    { title: 'Wallet & Refund Help', desc: 'Dispute a transaction or charge', icon: 'account_balance_wallet' },
    { title: 'Driver or Hub Issue', desc: 'Report handoff or depot concern', icon: 'support_agent' }
  ];

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    if (!ticketSubject || !ticketDesc) return;
    setTicketSent(true);
  };

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
          <h1 className="text-xl font-black text-[#191b24]">Help & 24x7 Support</h1>
          <p className="text-xs text-slate-500">Dedicated assistance for highway intercity cargo</p>
        </div>
      </div>

      {/* 24x7 Helpline Card */}
      <Card3D className="p-5 bg-gradient-to-r from-blue-900 to-[#0050cb] text-white shadow-lg flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-[10px] font-black uppercase tracking-wider text-blue-200">
            TOLL-FREE EMERGENCY DESK
          </div>
          <div className="text-lg font-black tracking-tight">1800-TRANSIT-24</div>
          <p className="text-xs text-blue-100">Live corridor dispatch controllers available 24/7</p>
        </div>
        <a
          href="tel:18008726748"
          className="w-11 h-11 rounded-2xl bg-white text-[#0050cb] flex items-center justify-center shadow-md hover:bg-blue-50 transition"
        >
          <Icon name="call" size="md" />
        </a>
      </Card3D>

      {/* Quick Help Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CATEGORIES.map((cat, idx) => (
          <Card3D
            key={idx}
            className="p-4 border border-[#ecedfa] hover:border-blue-300 transition cursor-pointer"
            onClick={() => setTicketSubject(cat.title)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0050cb] flex items-center justify-center">
                <Icon name={cat.icon} size="md" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#191b24]">{cat.title}</div>
                <div className="text-[11px] text-slate-400">{cat.desc}</div>
              </div>
            </div>
          </Card3D>
        ))}
      </div>

      {/* Raise a Support Ticket */}
      <Card3D className="p-5 border border-[#ecedfa] shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Icon name="edit_note" size="sm" className="text-[#0050cb]" />
          <h2 className="font-bold text-sm text-[#191b24]">Raise an Escalation Ticket</h2>
        </div>

        {ticketSent ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Icon name="check_circle" size="lg" />
            </div>
            <div className="font-extrabold text-sm text-[#191b24]">Ticket #TKT-4890 Created</div>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Our corridor support officer has received your query and will update you via SMS within 15 minutes.
            </p>
            <Button3D
              variant="secondary"
              size="sm"
              onClick={() => {
                setTicketSent(false);
                setTicketSubject('');
                setTicketDesc('');
              }}
            >
              Submit Another Query
            </Button3D>
          </div>
        ) : (
          <form onSubmit={handleTicketSubmit} className="space-y-3">
            <Input3D
              label="Issue Subject or Tracking ID"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              placeholder="e.g. TRK-88219 delay inquiry"
            />
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Describe the problem
              </label>
              <textarea
                rows="3"
                value={ticketDesc}
                onChange={(e) => setTicketDesc(e.target.value)}
                placeholder="Provide details about the consignment, bus bay, or timing issue..."
                className="w-full p-3 bg-[#f6f8fc] border border-[#ecedfa] rounded-xl text-xs text-[#191b24] outline-none focus:border-[#0050cb]"
              />
            </div>
            <Button3D variant="primary" size="full" type="submit">
              Submit Ticket to Dispatch Center
            </Button3D>
          </form>
        )}
      </Card3D>
    </div>
  );
};
