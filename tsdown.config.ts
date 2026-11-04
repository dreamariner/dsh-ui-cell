import { defineConfig } from 'tsdown'

// CLI 入口（唯一产物）：add 的实现打包成 lib/cli.js，package.json 的 bin 指向它。
// 组件源码（src/*.tsx）**不打包**——它们是复制给消费者的模板，不是运行时依赖。
export default defineConfig({
  entry: { cli: 'cli/index.ts' },
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  clean: false,
  dts: false,
})
