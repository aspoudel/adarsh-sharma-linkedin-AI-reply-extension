import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    web_accessible_resources: [
      {
        resources: [
          "icon/ai_icon.png",
          "icon/generate_icon.png",
          "icon/insert_icon.png",
          "icon/regenerate_icon.png",
        ],
        matches: ["<all_urls>"],
      },
    ],
  },
});
