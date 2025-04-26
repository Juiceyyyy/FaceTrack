import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    visualizer({ 
      open: true,
      gzipSize: true,
      brotliSize: true 
    })
  ],
  build: {
    outDir: "dist",
    assetsInlineLimit: 4096,
    minify: "terser",
    target: "esnext", 
    sourcemap: process.env.NODE_ENV !== "production",
    rollupOptions: {
      output: {
        format: "esm",
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
          utils: ["lodash", "dayjs"]
        }
        
      }
    }
  },
  server: {
    port: 3000,
    strictPort: true,
    hmr: {
      overlay: false
    }
  },
  preview: {
    port: 3000,
    strictPort: true
  }
});