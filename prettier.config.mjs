/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
  plugins: [
    "prettier-plugin-organize-imports",
    "prettier-plugin-astro",
    "prettier-plugin-tailwindcss",
    "prettier-plugin-astro-organize-imports",
  ],
  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro",
      },
    },
  ],
  tailwindFunctions: ["clsx", "tw"],
};
export default config;
