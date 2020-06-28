import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import rollupReplace from 'rollup-plugin-replace';
import fileSize from 'rollup-plugin-filesize';
import cleanup from 'rollup-plugin-cleanup';

const createConfig = ({ input, output }) => ({
  input,
  output,
  plugins: [
    rollupReplace({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    typescript({
      clean: true,
      tsconfigOverride: {
        compilerOptions: {
          declaration: false,
        },
      },
    }),
    terser(),

    fileSize(),
  ],
});

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/flipping.js',
    format: 'umd',
    name: 'Flipping',
  },
  plugins: [
    typescript({
      clean: true,
      tsconfigOverride: {
        compilerOptions: {
          declaration: false,
        },
        external: ['tslib'],
      },
    }),
    terser(),
    cleanup({
      comments: 'none',
    }),
    fileSize(),
  ],
};
