import globals from 'globals';
import eslint from '@eslint/js';
import { configs } from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import reactPlugin from 'eslint-plugin-react';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import { flatConfigs as importConfigs } from 'eslint-plugin-import-x';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

const { configs: hooksConfigs } = eslintPluginReactHooks;

export default defineConfig(
  eslint.configs.recommended,
  ...configs.recommended,
  importConfigs.recommended,
  importConfigs.typescript,
  hooksConfigs.flat['recommended-latest'],
  {
    plugins: {
      react: reactPlugin
    },
    languageOptions: {
      globals: globals.browser
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      'react/jsx-uses-react': 0,
      'react/jsx-sort-props': 2,
      'react/react-in-jsx-scope': 0
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    files: ['webpack.config.*'],
    languageOptions: {
      globals: globals.node
    }
  },
  eslintPluginPrettier
);
