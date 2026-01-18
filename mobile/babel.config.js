module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
    [
      'module-resolver',
      {
        root: ['./'],
        extensions: ['.web.js', '.ios.js', '.android.js', '.js', '.web.ts', '.ts', '.web.tsx', '.tsx', '.json'],
        alias: {
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
  ],
};

