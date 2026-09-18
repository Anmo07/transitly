import React from 'react';

export const Icon = ({
  name,
  size = 'md',
  color = 'currentColor',
  filled = false,
  badge = null,
  className = '',
  spin = false,
  onClick,
  ...props
}) => {
  const sizeMap = {
    xs: 'text-[14px]',
    sm: 'text-[18px]',
    md: 'text-[22px]',
    lg: 'text-[28px]',
    xl: 'text-[36px]'
  };

  const style = {
    fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
    color
  };

  return (
    <span
      className={`relative inline-flex items-center justify-center select-none ${onClick ? 'cursor-pointer hover:scale-110 active:scale-95 transition-transform' : ''}`}
      onClick={onClick}
    >
      <span
        className={`material-symbols-outlined ${sizeMap[size] || sizeMap.md} ${spin ? 'animate-spin' : ''} ${className}`}
        style={style}
        {...props}
      >
        {name}
      </span>
      {badge !== null && badge !== undefined && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#cc4204] text-white text-[9px] font-bold flex items-center justify-center leading-none shadow-sm animate-in fade-in zoom-in">
          {badge}
        </span>
      )}
    </span>
  );
};
