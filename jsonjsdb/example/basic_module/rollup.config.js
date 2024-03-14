import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import serve from 'rollup-plugin-serve'

export default {
  input: 'index.js',
  output: {
    file: 'bundle.js',
    format: 'iife',
    name: 'Example',
  },
  plugins: [
    resolve(),
    commonjs(),
    serve({
      open: true,
      verbose: true,
      contentBase: ['.'],
      host: 'localhost',
      port: 10001,
    }),
  ],
}
