import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import cloudflare from "@astrojs/cloudflare";

import react from "@astrojs/react";

import { execSync } from "child_process";

const BUILD_ID = execSync("git rev-parse --short HEAD").toString().trim();

// https://astro.build/config
export default defineConfig({
  site: "https://example.com",
  integrations: [mdx(), sitemap(), react()],
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  vite: {
    define: {
      __BUILD_ID__: JSON.stringify(BUILD_ID),
    },
  },
});
