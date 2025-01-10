import jsdoc from 'eslint-plugin-jsdoc';

export default [
  {
    files: ['C:/proj/scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        window: true,
        document: true,
      },
    },
    plugins: {
      jsdoc,
    },
    rules: {
      'jsdoc/check-alignment': 'warn',
      'jsdoc/check-indentation': 'warn',
      'jsdoc/require-jsdoc': [
        'warn',
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: true,
            FunctionExpression: true,
          },
        },
      ],
    },
  },
];