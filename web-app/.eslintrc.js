// yarn add -D eslint prettier typescript eslint-config-airbnb-typescript-prettier
/** @type {import('eslint').Linter.Config} */
const config = {
  // https://github.com/toshi-toma/eslint-config-airbnb-typescript-prettier https://github.com/airbnb/javascript
  extends: ['near', 'airbnb-typescript-prettier'],

  overrides: [
    {
      files: ['{index,_app,[0-9]+,\\[*\\]}.{js,jsx,ts,tsx}', '**/api/**/*.ts'],
      rules: {
        'canonical/filename-match-exported': ['off'],
      },
    },
  ],

  // https://eslint.org/docs/user-guide/configuring#report-unused-eslint-disable-comments
  reportUnusedDisableDirectives: true,
  rules: {
    '@typescript-eslint/no-use-before-define': ['error'],

    // Add rules that allow Prettier and ESLint to work together without conflicts (https://stackoverflow.com/a/64166241/):
    indent: ['error', 2, { SwitchCase: 1 }],

    'max-len': [
      'warn',
      {
        code: 180,
        comments: 180,
        ignoreComments: false,
        ignoreRegExpLiterals: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreTrailingComments: true,
        ignoreUrls: true,
        tabWidth: 2,
      },
    ],

    // https://eslint.org/docs/rules/max-lines
    'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],

    // https://eslint.org/docs/rules/max-lines-per-function
    'max-lines-per-function': ['error', { max: 30, skipBlankLines: true, skipComments: true }],

    // Console logging is super helpful for development, and we can have our build process strip out all of those statements for production.
    'no-console': 'off',

    'no-else-return': 'off',

    'no-tabs': ['error', { allowIndentationTabs: true }],

    // We must disable the base rule (since it can report incorrect errors) and replace it (https://stackoverflow.com/a/64024916/)
    'no-use-before-define': 'off',

    'react/function-component-definition': 'off',
    'react/jsx-filename-extension': ['warn', { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
    'react/react-in-jsx-scope': 'off',
  },
  // REMEMBER TO RESTART `yarn dev` or `npm run watch` WHENEVER EDITING THESE RULES!
};

module.exports = config;
