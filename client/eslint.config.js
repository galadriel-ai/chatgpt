// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    extends: ['eslint-config-expo'],
    plugins: ['import'],
    settings: {
      'import/resolver': {
        alias: {
          map: [
            ['@', './'],
            ['@env', './node_modules/react-native-dotenv']
          ],
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
        }
      }
    },
    rules: {
      'import/no-unresolved': 'off'  // Temporarily disable this rule since we're using a custom module
    }
  },
])
