import { useEffect } from 'react';

/**
 * useMicro3D Hook
 * Attaches zero-reflow 3D perspective tilt, tactile scale depression,
 * and particle bursts to a React element ref.
 *
 * @param {React.RefObject} elementRef - Target DOM element ref
 * @param {Object} options - Configuration options
 */
export function useMicro3D(elementRef, {
  enabled = true,
  maxTilt = 6,
  scaleOnPress = 0.97,
  particles = true
} = {}) {
  useEffect(() => {
    const el = elementRef.current;
    if (!el || !enabled) return;

    // Respect user reduced-motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    el.style.willChange = 'transform, filter';
    el.style.transition = 'transform 0.15s cubic-bezier(0.25, 1, 0.5, 1), filter 0.15s ease';

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotY = ((x - rect.width / 2) / (rect.width / 2)) * maxTilt;
      const rotX = (((rect.height / 2) - y) / (rect.height / 2)) * maxTilt;
      el.style.transform = `perspective(500px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`;
    };

    const handleMouseLeave = () => {
      el.style.transform = 'perspective(500px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    };

    const handlePress = () => {
      el.style.transform = `perspective(500px) scale3d(${scaleOnPress}, ${scaleOnPress}, ${scaleOnPress})`;
      el.style.filter = 'brightness(0.95)';
      if (window.navigator?.vibrate) window.navigator.vibrate(8);
    };

    const handleRelease = (e) => {
      el.style.transform = 'perspective(500px) scale3d(1.02, 1.02, 1.02)';
      el.style.filter = 'brightness(1)';
      if (particles && e && e.clientX) {
        spawnParticles(e.clientX, e.clientY);
      }
    };

    el.addEventListener('mousemove', handleMouseMove, { passive: true });
    el.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    el.addEventListener('mousedown', handlePress, { passive: true });
    el.addEventListener('mouseup', handleRelease, { passive: true });
    el.addEventListener('touchstart', handlePress, { passive: true });
    el.addEventListener('touchend', handleRelease, { passive: true });

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('mousedown', handlePress);
      el.removeEventListener('mouseup', handleRelease);
      el.removeEventListener('touchstart', handlePress);
      el.removeEventListener('touchend', handleRelease);
    };
  }, [elementRef, enabled, maxTilt, scaleOnPress, particles]);
}

/**
 * Lightweight canvas particle emitter
 */
let particleCanvas = null;
let particleCtx = null;
const activeParticles = [];

function spawnParticles(x, y) {
  if (typeof document === 'undefined') return;

  if (!particleCanvas) {
    particleCanvas = document.createElement('canvas');
    particleCanvas.id = 'react-micro3d-canvas';
    particleCanvas.style.position = 'fixed';
    particleCanvas.style.inset = '0';
    particleCanvas.style.width = '100vw';
    particleCanvas.style.height = '100vh';
    particleCanvas.style.pointerEvents = 'none';
    particleCanvas.style.zIndex = '99999';
    document.body.appendChild(particleCanvas);
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
    particleCtx = particleCanvas.getContext('2d');
  }

  const colors = ['#0050cb', '#0066ff', '#10b981', '#ffffff'];
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3.5;
    activeParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      size: 2.5 + Math.random() * 2
    });
  }

  if (activeParticles.length === 8) {
    animateParticles();
  }
}

function animateParticles() {
  if (!particleCtx || activeParticles.length === 0) {
    if (particleCtx && particleCanvas) {
      particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    }
    return;
  }

  particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const p = activeParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.035;

    if (p.alpha <= 0) {
      activeParticles.splice(i, 1);
    } else {
      particleCtx.fillStyle = p.color;
      particleCtx.globalAlpha = p.alpha;
      particleCtx.beginPath();
      particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      particleCtx.fill();
    }
  }

  particleCtx.globalAlpha = 1;
  if (activeParticles.length > 0) {
    requestAnimationFrame(animateParticles);
  }
}
