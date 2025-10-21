import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks for third-party libraries
          if (id.includes("node_modules")) {
            // Keep React, React-DOM, and React-Router together to prevent context issues
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router")
            ) {
              return "vendor-react";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            if (id.includes("framer-motion")) {
              return "vendor-animation";
            }
            // Group other node_modules into a general vendor chunk
            return "vendor-other";
          }

          // Keep contexts with main chunk to prevent React context issues
          if (id.includes("/contexts/")) {
            return undefined; // Keep with main chunk
          }

          // Split large page components into separate chunks
          if (id.includes("/pages/Profile/BiodataView")) {
            return "page-biodata-view";
          }
          if (id.includes("/pages/SearchProfiles")) {
            return "page-search";
          }
          if (
            id.includes("/pages/Profile/BiodataCreate") ||
            id.includes("/pages/Profile/BiodataEdit")
          ) {
            return "page-biodata-edit";
          }
          if (id.includes("/pages/Admin/")) {
            return "page-admin";
          }
          if (id.includes("/pages/Profile/UserProfile")) {
            return "page-user-profile";
          }

          // Group services together
          if (id.includes("/services/")) {
            return "services";
          }

          // Group components together (except those using contexts heavily)
          if (id.includes("/components/") && !id.includes("Auth")) {
            return "components";
          }
        },
      },
    },
    // Increase chunk size warning limit since we're intentionally splitting
    chunkSizeWarningLimit: 1000,
  },
});
