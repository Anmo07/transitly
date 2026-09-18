import React, { useRef } from 'react';
import { useScrubber } from '../../hooks/useScrubber';

export const WebGLScrubber = ({
  sequenceId = '3D-BUS-HIGHWAY',
  frameCount = 75,
  framePath = '/assets/3d/3d-bus-highway/frame_%d.webp',
  aspectRatio = '16/9',
  children,
  className = ''
}) => {
  const canvasRef = useRef(null);

  useScrubber(canvasRef, {
    sequenceId,
    frameCount,
    framePath,
    scrubDelay: 0.1
  });

  return (
    <div
      className={`canvas-container-wrapper relative w-full overflow-hidden ${className}`}
      style={{ aspectRatio }}
    >
      {/* Background WebGL2 hardware blitted quad */}
      <canvas
        ref={canvasRef}
        className="canvas-webgl-engine absolute inset-0 w-full h-full pointer-events-none z-[1]"
        aria-hidden="true"
      />
      {/* Interactive HUD overlaid above canvas plane */}
      {children && (
        <div className="tracking-hud-overlay relative z-[5] pointer-events-auto w-full h-full flex flex-col justify-between">
          {children}
        </div>
      )}
    </div>
  );
};
