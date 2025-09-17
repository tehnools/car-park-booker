export default {
  trailingComma: "es5",
  tabWidth: 2,
  semi: true,
  arrowParens: "always",
  printWidth: 100,
  overrides: [
    {
      files: ["*.jsonc", ".eslintrc", "tsconfig*.json"],
      options: {
        trailingComma: "none",
      },
    },
  ],
};
