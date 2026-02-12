import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./__tests__/setup.ts'],
        include: ['__tests__/unit/**/*.test.ts', '__tests__/unit/**/*.test.tsx'],
        coverage: {
            provider: 'v8',
            include: [
                'state/spreadsheet-context.tsx',
                'lib/formula-engine.ts',
                'types/spreadsheet.ts',
            ],
        },
    },
});
