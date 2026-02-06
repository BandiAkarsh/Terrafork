import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [tailwindcss(), sveltekit()],
    build: {
        // Green Code: Target modern browsers for smaller bundles
        target: 'esnext',
        // Green Code: Efficient minification
        minify: 'esbuild',
        cssMinify: true,

    },
    // Green Code: Optimize deps for faster dev server
    optimizeDeps: {
        include: ['@electric-sql/pglite']
    }
});
