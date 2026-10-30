import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Update this to match your GitHub repository name.
  // Example: if the repository is https://github.com/yourname/uzhavan-bot-dashboard
  // use "/uzhavan-bot-dashboard/".
  base: "/uzhavan-bot-dashboard/",
  server: { host: "0.0.0.0" }
});
