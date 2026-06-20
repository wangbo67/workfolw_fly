import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// base 设为 GitHub Pages 项目子路径，使构建产物资源引用带 /workfolw_fly/ 前缀。
// dev 时 import.meta.env.BASE_URL 解析为 '/'，build 时解析为 '/workfolw_fly/'。
export default defineConfig({
  plugins: [react()],
  base: '/workfolw_fly/',
  server: {
    port: 5173,
    open: true,
  },
})
