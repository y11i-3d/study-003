// @ts-check
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));
const repository = pkg.repository || "";

const [userName, repoName] = repository.replace("github:", "").split("/");
const id = repoName.split("-").pop() || "";
const keywords = pkg.keywords || [];
// @ts-ignore
const displayKeywords = keywords.map((k) => {
  return k.charAt(0).toUpperCase() + k.slice(1);
});
const title = `${id}: ${displayKeywords.join(", ")}`;

export default defineConfig({
  site: `https://${userName}.github.io`,
  base: `/${repoName}`,

  devToolbar: {
    enabled: false,
  },

  server: {
    host: true,
  },

  vite: {
    plugins: [tailwindcss()],
    define: {
      "import.meta.env.USER_NAME": JSON.stringify(userName),
      "import.meta.env.REPO_NAME": JSON.stringify(repoName),
      "import.meta.env.ID": JSON.stringify(id),
      "import.meta.env.KEYWORDS": JSON.stringify(keywords),
      "import.meta.env.TITLE": JSON.stringify(title),
      "import.meta.env.DESCRIPTION": JSON.stringify(pkg.description),
    },
  },

  integrations: [react()],

  experimental: {
    fonts: [
      {
        provider: fontProviders.google(),
        name: "Roboto Condensed",
        cssVariable: "--font-sans",
      },
    ],
  },
});
