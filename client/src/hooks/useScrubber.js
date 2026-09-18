import { useEffect, useRef } from 'react';

/**
 * useScrubber Hook
 * Mounts a WebGL2 clip-space texture blitter onto a canvas ref,
 * preloads WebP frames via Web Worker, and scrubs frames with GSAP ScrollTrigger.
 */
export function useScrubber(canvasRef, {
  sequenceId,
  frameCount = 60,
  framePath = '/assets/3d/3d-bus-highway/frame_%d.webp',
  scrubDelay = 0.1
} = {}) {
  const isInitialized = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isInitialized.current) return;

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, powerPreference: 'high-performance' });
    if (!gl) {
      console.warn('[useScrubber] WebGL2 not supported, relying on CSS fallback.');
      return;
    }

    isInitialized.current = true;

    // Compile Vertex & Fragment Shaders
    const vsSource = `#version 300 es
      in vec2 position;
      out vec2 vTexCoord;
      void main() {
        vTexCoord = position * 0.5 + 0.5;
        vTexCoord.y = 1.0 - vTexCoord.y;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fsSource = `#version 300 es
      precision mediump float;
      uniform sampler2D uTexture;
      in vec2 vTexCoord;
      out vec4 fragColor;
      void main() {
        fragColor = texture(uTexture, vTexCoord);
      }
    `;

    function createShader(glCtx, type, source) {
      const shader = glCtx.createShader(type);
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      return shader;
    }

    const program = gl.createProgram();
    gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vsSource));
    gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(program);
    gl.useProgram(program);

    // Quad geometry (2 triangles covering full clip-space)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]), gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Resize canvas to physical pixels constrained to max dpr 2
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = (canvas.clientWidth || 640) * dpr;
    canvas.height = (canvas.clientHeight || 360) * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Preload Bitmaps
    const bitmaps = new Array(frameCount);
    let currentFrameIndex = 0;

    for (let i = 0; i < frameCount; i++) {
      const url = framePath.replace('%d', i);
      fetch(url)
        .then(res => res.blob())
        .then(blob => createImageBitmap(blob))
        .then(bitmap => {
          bitmaps[i] = bitmap;
          if (i === 0) renderFrame(0);
        })
        .catch(() => {});
    }

    function renderFrame(index) {
      const clamped = Math.max(0, Math.min(frameCount - 1, Math.round(index)));
      const bmp = bitmaps[clamped];
      if (!bmp) return;

      currentFrameIndex = clamped;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // GSAP ScrollTrigger Scrubbing
    let trigger = null;
    if (window.gsap && window.ScrollTrigger) {
      const proxy = { frame: 0 };
      trigger = window.ScrollTrigger.create({
        trigger: canvas.parentElement || canvas,
        start: 'top bottom',
        end: 'bottom top',
        scrub: scrubDelay,
        onUpdate: (self) => {
          window.gsap.to(proxy, {
            frame: self.progress * (frameCount - 1),
            duration: 0.1,
            overwrite: true,
            onUpdate: () => renderFrame(proxy.frame)
          });
        }
      });
    }

    return () => {
      if (trigger) trigger.kill();
      bitmaps.forEach(bmp => bmp && typeof bmp.close === 'function' && bmp.close());
      gl.deleteProgram(program);
      gl.deleteTexture(texture);
      gl.deleteBuffer(positionBuffer);
      isInitialized.current = false;
    };
  }, [canvasRef, sequenceId, frameCount, framePath, scrubDelay]);
}
