import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Phaser는 ~1.5MB이므로 별도 청크로 분리 → 캐싱 효율 극대화
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
          react: ['react', 'react-dom']
        }
      }
    },
    // 소스맵 비활성화 (프로덕션 빌드 크기 최소화)
    sourcemap: false,
    // CSS 최소화
    cssMinify: true
  }
})
