/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        abyss: {
          bg: '#0a0a0f',
          surface: '#0f0f1a',
          border: '#1a1a2e',
          panel: '#12121f',
        },
        neon: {
          red: '#ff0040',
          redDim: '#8b0020',
          redGlow: 'rgba(255, 0, 64, 0.15)',
        },
        terminal: {
          green: '#00ff41',
          cyan: '#00d4ff',
          gray: '#6b7280',
          dimgray: '#374151',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Cascadia Code"', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      animation: {
        glitch: 'glitch 0.3s ease-in-out',
        pulse_red: 'pulse_red 2s ease-in-out infinite',
        scanline: 'scanline 8s linear infinite',
      },
      keyframes: {
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        },
        pulse_red: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(255,0,64,0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(255,0,64,0.8), 0 0 40px rgba(255,0,64,0.3)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      boxShadow: {
        neon: '0 0 10px rgba(255, 0, 64, 0.5), 0 0 20px rgba(255, 0, 64, 0.2)',
        panel: '0 0 0 1px rgba(26, 26, 46, 0.8)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
