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
                // Separate ReactFlow (heavy ~450KB) for Dream Board
                if (id.includes('reactflow') || id.includes('@reactflow')) {
                  return 'vendor-reactflow';
                }

                // Separate Stripe for checkout payment step
                if (id.includes('@stripe') || id.includes('stripe')) {
                  return 'vendor-stripe';
                }

                // Separate Leaflet for checkout address step (maps)
                if (id.includes('leaflet')) {
                  return 'vendor-leaflet';
                }

                // React core and related state management
                if (id.includes('react') ||
                    id.includes('react-dom') ||
                    id.includes('zustand') ||
                    id.includes('use-sync-external-store') ||
                    id.includes('@tanstack/react-query')) {
                  return 'vendor-react';
                }

                // UI libraries
                if (id.includes('lucide-react')) {
                  return 'vendor-lucide';
                }
                if (id.includes('@dnd-kit')) {
                  return 'vendor-dnd';
                }

                // Backend/API
                if (id.includes('@supabase')) {
                  return 'vendor-supabase';
                }

                return 'vendor-other';
              }

              // Admin Dashboard - separate chunk per major tab
              if (id.includes('/components/admin/')) {
                if (id.includes('AdminDreamBoard') || id.includes('dream-board')) {
                  return 'admin-dreamboard';
                }
                if (id.includes('AdminDashboard')) {
                  return 'admin-dashboard';
                }
                return 'admin-other';
              }

              // Checkout - separate chunk per step
              if (id.includes('/components/checkout/')) {
                if (id.includes('PaymentStep') || id.includes('PaymentForm')) {
                  return 'checkout-payment';
                }
                // AddressStep, MapPicker, and other checkout files share state - keep together
                return 'checkout-other';
              }

              // Product components
              if (id.includes('/components/product/')) {
                if (id.includes('ProductGrid') || id.includes('FilterSidebar') || id.includes('FilterAccordion') || id.includes('FilterContent') || id.includes('QuickAddModal') || id.includes('PriceRangeSlider')) {
                  return 'product-grid';
                }
                if (id.includes('ProductDetail')) {
                  return 'product-detail';
                }
                if (id.includes('CollectionDetail')) {
                  return 'product-collection';
                }
                return 'product-other';
              }

              // Pages
              if (id.includes('/pages/')) {
                if (id.includes('AdminPage') || id.includes('admin')) {
                  return 'pages-admin';
                }
                if (id.includes('CheckoutPage')) {
                  return 'pages-checkout';
                }
                return 'pages-other';
              }

              // Services
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
