import React, { useRef } from 'react';
import { useMicro3D } from '../../hooks/useMicro3D';

export const Card3D = ({
  children,
  tilt = true,
  interactive = false,
  className = '',
  onClick,
  ...props
}) => {
  const cardRef = useRef(null);
  useMicro3D(cardRef, { enabled: tilt, maxTilt: 3, scaleOnPress: interactive ? 0.98 : 1, particles: false });

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`relative bg-white rounded-2xl p-5 border border-[#ecedfa] shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-200 overflow-hidden ${
        interactive ? 'cursor-pointer hover:shadow-md hover:border-blue-200' : ''
      } ${className}`}
      style={{ contain: 'layout style' }}
      {...props}
    >
      {children}
    </div>
  );
};
