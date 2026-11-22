import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: [
      'dist/**/*',
      'dev-dist/**/*',
      '.backups/**/*',
      'node_modules/**/*',
      'android/**/*',
      'src/assets/**/*',
    ],
  },
  firebaseRulesPlugin.configs['flat/recommended'],
];
