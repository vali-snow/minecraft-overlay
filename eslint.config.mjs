import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["extension/**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions:
    {
      globals: {
        ...globals.browser,
        chrome: "readonly"
      }
    }
  },
  {
    files: ["extension/**/*.js"],
    languageOptions:
    {
      sourceType: "script"
    }
  },
]);
