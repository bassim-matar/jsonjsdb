import terser from "@rollup/plugin-terser"
import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import { copyFileSync } from "fs"

const production = !process.env.ROLLUP_WATCH

// Plugin to copy TypeScript definitions
const copyTypes = () => ({
  name: 'copy-types',
  generateBundle() {
    copyFileSync('jsonjsdb.d.ts', 'dist/jsonjsdb.d.ts')
  }
})

export default [
  {
    input: "src/Jsonjsdb.js",
    output: [
      {
        file: `dist/jsonjsdb.min.js`,
        format: "iife",
        sourcemap: !production,
        name: "Jsonjsdb",
      },
      {
        file: `dist/jsonjsdb.esm.js`,
        format: "esm",
        sourcemap: !production,
      },
    ],
    plugins: [
      production && terser({ mangle: { properties: { regex: /^_(?!_)/ } } }),
      resolve({ browser: true }),
      commonjs(),
      copyTypes(),
    ],
  }
]