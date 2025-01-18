import { defineConfig } from "vite"
import dts from "vite-plugin-dts"
import { builtinModules } from "module"

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "jsonjsdb_editor",
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        ...builtinModules,
        "chokidar",
        "read-excel-file/node",
        "write-excel-file/node",
      ],
    },
  },
  plugins: [dts()],
})
