/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#16A34A',
          dark: '#128a3e',
          light: '#e8f7ee',
        },
        navy: '#0F172A',
        amber: {
          DEFAULT: '#F59E0B',
          light: '#fef3e0',
        },
        bg: '#F8FAFC',
        card: '#FFFFFF',
        text: {
          DEFAULT: '#0F172A',
          secondary: '#64748B',
        },
        border: '#E2E8F0',
        error: '#DC2626',
        success: '#16A34A',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'page-title': ['26px', { lineHeight: '1.2', fontWeight: '700' }],
        'page-title-mobile': ['22px', { lineHeight: '1.2', fontWeight: '700' }],
        'section-heading': ['17px', { lineHeight: '1.3', fontWeight: '700' }],
        'card-heading': ['15px', { lineHeight: '1.35', fontWeight: '600' }],
        body: ['13px', { lineHeight: '1.45', fontWeight: '400' }],
        'secondary-text': ['12.5px', { lineHeight: '1.4', fontWeight: '400' }],
        'small-text': ['11.5px', { lineHeight: '1.35', fontWeight: '400' }],
        'micro-text': ['10.5px', { lineHeight: '1.3', fontWeight: '500' }],
        'button-text': ['13.5px', { lineHeight: '1', fontWeight: '600' }],
        odds: ['14.5px', { lineHeight: '1.15', fontWeight: '700' }],
        'odds-label': ['10.5px', { lineHeight: '1.2', fontWeight: '500' }],
        balance: ['22px', { lineHeight: '1.15', fontWeight: '700' }],
      },
      borderRadius: {
        DEFAULT: '10px',
        card: '12px',
      },
      spacing: {
        18: '72px',
      },
      maxWidth: {
        app: '1280px',
      },
      transitionDuration: {
        150: '150ms',
        200: '200ms',
        250: '250ms',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        elevated: '0 4px 16px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.06)',
        'glow-green': '0 0 24px rgba(22, 163, 74, 0.18)',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
        oddsFlashUp: { '0%': { backgroundColor: 'rgba(22, 163, 74, 0.35)' }, '100%': { backgroundColor: 'transparent' } },
        oddsFlashDown: { '0%': { backgroundColor: 'rgba(220, 38, 38, 0.25)' }, '100%': { backgroundColor: 'transparent' } },
        bumpIn: { '0%': { transform: 'scale(0.6)' }, '60%': { transform: 'scale(1.15)' }, '100%': { transform: 'scale(1)' } },
        ballBounce: {
          '0%, 100%': { transform: 'translateY(0) scaleX(1)' },
          '45%': { transform: 'translateY(-14px) scaleX(0.96)' },
          '50%': { transform: 'translateY(-16px) scaleX(1)' },
          '55%': { transform: 'translateY(-14px) scaleX(0.96)' },
          '75%': { transform: 'translateY(0) scaleX(1.06)' },
        },
        ballShadow: {
          '0%, 100%': { transform: 'scaleX(1)', opacity: '0.3' },
          '50%': { transform: 'scaleX(0.6)', opacity: '0.15' },
        },
        pitchBallRoam: {
          '0%': { left: '48%', top: '55%' },
          '20%': { left: '62%', top: '40%' },
          '40%': { left: '35%', top: '35%' },
          '60%': { left: '55%', top: '65%' },
          '80%': { left: '70%', top: '50%' },
          '100%': { left: '48%', top: '55%' },
        },
        playerRoamA: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(10px, -8px)' },
        },
        playerRoamB: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(-12px, 6px)' },
        },
        playerRoamC: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(6px, 10px)' },
        },
        playerSurgeRight: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '35%': { transform: 'translate(18px, -4px)' },
          '65%': { transform: 'translate(26px, 4px)' },
        },
        playerSurgeLeft: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '35%': { transform: 'translate(-18px, 5px)' },
          '65%': { transform: 'translate(-26px, -3px)' },
        },
        ballToAwayGoal: {
          '0%': { left: '48%', top: '55%', opacity: '1' },
          '55%': { left: '78%', top: '48%', opacity: '1' },
          '85%': { left: '90%', top: '50%', opacity: '1' },
          '100%': { left: '95%', top: '50%', opacity: '0' },
        },
        ballToHomeGoal: {
          '0%': { left: '48%', top: '55%', opacity: '1' },
          '55%': { left: '20%', top: '48%', opacity: '1' },
          '85%': { left: '9%', top: '50%', opacity: '1' },
          '100%': { left: '4%', top: '50%', opacity: '0' },
        },
        netFlash: {
          '0%, 100%': { opacity: '0' },
          '50%': { opacity: '0.9' },
        },
      },
    },
  },
  plugins: [],
}
