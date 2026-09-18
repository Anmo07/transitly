/**
 * Transitly - 3D Pipeline Runtime Orchestrator
 * public/js/init-3d-pipeline.js
 *
 * Automatically inspects the current page route, resolves mapped 3D landmarks
 * from scrubber-manifest.json, mounts WebGL2 canvas contexts into the layout
 * sandwich containers, and attaches hardware-accelerated micro-interactions.
 */

(function () {
  'use strict';

  // Do not execute if user explicitly requested reduced motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    console.log('[3D Pipeline] prefers-reduced-motion detected: preserving static presentation.');
    return;
  }

  async function initPipeline() {
    try {
      const response = await fetch('/js/scrubber-manifest.json');
      if (!response.ok) return;
      const manifest = await response.json();

      const currentPath = window.location.pathname;
      let currentFile = currentPath === '/' || currentPath === '' ? 'index.html' : currentPath.replace('/', '') + '.html';
      if (currentPath.endsWith('.html')) {
        currentFile = currentPath.split('/').pop();
      }

      const pageConfig = manifest.pages[currentFile] || manifest.pages['index.html'];
      if (!pageConfig || !pageConfig.has3DLandmarks) {
        return;
      }

      pageConfig.landmarks.forEach((landmark) => {
        mountScrubberToLandmark(landmark);
      });
    } catch (err) {
      console.warn('[3D Pipeline] Scrubber auto-mount notice:', err.message);
    }
  }

  function mountScrubberToLandmark(landmark) {
    const container = document.querySelector(landmark.targetContainerSelector);
    if (!container) return;

    // Safety: only mount onto structural layout containers, not interactive controls
    const tagName = container.tagName.toLowerCase();
    if (['button', 'input', 'select', 'textarea', 'a'].includes(tagName)) {
      return;
    }

    // Check if canvas already mounted
    const canvasId = `canvas-${landmark.sequenceId.toLowerCase()}`;
    if (container.querySelector(`#${canvasId}`)) return;

    // Wrap / annotate container with CLS containment layout classes
    container.classList.add('canvas-container-wrapper');
    if (landmark.mobileAspectRatio === '1/1') {
      container.classList.add('aspect-square');
    } else if (landmark.mobileAspectRatio === '9/16') {
      container.classList.add('aspect-mobile');
    }

    // Create and inject background WebGL2 canvas
    const canvas = document.createElement('canvas');
    canvas.id = canvasId;
    canvas.className = 'canvas-webgl-engine';
    canvas.setAttribute('aria-hidden', 'true');

    // Prepend canvas behind UI elements
    container.insertBefore(canvas, container.firstChild);

    // Mark interactive child layers as tracking HUD overlays
    Array.from(container.children).forEach((child) => {
      if (child !== canvas && !child.classList.contains('tracking-hud-overlay')) {
        child.classList.add('tracking-hud-overlay');
      }
    });

    // Instantiate GoldStandardScrubber
    if (typeof window.GoldStandardScrubber === 'function') {
      new window.GoldStandardScrubber({
        canvasSelector: `#${canvasId}`,
        frameCount: landmark.recommendedFrameCount,
        framePath: landmark.framePath
      });
      console.log(`✔ [3D Pipeline] Mounted WebGL2 Scrubber for ${landmark.sequenceId} into ${landmark.targetContainerSelector}`);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPipeline);
  } else {
    initPipeline();
  }
})();
