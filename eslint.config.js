import js from '@eslint/js';
import globals from 'globals';
export default [
  { ignores: ['node_modules/**', 'core/static/core/js/game/bootstrap.js'] },
  js.configs.recommended,
  { files: ['core/static/core/js/**/*.js'], languageOptions: { globals: globals.browser } },
  { files: ['tests/js/**/*.js'], languageOptions: { globals: globals.node } },
];
