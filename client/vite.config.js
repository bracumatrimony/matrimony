import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";


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
          
          if (id.includes("node_modules")) {
            
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
            
            return "vendor-other";
          }

          
          if (id.includes("/contexts/")) {
            return undefined; 
          }

          
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

          
          if (id.includes("/services/")) {
            return "services";
          }

          
          if (id.includes("/components/") && !id.includes("Auth")) {
            return "components";
          }
        },
      },
    },
    
    chunkSizeWarningLimit: 1000,
  },
});
