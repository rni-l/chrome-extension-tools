/// <reference types="vitest" />

import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`,
      'package/': `${path.resolve(__dirname, 'package')}/`,
    },
  },
  plugins: [
  ],

  // https://github.com/vitest-dev/vitest
  test: {
    environment: 'jsdom',
    // reporters: ['verbose'],
    // reporters: [
    //   'html',
    // ],
    // setupFiles: './vitest.init.mjs',
    // resolve: {
    //   mainFields: ['module']
    // }
  },

  build: {
    lib: {
      entry: path.resolve(__dirname, 'package/main.ts'),
      name: 'cet',
      // the proper extensions will be added
      fileName: 'index',
    },
    rollupOptions: {
    },
  },
})
