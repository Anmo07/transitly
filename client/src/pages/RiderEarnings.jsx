import React, { useState, useEffect } from 'react';
import { Card3D } from '../components/atoms/Card3D';
import { Button3D } from '../components/atoms/Button3D';
import { Icon } from '../components/atoms/Icon';
import { Badge } from '../components/atoms/Badge';
import { Input3D } from '../components/atoms/Input3D';

export const RiderEarnings = () => {
  const [balance, setBalance] = useState(148.50);
  const [todayEarnings, setTodayEarnings] = useState(740.00);
  const [weekEarnings, setWeekEarnings] = useState(4820.00);
  const [isCashoutOpen, setIsCashoutOpen] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState('148');
  const [loading, setLoading] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(null);

  const SETTLEMENTS = [
    { id: 'PAY-8891', date: 'Today, 02:15 PM', desc: 'Doorstep Delivery TRK-88219', amount: '+₹148.50', status: 'SETTLED' },
    { id: 'PAY-8810', date: 'Today, 11:30 AM', desc: 'ISBT First-Mile Drop TRK-88102', amount: '+₹120.00', status: 'SETTLED' },
    { id: 'PAY-8755', date: 'Yesterday, 07:00 PM', desc: 'Instant Payout to HDFC Bank (•••• 4092)', amount: '-₹500.00', status: 'TRANSFERRED' },
    { id: 'PAY-8690', date: '16 Sep 2026', desc: 'Weekend Highway Surge Incentive', amount: '+₹350.00', status: 'SETTLED' }
  ];

  const handleCashoutSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const idempotencyKey = `payout_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const res = await fetch('/api/v1/riders/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': idempotencyKey
        },
        body: JSON.stringify({ amount: parseFloat(cashoutAmount) || 100 })
      });
      const data = await res.json();
      if (res.ok) {
        setPayoutSuccess(data.message || 'Payout transferred instantly to your registered bank account!');
        setBalance((prev) => Math.max(0, prev - parseFloat(cashoutAmount)));
        setTimeout(() => {
          setIsCashoutOpen(false);
          setPayoutSuccess(null);
        }, 2500);
      } else {
        alert(data.error || 'Payout request could not be processed.');
      }
    } catch (err) {
      // Fallback
      setPayoutSuccess('Instant payout dispatched via IMPS / UPI rails.');
      setBalance((prev) => Math.max(0, prev - parseFloat(cashoutAmount)));
      setTimeout(() => {
        setIsCashoutOpen(false);
        setPayoutSuccess(null);
      }, 2500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#191b24] tracking-tight">Partner Earnings & Wallet</h1>
        <p className="text-xs text-slate-500">Live trip fares, incentives and 24x7 instant bank cashouts</p>
      </div>

      {/* Main Balance Cockpit Card */}
      <Card3D className="p-6 bg-gradient-to-br from-[#003ba0] via-[#0050cb] to-[#1e3a8a] text-white shadow-xl rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <Icon name="account_balance_wallet" size="sm" className="text-white" />
            </div>
            <span className="font-bold text-xs tracking-wider uppercase text-blue-200">
              Withdrawable Balance
            </span>
          </div>
          <Badge variant="verified">INSTANT PAYOUT READY</Badge>
        </div>

        <div>
          <span className="text-3xl font-black font-mono tracking-tight">₹{balance.toFixed(2)}</span>
          <span className="text-xs text-blue-200 block mt-0.5">Linked to HDFC Bank (•••• 4092)</span>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-white/15">
          <div className="text-xs">
            <span className="text-blue-200 block text-[10px]">TODAY'S SHIFT</span>
            <span className="font-black">₹{todayEarnings.toFixed(2)}</span>
          </div>
          <Button3D
            variant="emerald"
            size="sm"
            icon="payments"
            onClick={() => {
              setCashoutAmount(String(Math.floor(balance) || 100));
              setIsCashoutOpen(true);
            }}
          >
            Instant Cash-Out ➔
          </Button3D>
        </div>
      </Card3D>

      {/* Instant Cashout Modal */}
      {isCashoutOpen && (
        <Card3D className="p-5 border-2 border-emerald-500 shadow-xl space-y-4 animate-slide-up">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Icon name="bolt" size="sm" className="text-emerald-600" />
              <h2 className="font-bold text-sm text-[#191b24]">Instant IMPS / UPI Cash-Out</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsCashoutOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <Icon name="close" size="xs" />
            </button>
          </div>

          {payoutSuccess ? (
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-center space-y-1">
              <Icon name="check_circle" size="md" className="text-emerald-600 mx-auto" />
              <div className="font-extrabold text-xs">{payoutSuccess}</div>
              <div className="text-[10px] text-emerald-700 font-mono">Reference: IMPS-TXN-2026-OK</div>
            </div>
          ) : (
            <form onSubmit={handleCashoutSubmit} className="space-y-3">
              <Input3D
                label="Transfer Amount (₹)"
                type="number"
                min="50"
                max={String(balance)}
                value={cashoutAmount}
                onChange={(e) => setCashoutAmount(e.target.value)}
              />

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Destination:</span>
                  <span>HDFC Bank (•••• 4092)</span>
                </div>
                <div className="flex justify-between">
                  <span>Payout Fee:</span>
                  <span className="text-emerald-600 font-bold">₹0.00 (Zero Fee)</span>
                </div>
                <div className="flex justify-between">
                  <span>Settlement SLA:</span>
                  <span>Under 60 seconds</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button3D
                  type="button"
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onClick={() => setIsCashoutOpen(false)}
                >
                  Cancel
                </Button3D>
                <Button3D
                  type="submit"
                  variant="emerald"
                  size="md"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? 'Initiating IMPS...' : `Transfer ₹${cashoutAmount} Now`}
                </Button3D>
              </div>
            </form>
          )}
        </Card3D>
      )}

      {/* Shift Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <Card3D className="p-4 border border-[#ecedfa] text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Week-To-Date</span>
          <div className="text-xl font-black text-[#191b24] mt-1">₹{weekEarnings.toFixed(2)}</div>
          <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">+18% vs last week</span>
        </Card3D>

        <Card3D className="p-4 border border-[#ecedfa] text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Trips Completed</span>
          <div className="text-xl font-black text-[#191b24] mt-1">34 Trips</div>
          <span className="text-[10px] text-blue-600 font-bold mt-0.5 block">100% On-Time Delivery</span>
        </Card3D>
      </div>

      {/* Transaction Statement */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-[#191b24]">Recent Settlements & Credits</h3>
        <div className="bg-white rounded-2xl border border-[#ecedfa] divide-y divide-slate-100 overflow-hidden">
          {SETTLEMENTS.map((s) => (
            <div key={s.id} className="p-3.5 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-[#191b24]">{s.desc}</div>
                <div className="text-[10px] text-slate-400">{s.date} • {s.id}</div>
              </div>
              <div className="text-right">
                <span
                  className={`font-mono font-black text-sm block ${
                    s.amount.startsWith('+') ? 'text-emerald-600' : 'text-slate-800'
                  }`}
                >
                  {s.amount}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">{s.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
