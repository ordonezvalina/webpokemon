import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Cambia esta URL por el dominio real del sitio antes de desplegar.
const SITE_URL = process.env.PUBLIC_SITE_URL || "https://example.com";

export default defineConfig({
  site: SITE_URL,
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/panel-secreto/")
    })
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
