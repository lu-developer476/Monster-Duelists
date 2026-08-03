import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['tests/js/**/*.test.js'], coverage: { provider: 'v8', include: ['core/static/core/js/game/{cards,rules,persistence}.js'], reporter: ['text', 'json-summary'] } } });
