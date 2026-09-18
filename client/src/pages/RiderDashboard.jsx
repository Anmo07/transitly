import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card3D } from '../components/atoms/Card3D';
import { Button3D } from '../components/atoms/Button3D';
import { Badge } from '../components/atoms/Badge';
import { Icon } from '../components/atoms/Icon';
import { LiveMap } from '../components/organisms/LiveMap';

export const RiderDashboard = () => {
  const navigate = useNavigate();
  const [cargoInCustody, setCargoInCustody] = useState(false);

  return (
    <div className="space-y-5">
      {/* Shift Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        <Card3D className="p-3.5 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Earnings</span>
          <div className="font-mono text-lg font-black text-[#0050cb] mt-0.5">₹148.50</div>
          <span className="text-[9px] text-emerald-600 font-bold">+₹32 Surge</span>
        </Card3D>
        <Card3D className="p-3.5 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed</span>
          <div className="font-mono text-lg font-black text-slate-900 mt-0.5">4 Trips</div>
          <span className="text-[9px] text-slate-500 font-medium">1 In-Transit</span>
        </Card3D>
        <Card3D className="p-3.5 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rating</span>
          <div className="font-mono text-lg font-black text-amber-500 mt-0.5 flex items-center justify-center gap-1">
            ★ 4.98
          </div>
          <span className="text-[9px] text-slate-500 font-medium">Top Tier</span>
        </Card3D>
      </div>

      {/* Active Assignment Preview Card */}
      <Card3D className="space-y-3.5 border-blue-200 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0066ff] animate-pulse" />
            <h3 className="font-extrabold text-sm text-[#191b24]">Active Last-Mile Handoff</h3>
          </div>
          <Badge variant="transit">Task #TRK-88219</Badge>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
          <div className="flex items-start gap-2.5 text-xs">
            <Icon name="trip_origin" size="xs" color="#0050cb" className="mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Chandigarh ISBT Sector 17 — Bay #4</p>
              <p className="text-[11px] text-slate-500">Pick up from Carrier HR-68-A-1001</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 text-xs">
            <Icon name="location_on" size="xs" color="#10b981" className="mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Sector 35-B, House #142</p>
              <p className="text-[11px] text-slate-500">Recipient: Rohan Verma (+91 98102-34567)</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button3D
            variant="primary"
            size="md"
            icon="navigation"
            onClick={() => navigate('/rider-map-trips')}
            className="flex-1"
          >
            Start Turn-By-Turn Navigation
          </Button3D>
        </div>

        <Button3D
          variant={cargoInCustody ? 'emerald' : 'secondary'}
          size="md"
          icon={cargoInCustody ? 'verified' : 'check_box'}
          onClick={() => setCargoInCustody(!cargoInCustody)}
          className="w-full text-xs"
        >
          {cargoInCustody
            ? '✔ Cargo In Custody — Ready for Dropoff'
            : 'Mark Arrived & Cargo In Custody'}
        </Button3D>
      </Card3D>

      {/* Demand Hotspot Map Preview */}
      <Card3D className="p-0 overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#cc4204] animate-pulse" />
            <h4 className="font-extrabold text-sm text-[#191b24]">Demand Hotspot</h4>
          </div>
          <Badge variant="surge">+15% Surge Bonus</Badge>
        </div>
        <div className="w-full h-44 relative">
          <LiveMap
            center={[30.7333, 76.7794]}
            zoom={13}
            interactive={false}
            surgeRadius={1200}
          />
          <div className="absolute bottom-3 left-3 right-3 z-10 glass-panel p-2.5 rounded-xl flex items-center justify-between text-xs font-bold text-slate-800 shadow-md">
            <span>Downtown Logistics Hub • ~18 orders queued</span>
            <span className="text-[#0050cb]">+₹30 Avg</span>
          </div>
        </div>
      </Card3D>
    </div>
  );
};
