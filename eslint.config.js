import js from "@eslint/js";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";
import jsdoc from "eslint-plugin-jsdoc";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.node }
    },
    plugins: {
      jsdoc,
    },
    rules: {
      "jsdoc/no-undefined-types": 1,
    },
  },
  eslintConfigPrettier
];

