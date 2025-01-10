import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'dungeon.ts', // Your main TypeScript file
    output: {
        file: 'dist/bundle.js',
        format: 'iife', // Immediately-invoked function expression for browsers
        name: 'DungeonGenerator', // Global variable name
        sourcemap: true // Optional: Generate source maps
    },
    plugins: [typescript()],
};