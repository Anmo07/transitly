import React, { useState, useRef } from 'react';
import { Icon } from '../atoms/Icon';

export const SearchBar = ({
  placeholder = 'Enter pickup hub, bus stand, or address...',
  onSelect,
  initialValue = '',
  className = ''
}) => {
  const [query, setQuery] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const inputRef = useRef(null);

  const POPULAR_LOCATIONS = [
    { title: 'ISBT Kashmiri Gate, Delhi', sub: 'North Delhi Intercity Terminal', tag: 'Primary Hub' },
    { title: 'Majestic Bus Terminus, Bengaluru', sub: 'Kempegowda Bus Station', tag: 'High Volume' },
    { title: 'Sector 43 ISBT, Chandigarh', sub: 'Interstate Bus Terminal', tag: 'Corridor Hub' },
    { title: 'Swargate Bus Station, Pune', sub: 'MSRTC Intercity Depot', tag: 'Express Hub' },
    { title: 'Anand Vihar ISBT, Delhi', sub: 'East Delhi Intercity Terminal', tag: 'Primary Hub' },
    { title: 'Kallada Logistics Yard, Ernakulam', sub: 'South Express Cargo Bay', tag: 'Transit Bay' }
  ];

  const filteredLocations = POPULAR_LOCATIONS.filter((loc) =>
    loc.title.toLowerCase().includes(query.toLowerCase()) ||
    loc.sub.toLowerCase().includes(query.toLowerCase())
  );

  const handleUseCurrentLocation = () => {
    setLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocating(false);
          const val = `Current Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
          setQuery(val);
          setIsOpen(false);
          if (onSelect) {
            onSelect({
              title: val,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            });
          }
        },
        () => {
          setLocating(false);
          // Fallback to Delhi ISBT
          setQuery('ISBT Kashmiri Gate, Delhi');
          setIsOpen(false);
          if (onSelect) {
            onSelect({ title: 'ISBT Kashmiri Gate, Delhi', lat: 28.6665, lng: 77.2290 });
          }
        },
        { timeout: 5000 }
      );
    } else {
      setLocating(false);
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative flex items-center bg-white border border-[#ecedfa] focus-within:border-[#0050cb] rounded-2xl shadow-sm transition-all">
        <div className="pl-3.5 text-slate-400 flex items-center">
          <Icon name="search" size="sm" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full h-12 px-3 text-sm bg-transparent outline-none text-[#191b24] placeholder-slate-400 font-medium"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 transition"
          >
            <Icon name="close" size="xs" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={locating}
            title="Use current GPS location"
            className="mr-2 p-1.5 rounded-xl bg-blue-50 text-[#0050cb] hover:bg-blue-100 transition flex items-center gap-1 text-xs font-bold"
          >
            <Icon name={locating ? 'sync' : 'my_location'} size="xs" className={locating ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">GPS</span>
          </button>
        )}
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-[#ecedfa] shadow-xl z-30 overflow-hidden max-h-64 overflow-y-auto">
            <div className="p-2 border-b border-slate-100">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-blue-50 text-[#0050cb] transition"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Icon name="near_me" size="sm" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold">Use Current GPS Location</div>
                  <div className="text-[10px] text-slate-500">Auto-detect nearest bus bay</div>
                </div>
              </button>
            </div>

            <div className="p-2">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Corridor Hubs & Terminals
              </div>
              {filteredLocations.map((loc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(loc.title);
                    setIsOpen(false);
                    if (onSelect) onSelect(loc);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                      <Icon name="directions_bus" size="sm" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#191b24]">{loc.title}</div>
                      <div className="text-[10px] text-slate-400">{loc.sub}</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {loc.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
