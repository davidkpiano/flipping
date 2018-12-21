import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import rollupReplace from 'rollup-plugin-replace';
import fileSize from 'rollup-plugin-filesize';

const createConfig = ({ input, output }) => ({
  input,
  output,
  plugins: [
    rollupReplace({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    typescript({
      clean: true,
      tsconfigOverride: {
        compilerOptions: {
          declaration: false
        }
      }
    }),
    terser(),
    fileSize()
  ]
});

export default [
  createConfig({
    input: 'src/index.ts',
    output: {
      file: 'dist/flipping.js',
      format: 'umd',
      name: 'Flipping'
    }
  })
];
