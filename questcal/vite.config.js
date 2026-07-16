// Vite config — Vite is the dev server + bundler that runs the app.
// - @vitejs/plugin-react  : lets Vite understand JSX and enables fast refresh
// - @tailwindcss/vite     : compiles Tailwind utility classes on the fly
// - vite-plugin-singlefile: (artifact mode only) inlines ALL JS/CSS into
//   one index.html so the app can be published as a self-contained page
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    // `npm run build:artifact` runs "vite build --mode artifact"
    ...(mode === 'artifact' ? [viteSingleFile()] : []),
  ],
  server: {
    port: 5173,
    strictPort: true, // fail instead of silently picking another port
  },
}))
