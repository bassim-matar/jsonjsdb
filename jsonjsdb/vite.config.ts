import { defineConfig } from "vitest/config"
import dts from "vite-plugin-dts"

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: "playwright",
      instances: [{ browser: "chromium", headless: true }],
      screenshotFailures: false,
    },
  },
  plugins: [dts()],
  build: {
    minify: "terser",
    lib: {
      entry: "./src/Jsonjsdb.ts",
      name: "Jsonjsdb",
      formats: ["es", "iife"],
      fileName: format => {
        if (format === "iife") return "jsonjsdb.min.js"
        return "jsonjsdb.esm.js" // format === "es"
      },
    },
    rollupOptions: {
      external: ["crypto-js", "localdata"],
      output: {
        globals: {
          "crypto-js": "CryptoJS",
          localdata: "localdata",
        },
      },
    },
  },
})
