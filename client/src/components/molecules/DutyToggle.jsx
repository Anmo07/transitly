import React, { useState } from 'react';
import { Icon } from '../atoms/Icon';

export const DutyToggle = ({ isOnline, onToggle, autoAccept = false, onAutoAcceptToggle }) => {
  const [loading, setLoading] = useState(false);

  const handleDutyClick = async () => {
    setLoading(true);
    try {
      if (onToggle) await onToggle(!isOnline);
      if (window.navigator?.vibrate) {
        window.navigator.vibrate([15, 30, 15]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between bg-white border border-[#ecedfa] p-3 rounded-2xl shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
          }`}
        >
          <Icon name={isOnline ? 'power_settings_new' : 'power_off'} size="md" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-[#191b24]">
              {isOnline ? 'You are Online' : 'You are Offline'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
              }`}
            />
          </div>
          <p className="text-xs text-slate-500">
            {isOnline ? 'Receiving priority trip assignments' : 'Go online to receive nearby deliveries'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onAutoAcceptToggle && isOnline && (
          <button
            type="button"
            onClick={() => onAutoAcceptToggle(!autoAccept)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
              autoAccept
                ? 'bg-blue-50 border-blue-200 text-[#0050cb]'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            {autoAccept ? 'AUTO-ACCEPT ON' : 'AUTO-ACCEPT OFF'}
          </button>
        )}

        <button
          type="button"
          onClick={handleDutyClick}
          disabled={loading}
          aria-label="Toggle Online Duty Status"
          className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#0050cb]/30 ${
            isOnline ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
        >
          <span
            className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${
              isOnline ? 'transform translate-x-6' : ''
            }`}
          >
            {loading ? (
              <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span
                className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}
              />
            )}
          </span>
        </button>
      </div>
    </div>
  );
};
