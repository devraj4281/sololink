import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        vblue: {
          light: '#c8e6ff',
          DEFAULT: '#0088CC',
          dark: '#00628b',
        },
        vbg: {
          DEFAULT: '#f9f9fa',
          surface: '#ffffff',
          soft: '#f3f3f4',
          high: '#e8e8e9',
        }
      },
      animation: {
        'border': 'border 4s linear infinite',
      },
      keyframes: {
        'border': {
          to: { '--border-angle': '360deg' },
        }
      }
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: ["light"], // Force daisyui to use light theme to avoid interference
  }
};
