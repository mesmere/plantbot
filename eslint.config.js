import js from "@eslint/js";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.node }
    }
  },
  eslintConfigPrettier
];

