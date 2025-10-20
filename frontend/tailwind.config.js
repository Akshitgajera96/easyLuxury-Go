/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern Luxury Color Palette with Soft Blues and Proper Contrast
        'primary': '#60A5FA',      // Soft blue - main brand color
        'secondary': '#93C5FD',    // Light blue - secondary accents
        'hero': '#3B82F6',         // Rich blue for hero sections
        'cta': '#60A5FA',          // Call-to-action blue
        'accent': '#60A5FA',       // Primary accent
        'accent-dark': '#3B82F6',  // Darker blue for hover states
        'accent-light': '#DBEAFE', // Very light blue for subtle backgrounds
        
        // Supporting colors with proper contrast
        'black40': '#1E293B',      // Dark slate for text/headers
        'dark-card': '#0F172A',    // Very dark blue for dark cards
        'glass-bg': 'rgba(96, 165, 250, 0.05)', // Subtle glass effect
        'blue-glow': '#60A5FA',    // Blue glow effect
        
        // Semantic Colors - Proper color coding for better UX
        success: {
          light: '#D1FAE5',        // Soft mint green
          DEFAULT: '#10B981',      // Fresh green
          dark: '#059669',         // Deep green
        },
        error: {
          light: '#FEE2E2',        // Soft pink
          DEFAULT: '#EF4444',      // Clear red
          dark: '#DC2626',         // Deep red
        },
        warning: {
          light: '#FEF3C7',        // Soft yellow
          DEFAULT: '#F59E0B',      // Warm amber
          dark: '#D97706',         // Deep amber
        },
        info: {
          light: '#DBEAFE',        // Soft blue
          DEFAULT: '#3B82F6',      // Rich blue
          dark: '#2563EB',         // Deep blue
        },
        
        // Teal palette for luxury feel
        teal: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        rose: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48',
          700: '#BE123C',
          800: '#9F1239',
          900: '#881337',
        },
        orange: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        yellow: {
          50: '#FEFCE8',
          100: '#FEF9C3',
          200: '#FEF08A',
          300: '#FDE047',
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
          700: '#A16207',
          800: '#854D0E',
          900: '#713F12',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #93C5FD 0%, #60A5FA 100%)',
        'gradient-success': 'linear-gradient(135deg, #D1FAE5 0%, #10B981 100%)',
        'gradient-hero': 'linear-gradient(135deg, #FFFFFF 0%, #DBEAFE 50%, #93C5FD 100%)',
        'gradient-blue': 'linear-gradient(135deg, #93C5FD 0%, #3B82F6 100%)',
        'gradient-dark': 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
      },
      boxShadow: {
        'accent': '0 10px 40px -10px rgba(96, 165, 250, 0.4)',
        'xl-accent': '0 20px 60px -15px rgba(59, 130, 246, 0.5)',
        'glow': '0 0 20px rgba(96, 165, 250, 0.3)',
        'glow-lg': '0 0 40px rgba(59, 130, 246, 0.4)',
        'glass': '0 8px 32px 0 rgba(96, 165, 250, 0.15)',
      },
      backdropBlur: {
        'glass': '10px',
      },
    },
  },
  plugins: [],
}