import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://bp-insight-d8gm1oyz67190a864.service.tcloudbase.com',
        changeOrigin: true,
      },
      '/admin': {
        target: 'https://bp-insight-d8gm1oyz67190a864.service.tcloudbase.com',
        changeOrigin: true,
      },
    },
  },
})
