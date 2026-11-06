import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // markdown 家族用 DOMParser（KaTeX 渲染路径），故测试环境要 DOM。
    environment: 'jsdom',
  },
})
