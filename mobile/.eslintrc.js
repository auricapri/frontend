module.exports = {
  root: true,
  extends: ['@react-native'],
  plugins: ['unused-imports'],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    '@typescript-eslint/no-shadow': 'off',
    'comma-dangle': 'off',
    'curly': 'off',
    'dot-notation': 'off',
    'no-new': 'off',
    'no-trailing-spaces': 'off',
    'quotes': 'off',
    'unused-imports/no-unused-imports': 'error',
    'react-hooks/exhaustive-deps': 'off',
    'react/self-closing-comp': 'off',
  },
};
