import React, { useRef } from 'react';
import { useMicro3D } from '../../hooks/useMicro3D';

export const Button3D = ({
  children,
  variant = 'primary',
  size = 'md',
  icon = null,
  onClick,
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  ...props
}) => {
  const btnRef = useRef(null);
  useMicro3D(btnRef, { enabled: !disabled && !loading, maxTilt: 6, scaleOnPress: 0.97, particles: true });

  const baseStyles = "relative inline-flex items-center justify-center font-bold rounded-xl transition-all duration-150 select-none overflow-hidden cursor-pointer active:scale-95";

  const variants = {
    primary: "bg-[#0050cb] hover:bg-[#003fa4] text-white shadow-md shadow-blue-500/20 active:shadow-sm",
    secondary: "bg-[#f2f3ff] hover:bg-[#e6e7f4] text-[#0050cb] border border-[#dae1ff]",
    emerald: "bg-[#10b981] hover:bg-[#059669] text-white shadow-md shadow-emerald-500/20",
    danger: "bg-[#ba1a1a] hover:bg-[#93000a] text-white shadow-md shadow-red-500/20",
    ghost: "bg-transparent hover:bg-slate-100 text-[#191b24]",
    dark: "bg-[#191b24] hover:bg-[#2e303a] text-white"
  };

  const sizes = {
    sm: "h-9 px-3.5 text-xs gap-1.5",
    md: "h-12 px-5 text-sm gap-2",
    lg: "h-14 px-6 text-base gap-2.5",
    full: "w-full h-12 px-4 text-sm gap-2"
  };

  return (
    <button
      ref={btnRef}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
      ) : (
        <>
          {icon && (
            <span className="material-symbols-outlined text-[20px] select-none pointer-events-none" aria-hidden="true">
              {icon}
            </span>
          )}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};
