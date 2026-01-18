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
          // Force consistent React resolution
          'react': path.resolve(__dirname, 'node_modules/react'),
          'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        },
        dedupe: ['react', 'react-dom'],
      },
      build: {
        target: 'esnext',
        minify: 'esbuild',
        cssMinify: true,
        cssCodeSplit: true,
        sourcemap: false,
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              if (id.includes('node_modules')) {
                // React and all React-dependent libraries together
                if (id.includes('react') ||
                    id.includes('react-dom') ||
                    id.includes('zustand') ||
                    id.includes('use-sync-external-store') ||
                    id.includes('@dnd-kit') ||
                    id.includes('reactflow') ||
                    id.includes('@reactflow') ||
                    id.includes('@tanstack/react-query')) {
                  return 'vendor-react';
                }
                if (id.includes('lucide-react')) {
                  return 'vendor-lucide';
                }
                if (id.includes('@supabase')) {
                  return 'vendor-supabase';
                }
                return 'vendor-other';
              }

              if (id.includes('/pages/')) {
                if (id.includes('HomePage') || id.includes('ProductPage') || id.includes('CollectionPage')) {
                  return 'pages-main';
                }
                if (id.includes('AdminPage') || id.includes('admin')) {
                  return 'pages-admin';
                }
                if (id.includes('CheckoutPage')) {
                  return 'pages-checkout';
                }
                return 'pages-other';
              }

              if (id.includes('/components/admin/')) {
                return 'components-admin';
              }

              if (id.includes('/components/checkout/')) {
                return 'components-checkout';
              }

              if (id.includes('/components/product/')) {
                return 'components-product';
              }

              if (id.includes('/services/')) {
                return 'services';
              }
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
