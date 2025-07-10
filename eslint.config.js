import eslint from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['dist', 'coverage', 'node_modules'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
    plugins: {
      golden: {
        rules: {
          'no-direction-distance': (
            await import('./eslint-rules/no-direction-distance.js')
          ).default,
        },
      },
    },
    rules: {
      'golden/no-direction-distance': 'error',
    },
  }
)
