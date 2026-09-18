/**
 * Transitly - Hardened Production-Grade WebGL2 Canvas Scrubber Engine
 * public/js/gold-standard-scrubber.js
 *
 * Direct VRAM texture blitting via WebGL2, multi-threaded Web Worker
 * preloading via createImageBitmap(), and GSAP ScrollTrigger synchronization.
 */

class GoldStandardScrubber {
  constructor(options) {
    this.canvas = document.querySelector(options.canvasSelector);
    if (!this.canvas) {
      console.warn(`[GoldStandardScrubber] Target canvas ${options.canvasSelector} not found.`);
      return;
    }

    // 1. Explicitly request WebGL2 for optimal high-DPI GPU texture binding
    this.gl = this.canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      powerPreference: 'high-performance'
    });

    this.frameCount = options.frameCount || 60;
    this.framePath = options.framePath;
    this.bitmaps = new Array(this.frameCount);
    this.currentFrame = { frame: 0 };
    this.currentLoadedTexture = null;

    if (!this.gl) {
      console.warn("[GoldStandardScrubber] WebGL2 unsupported, failing gracefully to CSS fallback tokens.");
      this.fallback();
      return;
    }

    this.init();
  }

  async init() {
    this.setupShaders();
    this.setupWebGLViewport();
    window.addEventListener('resize', () => this.setupWebGLViewport(), { passive: true });
    await this.preloadViaWorker();
    this.bindScrollTrigger();
  }

  setupShaders() {
    const gl = this.gl;

    // Minimalist clip-space vertex shader to project the texture quad without layout overhead
    const vsSource = `#version 300 es
      in vec2 position;
      out vec2 vTexCoord;
      void main() {
        vTexCoord = position * 0.5 + 0.5;
        vTexCoord.y = 1.0 - vTexCoord.y; // Flip Y-axis to account for WebGL texture orientation coordinate system
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // High-performance fragment shader for smooth pixel scaling and alpha blending pass-throughs
    const fsSource = `#version 300 es
      precision highp float;
      in vec2 vTexCoord;
      uniform sampler2D uTexture;
      out vec4 fragColor;
      void main() {
        fragColor = texture(uTexture, vTexCoord);
      }
    `;

    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(vs));
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(fs));
    }

    this.program = gl.createProgram();
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    // Set up standard 2D quad geometry bounds [-1, -1] to [1, 1]
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posAttr = gl.getAttribLocation(this.program, 'position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  setupWebGLViewport() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Hard constraint caps memory on ultra-DPI mobile grids
    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.renderWebGLTexture(Math.floor(this.currentFrame.frame));
  }

  async preloadViaWorker() {
    // Generate inline worker file string to enforce a zero-configuration pipeline file layout
    const workerCode = `
      self.onmessage = async (e) => {
        const { frameCount, framePath } = e.data;
        for (let i = 1; i <= frameCount; i++) {
          try {
            const url = framePath.replace('%d', String(i).padStart(4, '0'));
            const response = await fetch(url);
            const blob = await response.blob();
            // Pre-decode inside memory thread context before sending to avoid main execution locks
            const bitmap = await createImageBitmap(blob);
            self.postMessage({ index: i - 1, bitmap }, [bitmap]);
          } catch (err) {
            self.postMessage({ index: i - 1, error: true });
          }
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    worker.postMessage({ frameCount: this.frameCount, framePath: this.framePath });

    return new Promise((resolve) => {
      let loaded = 0;
      worker.onmessage = (e) => {
        const { index, bitmap, error } = e.data;
        if (!error) this.bitmaps[index] = bitmap;
        loaded++;

        // Paint frame 0 immediately as soon as ready to avoid canvas blank states
        if (index === 0 && bitmap) {
          this.renderWebGLTexture(0);
        }

        if (loaded === this.frameCount) {
          worker.terminate();
          resolve();
        }
      };
    });
  }

  renderWebGLTexture(frameIndex) {
    const bitmap = this.bitmaps[frameIndex] || this.bitmaps[0];
    if (!bitmap || this.currentLoadedTexture === frameIndex) return;

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    // Direct zero-copy VRAM texture overwrite execution loop
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    this.currentLoadedTexture = frameIndex;
  }

  bindScrollTrigger() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn("[GoldStandardScrubber] GSAP or ScrollTrigger dependency missing, static frame active.");
      return;
    }

    gsap.to(this.currentFrame, {
      frame: this.frameCount - 1,
      snap: 'frame',
      ease: 'none',
      scrollTrigger: {
        trigger: this.canvas.parentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.1, // Capped hyper-responsive follow interval matches high-refresh screens (120Hz+)
        onUpdate: () => this.renderWebGLTexture(Math.floor(this.currentFrame.frame))
      }
    });
  }

  fallback() {
    this.canvas.style.display = 'none';
    const parent = this.canvas.parentElement;
    if (parent) {
      parent.classList.add('use-css-fallback');
    }
  }
}

if (typeof window !== 'undefined') {
  window.GoldStandardScrubber = GoldStandardScrubber;
}
