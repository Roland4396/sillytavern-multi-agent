import * as esbuild from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  outfile: 'dist/index.js',
  // 替换 Node.js 内置模块
  alias: {
    'node:async_hooks': resolve(__dirname, 'src/polyfills/async-hooks.ts'),
  },
  // 排除大型依赖，让它们从 CDN 加载
  external: [],
  // 压缩
  minify: true,
  sourcemap: true,
  // 目标浏览器
  target: ['es2020'],
  // 定义环境变量
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});

console.log('Build complete!');
