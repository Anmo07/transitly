import React from 'react';
import { Card3D } from '../components/atoms/Card3D';
import { Button3D } from '../components/atoms/Button3D';
import { Icon } from '../components/atoms/Icon';
import { Badge } from '../components/atoms/Badge';
import { useNavigate } from 'react-router-dom';

export const DeliveryPartnerLanding = () => {
  const navigate = useNavigate();

  const PERKS = [
    {
      title: 'Fixed Intercity Hub Runs',
      desc: 'No random dropoffs in narrow alleys. Drive directly between ISBT bus terminals and designated commercial drop bays.',
      icon: 'sync_alt'
    },
    {
      title: 'Instant Bank Payouts',
      desc: 'Cash out your trip earnings 24x7 directly to your UPI ID or bank account via our Neon instant settlement gateway.',
      icon: 'account_balance_wallet'
    },
    {
      title: 'Zero Passenger Hassle',
      desc: 'Deliver parcels and pouches only. No passenger disputes, no luggage arguing, pure high-margin freight legs.',
      icon: 'package_2'
    },
    {
      title: 'Surge Multipliers on Highways',
      desc: 'Earn up to 1.8x base fare during peak morning and evening express bus dispatch windows.',
      icon: 'trending_up'
    }
  ];

  const VEHICLES = [
    { type: 'Motorcycle / Scooter', capacity: 'Up to 20 kg', payout: '₹25,000 - ₹32,000 / mo', icon: 'two_wheeler' },
    { type: 'Electric 3-Wheeler', capacity: 'Up to 150 kg', payout: '₹35,000 - ₹45,000 / mo', icon: 'electric_rickshaw' },
    { type: 'Mini Van / Light Cargo', capacity: 'Up to 500 kg', payout: '₹55,000 - ₹75,000 / mo', icon: 'local_shipping' }
  ];

  return (
    <div className="space-y-8 animate-fade-in py-4">
      {/* Hero */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <Badge variant="surge">EARN UP TO ₹45,000/MONTH</Badge>
        <h1 className="text-3xl sm:text-4xl font-black text-[#191b24] tracking-tight">
          Deliver Intercity Bus Cargo. Own Your Schedule.
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Connect local businesses with scheduled state transport buses. Earn steady income moving parcels from doorsteps to ISBT hubs.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Button3D
            variant="primary"
            size="lg"
            icon="two_wheeler"
            onClick={() => navigate('/signup?role=DELIVERY_PARTNER')}
          >
            Apply as Delivery Partner ➔
          </Button3D>
          <Button3D
            variant="secondary"
            size="lg"
            icon="login"
            onClick={() => navigate('/login')}
          >
            Partner Login
          </Button3D>
        </div>
      </div>

      {/* Perks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PERKS.map((perk, idx) => (
          <Card3D key={idx} className="p-5 border border-[#ecedfa]">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0050cb] flex items-center justify-center mb-3">
              <Icon name={perk.icon} size="md" />
            </div>
            <h3 className="font-extrabold text-base text-[#191b24]">{perk.title}</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{perk.desc}</p>
          </Card3D>
        ))}
      </div>

      {/* Vehicle Tier Earnings */}
      <div className="space-y-3">
        <h2 className="text-center font-black text-xl text-[#191b24]">Choose Your Vehicle Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {VEHICLES.map((v, idx) => (
            <Card3D key={idx} className="p-5 border border-[#ecedfa] text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Icon name={v.icon} size="lg" />
              </div>
              <div>
                <h4 className="font-black text-sm text-[#191b24]">{v.type}</h4>
                <div className="text-xs text-slate-400 mt-0.5">{v.capacity}</div>
              </div>
              <div className="bg-emerald-50 text-emerald-700 font-extrabold text-xs py-2 px-3 rounded-xl">
                {v.payout}
              </div>
            </Card3D>
          ))}
        </div>
      </div>

      {/* 3-Step Onboarding */}
      <Card3D className="p-6 bg-[#0050cb] text-white shadow-xl rounded-3xl space-y-4">
        <h3 className="font-black text-lg text-center">Start Earning in 3 Simple Steps</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="w-8 h-8 mx-auto rounded-full bg-white/20 flex items-center justify-center font-black text-xs">
              1
            </div>
            <div className="font-bold text-sm">Register Online</div>
            <div className="text-xs text-blue-200">Submit Aadhaar, Driving License & RC</div>
          </div>
          <div className="space-y-1">
            <div className="w-8 h-8 mx-auto rounded-full bg-white/20 flex items-center justify-center font-black text-xs">
              2
            </div>
            <div className="font-bold text-sm">Quick Hub Onboarding</div>
            <div className="text-xs text-blue-200">10-minute briefing at nearest ISBT depot</div>
          </div>
          <div className="space-y-1">
            <div className="w-8 h-8 mx-auto rounded-full bg-white/20 flex items-center justify-center font-black text-xs">
              3
            </div>
            <div className="font-bold text-sm">Accept & Earn</div>
            <div className="text-xs text-blue-200">Turn on duty mode and receive dispatches</div>
          </div>
        </div>

        <div className="pt-2 text-center">
          <Button3D
            variant="emerald"
            size="md"
            onClick={() => navigate('/signup?role=DELIVERY_PARTNER')}
          >
            Apply Now & Get ₹500 Joining Bonus
          </Button3D>
        </div>
      </Card3D>
    </div>
  );
};
