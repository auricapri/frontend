import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      preview: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        compression({
          algorithm: 'gzip',
          ext: '.gz',
          threshold: 1024,
        }),
        compression({
          algorithm: 'brotliCompress',
          ext: '.br',
          threshold: 1024,
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          '@/src': path.resolve(__dirname, 'src'),
          '@/components': path.resolve(__dirname, 'components'),
          '@/pages': path.resolve(__dirname, 'src/pages'),
          '@/hooks': path.resolve(__dirname, 'src/hooks'),
          '@/services': path.resolve(__dirname, 'src/services'),
          '@/api': path.resolve(__dirname, 'src/api'),
          '@/context': path.resolve(__dirname, 'src/context'),
          '@/utils': path.resolve(__dirname, 'src/utils'),
          '@/types': path.resolve(__dirname, 'src/types'),
        }
      },
      build: {
        target: 'esnext',
        minify: 'esbuild',
        cssMinify: true,
        cssCodeSplit: true,
        sourcemap: false,
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-lucide': ['lucide-react'],
              'vendor-supabase': ['@supabase/supabase-js'],
              'pages-main': [
                './src/pages/HomePage',
                './src/pages/ProductPage',
                './src/pages/CollectionPage',
              ],
              'pages-secondary': [
                './src/pages/CheckoutPage',
                './src/pages/AdminPage',
                './src/pages/AboutPage',
                './src/pages/ReceiptPage'
              ],
              'components-product': [
                './src/components/product/ProductGrid',
                './src/components/product/ProductDetail',
              ],
              'services': [
                './src/services/cache.service',
              ],
            },
            chunkFileNames: 'assets/[name]-[hash].js',
            entryFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]',
          }
        },
        chunkSizeWarningLimit: 500,
      },
      optimizeDeps: {
        include: ['react', 'react-dom', 'lucide-react'],
      },
    };
});
