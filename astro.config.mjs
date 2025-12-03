// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), react()],

  // Configuración para permitir SSR en API routes
  output: 'server', // Server-side rendering
  adapter: node({
    mode: 'standalone'
  }),
  vite: {
    optimizeDeps: {
      include: ['prop-types', 'react-simple-maps', 'react-tooltip'],
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
  },
});
