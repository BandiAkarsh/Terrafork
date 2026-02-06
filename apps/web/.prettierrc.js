module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  overrides: [
    {
      files: '*.svelte',
      options: {
        svelteSortOrder: 'options-scripts-markup-styles',
        svelteStrictMode: false,
        svelteBracketNewLine: true,
        svelteIndentScriptAndStyle: 'tab',
      },
    },
  ],
};