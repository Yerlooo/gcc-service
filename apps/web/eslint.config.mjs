import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default [
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      // The project serves optimised assets from /public; <Image> is not used
      // for the local SVG illustrations.
      '@next/next/no-img-element': 'off',
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
];
