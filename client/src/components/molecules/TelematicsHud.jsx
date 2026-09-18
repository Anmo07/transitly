import React from 'react';
import { Icon } from '../atoms/Icon';
import { Badge } from '../atoms/Badge';

export const TelematicsHud = ({
  speed = 78,
  distance = '42.8 km',
  eta = '38 mins',
  carrierPlate = 'HR-68-A-1001',
  corridor = 'Delhi ➔ Chandigarh Express',
  progress = 65,
  live = true
}) => {
  return (
    <div className="glass-panel rounded-2xl p-4 shadow-lg border border-white/60 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={live ? 'transit' : 'neutral'} pulse={live}>
            {live ? 'HIGHWAY TELEMATICS' : 'SCHEDULED'}
          </Badge>
          <span className="text-xs font-mono font-bold text-slate-500">{carrierPlate}</span>
        </div>
        <span className="text-xs font-bold text-[#0050cb] flex items-center gap-1">
          <Icon name="schedule" size="xs" />
          ETA: {eta}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
        <span>{corridor}</span>
        <span className="font-mono text-slate-900">{distance} remaining</span>
      </div>

      {/* Highway Progress Bar */}
      <div className="relative w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#0050cb] to-[#0066ff] rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-mono">
          <Icon name="speed" size="xs" color="#0050cb" />
          <span>{speed} km/h (Highway Cruiser)</span>
        </div>
        <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          GPS 3s Ping Active
        </span>
      </div>
    </div>
  );
};
