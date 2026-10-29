import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "::",
    port: 3000,
    strictPort: true,
    proxy: {
      // The staff API runs in Wrangler (`npm run dev:api`).
      "/api": "http://127.0.0.1:8787",
    },
  },
  build: {
    rollupOptions: {
      // Two entries: the consumer feed at / and the staff admin at /admin/.
      input: {
        main: "index.html",
        admin: "admin/index.html",
      },
    },
  },
});
