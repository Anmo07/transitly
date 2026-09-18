import React from 'react';
import { Icon } from '../atoms/Icon';

export const CorridorTimeline = ({ stages, currentStageIndex = 2 }) => {
  const DEFAULT_STAGES = [
    {
      title: 'Booking Confirmed',
      desc: 'Sender generated encrypted QR seal',
      time: '10:30 AM',
      icon: 'check_circle'
    },
    {
      title: 'First-Mile Pickup Complete',
      desc: 'Rider delivered parcel to ISBT Terminal',
      time: '11:15 AM',
      icon: 'two_wheeler'
    },
    {
      title: 'Stowed in Bus Cargo Bay',
      desc: 'Secured on HR-68-A-1001 (Bay 3B)',
      time: '11:45 AM',
      icon: 'directions_bus'
    },
    {
      title: 'Highway In-Transit',
      desc: 'Cruising NH-44 at 72 km/h',
      time: 'LIVE',
      icon: 'speed'
    },
    {
      title: 'Destination Hub Arrival',
      desc: 'Scheduled at Sector 43 ISBT, Chandigarh',
      time: '02:30 PM (Est)',
      icon: 'warehouse'
    },
    {
      title: 'Last-Mile Doorstep Delivery',
      desc: '4-Digit PIN handoff to recipient',
      time: '03:15 PM (Est)',
      icon: 'package_2'
    }
  ];

  const displayStages = stages || DEFAULT_STAGES;

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#ecedfa]">
      {displayStages.map((stage, index) => {
        const isCompleted = index < currentStageIndex;
        const isCurrent = index === currentStageIndex;
        const isPending = index > currentStageIndex;

        return (
          <div key={index} className="relative flex items-start gap-4">
            {/* Stage Indicator Node */}
            <div
              className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                isCompleted
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : isCurrent
                  ? 'bg-[#0050cb] text-white ring-4 ring-blue-100 shadow-md animate-pulse'
                  : 'bg-white border-2 border-slate-300 text-slate-300'
              }`}
            >
              {isCompleted ? (
                <Icon name="check" size="xs" />
              ) : isCurrent ? (
                <span className="w-2 h-2 rounded-full bg-white" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              )}
            </div>

            {/* Stage Content */}
            <div
              className={`flex-1 rounded-2xl p-3 border transition-all ${
                isCurrent
                  ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                  : isCompleted
                  ? 'bg-white border-[#ecedfa]'
                  : 'bg-slate-50/40 border-slate-100 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-bold text-xs ${
                      isCurrent ? 'text-[#0050cb]' : isCompleted ? 'text-[#191b24]' : 'text-slate-500'
                    }`}
                  >
                    {stage.title}
                  </span>
                  {isCurrent && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-blue-600 text-white uppercase tracking-wider">
                      ACTIVE
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold text-slate-400">{stage.time}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{stage.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
