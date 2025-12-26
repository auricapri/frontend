import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

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
      plugins: [react()],
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
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-lucide': ['lucide-react'],
              'vendor-supabase': ['@supabase/supabase-js'],
              'pages': [
                './src/pages/HomePage',
                './src/pages/ProductPage',
                './src/pages/CollectionPage',
                './src/pages/CheckoutPage',
                './src/pages/AdminPage',
                './src/pages/AboutPage',
                './src/pages/ReceiptPage'
              ]
            }
          }
        },
        chunkSizeWarningLimit: 1000
      }
    };
});
