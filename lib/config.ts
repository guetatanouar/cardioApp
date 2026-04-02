// Application configuration - loaded from environment variables
export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000"
  },

  // App Metadata
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || "CardioManager",
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Gestion de cabinet",
    version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"
  },

  // UI Configuration
  ui: {
    defaultTheme: (process.env.NEXT_PUBLIC_DEFAULT_THEME || "light") as "light" | "dark",
    defaultLanguage: (process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE || "fr") as "fr" | "en" | "ar"
  },

  // Feature Flags
  features: {
    enableDemoMode: process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true",
    enableOfflineMode: process.env.NEXT_PUBLIC_ENABLE_OFFLINE_MODE !== "false"
  }
} as const;

export type Config = typeof config;
