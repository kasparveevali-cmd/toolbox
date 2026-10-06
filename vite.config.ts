import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "development-csp",
      apply: "serve",
      // Vite's development-only React refresh preamble is inline.
      // Keep the strict policy in every production build.
      transformIndexHtml: (html) => html.replace(/\s*<meta\s+http-equiv="Content-Security-Policy"[^>]*>/i, ""),
    },
  ],
  base: "/toolbox/",
});
