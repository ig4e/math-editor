import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// `./` makes the build work at any sub-path on GitHub Pages
// (e.g. https://user.github.io/math-editor/) without manual config.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1500, // mathlive+compute-engine are chunky
  },
});
