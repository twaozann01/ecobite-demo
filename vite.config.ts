import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' để chạy được dưới github.io/<repo>/ lẫn mở file trực tiếp.
export default defineConfig({ base: './', plugins: [react()] });
