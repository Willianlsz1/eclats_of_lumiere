import { defineConfig } from 'vite';

// base relativo: o build funciona tanto na raiz de um domínio (Cloudflare Pages
// futuramente) quanto em subcaminho (GitHub Pages em /Game-Teste/)
export default defineConfig({
  base: './',
});
