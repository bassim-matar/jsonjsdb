import { defineConfig } from 'vitest/config'
import dts from 'vite-plugin-dts'
import { builtinModules } from 'module'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    silent: true,
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'jsonjsdb-builder',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        ...builtinModules,
        'chokidar',
        'read-excel-file/node',
        'write-excel-file/node',
      ],
    },
  },
  plugins: [
    dts({
      include: ['src/**/*'],
      exclude: ['test/**/*'],
      outDir: 'dist',
      insertTypesEntry: true,
    }),
  ],
})
