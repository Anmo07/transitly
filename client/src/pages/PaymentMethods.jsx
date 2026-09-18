import React, { useState } from 'react';
import { Card3D } from '../components/atoms/Card3D';
import { Button3D } from '../components/atoms/Button3D';
import { Icon } from '../components/atoms/Icon';
import { Input3D } from '../components/atoms/Input3D';
import { useNavigate } from 'react-router-dom';

export const PaymentMethods = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(450.00);
  const [isRecharging, setIsRecharging] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('500');

  const TRANSACTIONS = [
    { id: 'TXN-9982', desc: 'Consignment TRK-88219 (Delhi ➔ Chd)', type: 'DEBIT', amount: '₹148.00', date: 'Today, 11:30 AM' },
    { id: 'TXN-9941', desc: 'UPI Auto Top-up (Axis Bank)', type: 'CREDIT', amount: '₹500.00', date: 'Yesterday, 06:10 PM' },
    { id: 'TXN-9812', desc: 'Consignment TRK-77102 (Pune ➔ Mum)', type: 'DEBIT', amount: '₹85.00', date: '16 Sep 2026' }
  ];

  const handleTopup = (e) => {
    e.preventDefault();
    const add = parseFloat(rechargeAmount) || 0;
    if (add > 0) {
      setBalance((prev) => prev + add);
      setIsRecharging(false);
    }
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
          <h1 className="text-xl font-black text-[#191b24]">Payment & Wallet</h1>
          <p className="text-xs text-slate-500">Fast 1-click checkout for intercity parcel dispatch</p>
        </div>
      </div>

      {/* Transitly Wallet 3D Card */}
      <Card3D className="p-6 bg-gradient-to-tr from-[#003ba0] via-[#0050cb] to-[#3a86ff] text-white shadow-xl rounded-3xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-sm">
                T
              </span>
              <span className="font-bold text-sm tracking-wide">Transitly Pay</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400 text-slate-900">
              ACTIVE WALLET
            </span>
          </div>

          <div>
            <span className="text-xs text-blue-200 block">Available Balance</span>
            <div className="text-3xl font-black tracking-tight">₹{balance.toFixed(2)}</div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-blue-100 font-mono">Linked UPI: anmol@okaxis</span>
            <Button3D
              variant="emerald"
              size="sm"
              icon="add"
              onClick={() => setIsRecharging(true)}
            >
              Add Money
            </Button3D>
          </div>
        </div>
      </Card3D>

      {/* Recharge Modal */}
      {isRecharging && (
        <Card3D className="p-5 border-2 border-[#0050cb] shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="font-bold text-sm text-[#191b24]">Top-up Transitly Wallet</h2>
            <button
              type="button"
              onClick={() => setIsRecharging(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <Icon name="close" size="xs" />
            </button>
          </div>

          <div className="flex gap-2">
            {['200', '500', '1000', '2000'].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setRechargeAmount(amt)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                  rechargeAmount === amt
                    ? 'bg-[#0050cb] border-[#0050cb] text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                +₹{amt}
              </button>
            ))}
          </div>

          <Input3D
            label="Amount (₹)"
            type="number"
            value={rechargeAmount}
            onChange={(e) => setRechargeAmount(e.target.value)}
          />

          <div className="flex gap-2">
            <Button3D
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => setIsRecharging(false)}
            >
              Cancel
            </Button3D>
            <Button3D
              variant="primary"
              size="md"
              className="flex-1"
              onClick={handleTopup}
            >
              Proceed to Pay ₹{rechargeAmount}
            </Button3D>
          </div>
        </Card3D>
      )}

      {/* Saved UPI & Cards */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-[#191b24]">Saved Payment Methods</h3>

        <Card3D className="p-4 border border-[#ecedfa] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs">
              UPI
            </div>
            <div>
              <div className="text-xs font-bold text-[#191b24]">Google Pay UPI</div>
              <div className="text-[11px] text-slate-400 font-mono">anmol@okhdfcbank</div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400">DEFAULT</span>
        </Card3D>

        <Card3D className="p-4 border border-[#ecedfa] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0050cb] flex items-center justify-center font-black text-xs">
              CARD
            </div>
            <div>
              <div className="text-xs font-bold text-[#191b24]">HDFC Bank Regalia (Visa)</div>
              <div className="text-[11px] text-slate-400 font-mono">•••• •••• •••• 4092</div>
            </div>
          </div>
          <Icon name="chevron_right" size="xs" className="text-slate-300" />
        </Card3D>
      </div>

      {/* Transaction History Ledger */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-[#191b24]">Recent Wallet Ledger</h3>
        <div className="bg-white rounded-2xl border border-[#ecedfa] divide-y divide-slate-100 overflow-hidden">
          {TRANSACTIONS.map((txn) => (
            <div key={txn.id} className="p-3.5 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-[#191b24]">{txn.desc}</div>
                <div className="text-[10px] text-slate-400">{txn.date} • {txn.id}</div>
              </div>
              <span
                className={`font-black font-mono text-sm ${
                  txn.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-800'
                }`}
              >
                {txn.type === 'CREDIT' ? `+${txn.amount}` : `-${txn.amount}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
