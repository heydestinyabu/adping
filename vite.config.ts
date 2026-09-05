import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  publicDir: path.resolve(__dirname, "public"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@xyflow")) return "vendor-flow";
            if (id.includes("chart.js") || id.includes("react-chartjs-2")) return "vendor-charts";
            if (id.includes("lucide-react") || id.includes("react-icons")) return "vendor-icons";
            if (id.includes("@radix-ui") || id.includes("framer-motion")) return "vendor-ui";
            if (id.includes("react") || id.includes("wouter") || id.includes("@tanstack")) return "vendor-core";
          }
        },
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-dom/client", "react-day-picker"],
  },
});
