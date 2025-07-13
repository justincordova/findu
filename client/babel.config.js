module.exports = function (api) {
  api.cache(true);
  let plugins = [];

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],

    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '~': './src',
            '@components': './src/components',
            '@assets': './src/assets',
          },
        },
      ],
    ],
  };
};
