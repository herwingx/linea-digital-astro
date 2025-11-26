// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],

  // Configuración para permitir SSR en API routes
  output: 'server', // Server-side rendering
  adapter: node({
    mode: 'standalone'
  })
});
