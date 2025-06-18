const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

let config = getDefaultConfig(__dirname)

config = withNativeWind(config, { input: './global.css' })

// Add SVG transformer support
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer')
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg')
config.resolver.sourceExts.push('svg')

module.exports = config
