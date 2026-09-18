import React, { useState } from 'react';
import { Card3D } from '../components/atoms/Card3D';
import { Button3D } from '../components/atoms/Button3D';
import { Icon } from '../components/atoms/Icon';
import { Badge } from '../components/atoms/Badge';
import { Input3D } from '../components/atoms/Input3D';
import { useNavigate } from 'react-router-dom';

export const Services = () => {
  const navigate = useNavigate();
  const [selectedCorridor, setSelectedCorridor] = useState('delhi-chandigarh');
  const [weightKg, setWeightKg] = useState('2');
  const [selectedTier, setSelectedTier] = useState('express-bus');
  const [includeInsurance, setIncludeInsurance] = useState(true);

  const CORRIDORS = [
    { id: 'delhi-chandigarh', name: 'Delhi ⇄ Chandigarh', dist: 250, transitTime: '4.5 hrs', baseFare: 60 },
    { id: 'delhi-jaipur', name: 'Delhi ⇄ Jaipur', dist: 280, transitTime: '5.0 hrs', baseFare: 75 },
    { id: 'mumbai-pune', name: 'Mumbai ⇄ Pune', dist: 150, transitTime: '3.2 hrs', baseFare: 55 },
    { id: 'bangalore-chennai', name: 'Bengaluru ⇄ Chennai', dist: 350, transitTime: '6.0 hrs', baseFare: 90 }
  ];

  const TIERS = [
    {
      id: 'express-bus',
      title: 'Scheduled Bus Cargo',
      badge: 'POPULAR & GREEN',
      speed: 'Under 5 Hours',
      desc: 'Unused luggage bay space on government and luxury Volvo buses. Zero extra carbon footprint.',
      baseMultiplier: 1.0,
      icon: 'directions_bus'
    },
    {
      id: 'electric-van',
      title: 'Dedicated Electric Van',
      badge: 'DOORSTEP DIRECT',
      speed: 'Within 3.5 Hours',
      desc: 'High-priority direct highway transport for fragile or bulky commercial items up to 100 kg.',
      baseMultiplier: 1.8,
      icon: 'electric_car'
    },
    {
      id: 'cold-chain',
      title: 'Active Cold-Chain Hub',
      badge: 'PHARMA & FOOD',
      speed: 'Continuous 4°C Telemetry',
      desc: 'Insulated cryogenic pods with real-time BLE temperature tracking for medicines and perishable cargo.',
      baseMultiplier: 2.5,
      icon: 'ac_unit'
    }
  ];

  const currentCorridor = CORRIDORS.find((c) => c.id === selectedCorridor) || CORRIDORS[0];
  const currentTier = TIERS.find((t) => t.id === selectedTier) || TIERS[0];

  const calculatedBase = Math.round(currentCorridor.baseFare * currentTier.baseMultiplier);
  const weightCharge = Math.max(0, (Number(weightKg) || 1) - 1) * 20;
  const insuranceCharge = includeInsurance ? 10 : 0;
  const gst = Math.round((calculatedBase + weightCharge + insuranceCharge) * 0.18);
  const totalAmount = calculatedBase + weightCharge + insuranceCharge + gst;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Header */}
      <div className="text-center space-y-2 py-4">
        <Badge variant="verified">INTERCITY SPEED MATRIX</Badge>
        <h1 className="text-2xl sm:text-3xl font-black text-[#191b24] tracking-tight">
          Express Cargo Services & Rate Estimator
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Send packages across state borders in under 6 hours using scheduled intercity transit buses from ₹60.
        </p>
      </div>

      {/* Service Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIERS.map((tier) => {
          const isSelected = selectedTier === tier.id;
          return (
            <div
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className="cursor-pointer"
            >
              <Card3D
                className={`p-5 h-full flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'border-2 border-[#0050cb] ring-4 ring-blue-50 shadow-lg'
                    : 'border border-[#ecedfa] hover:border-blue-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                        isSelected ? 'bg-[#0050cb] text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Icon name={tier.icon} size="md" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-[#0050cb]">
                      {tier.badge}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-[#191b24]">{tier.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tier.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                    <Icon name="bolt" size="xs" />
                    <span>{tier.speed}</span>
                  </div>
                  <div className="text-xs font-black text-[#0050cb]">
                    {isSelected ? '✓ SELECTED' : 'CHOOSE'}
                  </div>
                </div>
              </Card3D>
            </div>
          );
        })}
      </div>

      {/* Interactive Rate Calculator */}
      <Card3D className="p-6 bg-white border border-[#ecedfa] shadow-md space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0050cb] flex items-center justify-center">
              <Icon name="calculate" size="sm" />
            </div>
            <h2 className="font-black text-sm text-[#191b24]">Instant Corridor Rate Estimator</h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">Live PostGIS Distance Matrix</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Select Intercity Corridor
            </label>
            <select
              value={selectedCorridor}
              onChange={(e) => setSelectedCorridor(e.target.value)}
              className="w-full h-12 px-3 bg-[#f6f8fc] border border-[#ecedfa] rounded-xl text-sm font-semibold text-[#191b24] outline-none focus:border-[#0050cb]"
            >
              {CORRIDORS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.dist} km • {c.transitTime})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Parcel Weight (Kilograms)
            </label>
            <input
              type="number"
              min="0.5"
              max="100"
              step="0.5"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full h-12 px-3 bg-[#f6f8fc] border border-[#ecedfa] rounded-xl text-sm font-semibold text-[#191b24] outline-none focus:border-[#0050cb]"
            />
          </div>
        </div>

        {/* Insurance Checkbox */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-100">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeInsurance}
              onChange={(e) => setIncludeInsurance(e.target.checked)}
              className="w-4 h-4 rounded text-[#0050cb] focus:ring-[#0050cb]"
            />
            <span className="text-xs font-bold text-[#191b24]">
              Transitly Protection Shield (Coverage up to ₹15,000)
            </span>
          </label>
          <span className="text-xs font-black text-[#0050cb]">+₹10</span>
        </div>

        {/* Fare Summary Breakdown */}
        <div className="bg-[#f6f8fc] p-4 rounded-2xl space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Base Transit Fare ({currentTier.title})</span>
            <span className="font-semibold">₹{calculatedBase}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Weight Surcharge ({weightKg} kg)</span>
            <span className="font-semibold">₹{weightCharge}</span>
          </div>
          {includeInsurance && (
            <div className="flex justify-between text-slate-600">
              <span>Transit Insurance Protection</span>
              <span className="font-semibold">₹10</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>GST (18%)</span>
            <span className="font-semibold">₹{gst}</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-[#191b24]">
            <span>Estimated Total</span>
            <span className="text-xl text-[#0050cb]">₹{totalAmount}</span>
          </div>
        </div>

        {/* Book Now Button */}
        <Button3D
          variant="primary"
          size="full"
          icon="local_shipping"
          onClick={() => navigate('/?book=true')}
        >
          Book Parcel on this Corridor ➔
        </Button3D>
      </Card3D>
    </div>
  );
};
