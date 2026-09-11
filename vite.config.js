import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { laptopFanPlugin } from './laptopFanPlugin.js';

export default defineConfig({
  plugins: [react(), tailwindcss(), laptopFanPlugin()],
  server: {
    port: 5173,
    host: '0.0.0.0'
  }
});
