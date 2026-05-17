/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          dark: "#0a0a12",
        },
        primary: {
          DEFAULT: "#6366f1",
          glow: "rgba(99, 102, 241, 0.3)",
        },
        secondary: {
          DEFAULT: "#ec4899",
          glow: "rgba(236, 72, 153, 0.3)",
        },
        accent: {
          DEFAULT: "#06b6d4",
        }
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
