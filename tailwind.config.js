/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontSize: {
        '2xs': '0.625rem', // 10px
        '3xs': '0.6875rem', // 11px
      },
    },
  },
  plugins: [],
}
