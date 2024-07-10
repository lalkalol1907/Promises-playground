module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ["plugin:prettier/recommended", "plugin:@typescript-eslint/recommended"],
  plugins: ["import", "prettier"],
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    "no-console": process.env.NODE_ENV === "release" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "release" ? "warn" : "off",
    "no-unused-vars": "warn",
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/camelcase": "off",
    "@typescript-eslint/no-inferrable-types": "warn",
    "@typescript-eslint/no-var-requires": "warn",
    "@typescript-eslint/no-namespace": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        args: "after-used",
      },
    ],
    "@typescript-eslint/semi": ["error"],
  },
};
