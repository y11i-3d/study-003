import eslint from "@eslint/js";
import eslintPluginAstro from "eslint-plugin-astro";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([".astro/**", "dist*/**"]),
  {
    files: ["**/*.{js,mjs}"],
    extends: [eslint.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      eslintPluginReactHooks.configs.flat.recommended,
    ],
  },
  {
    files: ["**/*.astro"],
    extends: [
      eslintPluginAstro.configs.recommended,
      tseslint.configs.recommended,
      eslintPluginAstro.configs.recommended,
    ],
  },
]);
