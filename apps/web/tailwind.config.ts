import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bone: '#F4F1EA',
        surface: '#EAE6DD',
        paper: '#FBFAF6',
        ink: '#101B17',
        muted: '#5B625D',
        line: '#CFC7B8',
        teal: '#0B5D4F',
        'teal-soft': '#DCE7E2',
        field: '#0E1F1A',
        rust: '#9B4A2B',
        amber: '#A9741C',
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['clamp(2.9rem, 6.4vw, 6.1rem)', { lineHeight: '0.94', letterSpacing: '-0.045em' }],
        statement: ['clamp(2rem, 4vw, 3.6rem)', { lineHeight: '1.02', letterSpacing: '-0.035em' }],
        h2: ['clamp(1.75rem, 3vw, 2.75rem)', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        h3: ['clamp(1.2rem, 1.6vw, 1.5rem)', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        lede: ['clamp(1.05rem, 1.4vw, 1.25rem)', { lineHeight: '1.55' }],
        micro: ['0.68rem', { lineHeight: '1.2', letterSpacing: '0.13em' }],
      },
      transitionTimingFunction: {
        stage: 'cubic-bezier(0.16, 0.84, 0.24, 1)',
        settle: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      maxWidth: {
        frame: '90rem',
      },
    },
  },
  plugins: [],
};

export default config;
