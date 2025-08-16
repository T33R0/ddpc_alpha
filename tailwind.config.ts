import type { Config } from 'tailwindcss';

const config: Config = {
  // Safelist dynamic classes used by timeline event type chips
  safelist: [
    { pattern: /bg-(emerald|rose|amber|sky|cyan|violet|slate)-500\/15/ },
    { pattern: /text-(emerald|rose|amber|sky|cyan|violet|slate)-400/ },
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        fg: 'var(--fg)',
        brand: 'var(--brand)',
        card: 'var(--card)',
        muted: 'var(--muted)',
        ring: 'var(--ring)',
      },
    },
  },
};

export default config;


