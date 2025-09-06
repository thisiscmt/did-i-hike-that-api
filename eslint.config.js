import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default defineConfig([{
    extends: [
        eslint.configs.recommended,
        {
            files: [ "**/*.js", "**/*.cjs", "**/*.mjs" ],
            languageOptions: {
                globals: {
                    ...globals.node
                }
            }
        },
        ...tseslint.configs.recommended
    ],
    rules: {
        "@typescript-eslint/no-explicit-any": 'warn',
        "@typescript-eslint/no-unused-vars": [
            "warn",
            {
                "args": "all",
                "argsIgnorePattern": "^_",
                "caughtErrors": "all",
                "caughtErrorsIgnorePattern": "^_",
                "destructuredArrayIgnorePattern": "^_",
                "varsIgnorePattern": "^_",
                "ignoreRestSiblings": true
            }
        ]
    }
}]);
