import React, { useState, useRef } from 'react';
import { Icon } from '../atoms/Icon';

export const SwipeConfirm = ({
  label = 'Swipe to Confirm Delivery',
  onConfirm,
  disabled = false,
  successText = '✔ Verified & Completed'
}) => {
  const [dragX, setDragX] = useState(0);
  const [completed, setCompleted] = useState(false);
  const trackRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);

  const handleStart = (clientX) => {
    if (disabled || completed) return;
    isDragging.current = true;
    startX.current = clientX - dragX;
  };

  const handleMove = (clientX) => {
    if (!isDragging.current || !trackRef.current) return;
    const maxDrag = trackRef.current.clientWidth - 56; // 48px thumb + padding
    const currentX = Math.max(0, Math.min(maxDrag, clientX - startX.current));
    setDragX(currentX);

    if (currentX >= maxDrag * 0.9) {
      isDragging.current = false;
      setCompleted(true);
      setDragX(maxDrag);
      if (window.navigator?.vibrate) window.navigator.vibrate([10, 50, 20]);
      if (onConfirm) onConfirm();
    }
  };

  const handleEnd = () => {
    if (!completed) {
      isDragging.current = false;
      setDragX(0);
    }
  };

  return (
    <div
      ref={trackRef}
      className={`relative w-full h-14 rounded-2xl overflow-hidden flex items-center p-1 select-none transition-colors duration-200 shadow-inner ${
        completed ? 'bg-emerald-600' : 'bg-[#ecedfa]'
      }`}
      onMouseMove={(e) => isDragging.current && handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchMove={(e) => isDragging.current && handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
    >
      <div
        className="absolute left-0 top-0 bottom-0 bg-[#0066ff] rounded-2xl transition-all duration-75"
        style={{ width: `${dragX + 52}px`, opacity: completed ? 0 : 0.8 }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold pointer-events-none text-slate-500">
        {completed ? (
          <span className="text-white flex items-center gap-1">
            <Icon name="check_circle" size="sm" />
            {successText}
          </span>
        ) : (
          label
        )}
      </span>
      {!completed && (
        <div
          className="relative z-10 w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing text-[#0050cb] touch-none transition-transform"
          style={{ transform: `translateX(${dragX}px)` }}
          onMouseDown={(e) => handleStart(e.clientX)}
          onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        >
          <Icon name="local_shipping" size="sm" />
        </div>
      )}
    </div>
  );
};
