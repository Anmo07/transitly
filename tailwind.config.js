/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.{html,js}",
    "./src/**/*.{html,js}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "on-surface": "#191b24",
        "on-error-container": "#93000a",
        "on-secondary-fixed": "#191c1e",
        "outline": "#727687",
        "outline-variant": "#c2c6d8",
        "secondary-fixed-dim": "#c4c7c9",
        "inverse-on-surface": "#eff0fd",
        "surface-container-high": "#e6e7f4",
        "background": "#faf8ff",
        "inverse-surface": "#2e303a",
        "surface-variant": "#e1e2ee",
        "on-surface-variant": "#424656",
        "on-error": "#ffffff",
        "on-primary": "#ffffff",
        "tertiary-container": "#cc4204",
        "on-primary-fixed": "#001849",
        "on-tertiary": "#ffffff",
        "error-container": "#ffdad6",
        "primary-fixed-dim": "#b3c5ff",
        "primary-container": "#0066ff",
        "on-tertiary-fixed-variant": "#832600",
        "secondary": "#5c5f61",
        "surface-container-highest": "#e1e2ee",
        "surface-tint": "#0054d6",
        "on-primary-fixed-variant": "#003fa4",
        "surface-bright": "#faf8ff",
        "tertiary-fixed-dim": "#ffb59d",
        "surface-container-lowest": "#ffffff",
        "inverse-primary": "#b3c5ff",
        "on-tertiary-container": "#fff6f4",
        "on-tertiary-fixed": "#390c00",
        "secondary-container": "#e0e3e5",
        "on-background": "#191b24",
        "primary": "#0050cb",
        "secondary-fixed": "#e0e3e5",
        "surface-dim": "#d8d9e6",
        "surface-container-low": "#f2f3ff",
        "on-secondary": "#ffffff",
        "surface": "#faf8ff",
        "error": "#ba1a1a",
        "on-primary-container": "#f8f7ff",
        "surface-container": "#ecedfa",
        "tertiary-fixed": "#ffdbd0",
        "on-secondary-container": "#626567",
        "primary-fixed": "#dae1ff",
        "tertiary": "#a33200",
        "on-secondary-fixed-variant": "#444749"
      },
      fontFamily: {
        "sans": ["Plus Jakarta Sans", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"]
      },
      boxShadow: {
        'level-1': '0px 4px 20px rgba(0, 0, 0, 0.05)',
        'level-2': '0px 8px 30px rgba(0, 102, 255, 0.08)',
      }
    }
  },
  plugins: []
};
