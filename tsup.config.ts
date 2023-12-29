import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: true,
  format: 'esm',
  clean: true,
  bundle: true,
  minify: true,
  banner: {
    js: `#! /usr/bin/env node
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import {createRequire} from 'node:module';
const __filename=fileURLToPath(import.meta.url);
const __dirname=dirname(__filename);
const require=createRequire(import.meta.url);
    `.trim(),
  },
})
