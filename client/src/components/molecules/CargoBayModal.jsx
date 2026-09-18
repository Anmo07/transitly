import React from 'react';
import { Icon } from '../atoms/Icon';
import { Button3D } from '../atoms/Button3D';
import { Card3D } from '../atoms/Card3D';

export const CargoBayModal = ({ isOpen, onClose, busPlate = 'HR-68-A-1001', bayId = 'BAY-3B', sealCode = 'TRK-SEAL-88219-ENC' }) => {
  if (!isOpen) return null;

  const BAYS = [
    { id: 'BAY-1A', type: 'Refrigerated/Fragile', status: 'LOCKED', parcels: 3, isAssigned: false },
    { id: 'BAY-1B', type: 'General Cargo', status: 'LOCKED', parcels: 8, isAssigned: false },
    { id: 'BAY-2A', type: 'Heavy Sacks', status: 'LOCKED', parcels: 4, isAssigned: false },
    { id: 'BAY-2B', type: 'General Cargo', status: 'LOCKED', parcels: 6, isAssigned: false },
    { id: 'BAY-3A', type: 'Express Pouches', status: 'LOCKED', parcels: 12, isAssigned: false },
    { id: 'BAY-3B', type: 'High Priority Sealed', status: 'ACTIVE', parcels: 1, isAssigned: true }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#ecedfa] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-900 via-[#0050cb] to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
              <Icon name="view_in_ar" size="md" className="text-white" />
            </div>
            <div>
              <div className="font-extrabold text-sm">3D Cargo Undercarriage Stowage</div>
              <div className="text-[11px] text-blue-200">Bus Carrier: {busPlate}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
          >
            <Icon name="close" size="sm" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Visual Bus Schematic */}
          <div className="bg-slate-900 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pb-2 border-b border-slate-800">
              <span>CABIN COCKPIT (FRONT)</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                TAMPER TELEMETRY ARMED
              </span>
            </div>

            {/* Grid of Cargo Compartments */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {BAYS.map((bay) => (
                <div
                  key={bay.id}
                  className={`p-3 rounded-xl border transition-all ${
                    bay.isAssigned
                      ? 'bg-blue-600/30 border-blue-400 ring-2 ring-blue-400/50'
                      : 'bg-slate-800/60 border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold">{bay.id}</span>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                        bay.isAssigned
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {bay.isAssigned ? 'YOUR PARCEL' : bay.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">{bay.type}</div>
                  <div className="text-[10px] text-slate-300 mt-1 flex items-center gap-1">
                    <Icon name="lock" size="xs" />
                    <span>Cryptographic Seal Verified</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cryptographic Seal Breakdown */}
          <Card3D className="bg-blue-50/50 border-blue-200 p-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0050cb] flex items-center justify-center shrink-0">
                <Icon name="qr_code_2" size="md" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-[#191b24]">Digital Tamper Seal Hash</div>
                <div className="text-[10px] font-mono text-slate-600 break-all bg-white px-2 py-1 rounded-lg mt-1 border border-blue-100">
                  {sealCode}
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                  <Icon name="verified" size="xs" />
                  <span>Verified at ISBT Gate 4 • Zero Compartment Breach Reported</span>
                </div>
              </div>
            </div>
          </Card3D>

          {/* Actions */}
          <div className="pt-1 flex gap-2">
            <Button3D variant="primary" size="full" onClick={onClose}>
              Dismiss Cargo Bay View
            </Button3D>
          </div>
        </div>
      </div>
    </div>
  );
};
