module.exports = {
  'env': {
    'browser': true,
    'es2020': true,
    'node': true,
  },
  'extends': [
    'plugin:react/recommended',
    'google',
  ],
  'parserOptions': {
    'ecmaFeatures': {
      'jsx': true,
    },
    'ecmaVersion': 11,
    'sourceType': 'module',
  },
  'plugins': [
    'react',
  ],
  'rules': {
    'max-len': [0],
    'require-jsdoc': 0,
    'camelcase': 0,
    'valid-jsodc': 0,
    'no-tabs': 0,
    'guard-for-in': 0,
    'no-mixed-spaces-and-tabs': 0,
    'brace-style': 0,
    'new-cap': 0,
    'no-unused-vars': 0,
  },
};
