import type { Config } from 'tailwindcss';

const config: Config = {
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


