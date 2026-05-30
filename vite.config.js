import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative base so the build works under a GitHub Pages project subpath,
  // on Vercel/Netlify, and from the local `vite preview` server alike.
  base: './',
  plugins: [tailwindcss()],
})
