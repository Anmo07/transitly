/**
 * Transitly - Universal Hardware-Accelerated Micro-Interactions Engine
 * public/js/micro-3d.js
 *
 * Lightweight, zero-reflow 3D perspective tilts, tactile push depressions,
 * and particle emitters using GPU composite layers.
 */

class TransitlyMicro3D {
  constructor() {
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.isReducedMotion) return;

    this.init();
  }

  init() {
    // Dynamic query to catch buttons, inputs, and interactive cards
    const interactiveElements = document.querySelectorAll(
      '[data-micro-3d], button:not([data-no-3d]), .card, input:not([type="hidden"]), select, textarea'
    );

    interactiveElements.forEach(el => {
      el.style.willChange = 'transform, filter';
      el.style.transition = 'transform 0.15s cubic-bezier(0.25, 1, 0.5, 1), filter 0.15s ease';

      el.addEventListener('mousemove', (e) => this.handleTilt(e, el), { passive: true });
      el.addEventListener('mouseleave', () => this.resetTilt(el), { passive: true });
      el.addEventListener('mousedown', () => this.handlePress(el), { passive: true });
      el.addEventListener('mouseup', (e) => this.handleRelease(e, el), { passive: true });
      
      // Mobile touch support
      el.addEventListener('touchstart', () => this.handlePress(el), { passive: true });
      el.addEventListener('touchend', (e) => this.handleRelease(e, el), { passive: true });
    });
  }

  handleTilt(e, el) {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateY = ((x - (rect.width / 2)) / (rect.width / 2)) * 6; // Constrain maximum tilt orbit safely
    const rotateX = (((rect.height / 2) - y) / (rect.height / 2)) * 6;

    el.style.transform = `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  }

  resetTilt(el) {
    el.style.transform = 'perspective(500px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  }

  handlePress(el) {
    el.style.transform = 'perspective(500px) scale3d(0.97, 0.97, 0.97)';
    el.style.filter = 'brightness(0.95)';
    if (window.navigator.vibrate) window.navigator.vibrate(8);
  }

  handleRelease(e, el) {
    el.style.transform = 'perspective(500px) scale3d(1.02, 1.02, 1.02)';
    el.style.filter = 'brightness(1)';
    if (e && e.clientX && e.clientY) {
      this.spawnParticleBurst(e.clientX, e.clientY);
    }
  }

  spawnParticleBurst(x, y) {
    const canvas = document.getElementById('micro3dCanvas') || this.createGlobalParticleCanvas();
    const ctx = canvas.getContext('2d');
    const particles = Array.from({ length: 6 }, () => ({
      x, y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5 - 1.5,
      size: Math.random() * 3 + 2,
      color: Math.random() > 0.5 ? '#0050cb' : '#10b981',
      life: 1
    }));

    function anim() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        if (p.life > 0) {
          p.x += p.vx; p.y += p.vy; p.vy += 0.12;
          p.life -= 0.05;
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
          alive = true;
        }
      });
      if (alive) requestAnimationFrame(anim);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(anim);
  }

  createGlobalParticleCanvas() {
    const c = document.createElement('canvas');
    c.id = 'micro3dCanvas';
    c.style.position = 'fixed';
    c.style.inset = '0';
    c.style.width = '100vw';
    c.style.height = '100vh';
    c.style.pointerEvents = 'none';
    c.style.zIndex = '9999';
    document.body.appendChild(c);
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    return c;
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!window.transitlyMicro3D) window.transitlyMicro3D = new TransitlyMicro3D();
    });
  } else {
    if (!window.transitlyMicro3D) window.transitlyMicro3D = new TransitlyMicro3D();
  }
}
