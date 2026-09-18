import React, { useRef, useState } from 'react';
import { useMicro3D } from '../../hooks/useMicro3D';

export const Input3D = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  icon = null,
  error = null,
  className = '',
  ...props
}) => {
  const containerRef = useRef(null);
  const [focused, setFocused] = useState(false);
  useMicro3D(containerRef, { maxTilt: 3, scaleOnPress: 0.99, particles: false });

  const hasValue = value !== undefined && value !== null && value.toString().length > 0;

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      <div
        ref={containerRef}
        className={`relative flex items-center bg-[#f2f3ff] rounded-xl border transition-all duration-200 px-3.5 h-13 overflow-hidden ${
          focused
            ? 'border-[#0050cb] shadow-[0_0_0_3px_rgba(0,80,203,0.15)] bg-white'
            : error
            ? 'border-[#ba1a1a] bg-red-50/50'
            : 'border-transparent hover:border-slate-300'
        }`}
      >
        {icon && (
          <span className="material-symbols-outlined text-slate-400 text-[20px] mr-2.5 select-none">
            {icon}
          </span>
        )}
        <div className="relative flex-1 h-full flex items-center">
          {label && (
            <label
              htmlFor={id}
              className={`absolute left-0 transition-all duration-150 pointer-events-none select-none text-slate-500 font-medium ${
                focused || hasValue
                  ? 'text-[10px] top-1.5 text-[#0050cb]'
                  : 'text-sm top-3.5 text-slate-400'
              }`}
            >
              {label}
            </label>
          )}
          <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={label ? (focused ? placeholder : '') : placeholder}
            className={`w-full bg-transparent text-[#191b24] font-medium text-sm focus:outline-none ${
              label ? (focused || hasValue ? 'pt-3 pb-0.5' : '') : 'py-2'
            }`}
            {...props}
          />
        </div>
      </div>
      {error && <span className="text-[11px] text-[#ba1a1a] font-medium pl-1">{error}</span>}
    </div>
  );
};
