import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2F5D50',
          light: '#8FB8A8',
          lighter: '#B8D4C8',
        },
        accent: '#D9D3C8',
      },
    },
  },
  plugins: [],
};

export default config;
