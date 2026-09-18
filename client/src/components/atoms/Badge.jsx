import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral',
  pulse = false,
  icon = null,
  className = '',
  ...props
}) => {
  const variants = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    online: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    transit: 'bg-blue-50 text-[#0050cb] border-blue-200',
    surge: 'bg-orange-50 text-[#cc4204] border-orange-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    dark: 'bg-[#191b24] text-white border-slate-700'
  };

  const pulseColors = {
    online: 'bg-emerald-500',
    transit: 'bg-[#0050cb]',
    surge: 'bg-[#cc4204]',
    error: 'bg-red-500',
    neutral: 'bg-slate-400'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${variants[variant] || variants.neutral} ${className}`}
      {...props}
    >
      {pulse && (
        <span className={`w-2 h-2 rounded-full animate-pulse ${pulseColors[variant] || 'bg-slate-400'}`} />
      )}
      {icon && <span className="material-symbols-outlined text-[14px]">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
