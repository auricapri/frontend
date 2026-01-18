const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: './web/index.js',
  mode: 'development',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'web-build'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  resolve: {
    extensions: ['.web.js', '.js', '.web.ts', '.ts', '.web.tsx', '.tsx', '.json'],
    alias: {
      'react-native$': 'react-native-web',
      'react-native-splash-screen': path.resolve(__dirname, 'web/mocks/splash-screen.js'),
      '@react-native-firebase/messaging': path.resolve(__dirname, 'web/mocks/firebase-messaging.js'),
      'react-native-fs': path.resolve(__dirname, 'web/mocks/react-native-fs.js'),
      'react-native-safe-area-context': path.resolve(__dirname, 'web/mocks/safe-area-context.js'),
      'react-native-reanimated': path.resolve(__dirname, 'web/mocks/react-native-reanimated.js'),
      '@': path.resolve(__dirname, '.'),
      '@/src': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/pages': path.resolve(__dirname, 'src/pages'),
      '@/hooks': path.resolve(__dirname, 'src/hooks'),
      '@/services': path.resolve(__dirname, 'src/services'),
      '@/api': path.resolve(__dirname, 'src/api'),
      '@/context': path.resolve(__dirname, 'src/context'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
      '@/types': path.resolve(__dirname, 'src/types'),
      '@/constants': path.resolve(__dirname, 'src/constants'),
      '@/i18n': path.resolve(__dirname, 'src/i18n'),
    },
    fallback: {
      "process": require.resolve("process/browser"),
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { runtime: 'automatic' }],
              '@babel/preset-typescript',
            ],
            plugins: [
              [
                'module-resolver',
                {
                  root: ['./'],
                  extensions: ['.web.js', '.ios.js', '.android.js', '.js', '.web.ts', '.ts', '.web.tsx', '.tsx', '.json'],
                  alias: {
                    'react-native$': 'react-native-web',
                    '@': './',
                    '@/src': './src',
                    '@/components': './src/components',
                    '@/pages': './src/pages',
                    '@/hooks': './src/hooks',
                    '@/services': './src/services',
                    '@/api': './src/api',
                    '@/context': './src/context',
                    '@/utils': './src/utils',
                    '@/types': './src/types',
                    '@/constants': './src/constants',
                    '@/i18n': './src/i18n',
                  },
                },
              ],
              // Don't use react-native-reanimated plugin for web
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './web/index.html',
      inject: true,
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env),
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'web-build'),
    },
    compress: true,
    port: 3001,
    hot: true,
    historyApiFallback: true,
  },
};
