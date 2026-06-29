import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/lib/i18n/client";
import { config } from "@/lib/config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cardiomanager.app";

export const metadata: Metadata = {
  title: {
    default: config.app.name,
    template: `%s | ${config.app.name}`
  },
  description: config.app.description,
  applicationName: config.app.name,
  authors: [{ name: "CardioManager" }],
  generator: "Next.js",
  keywords: [
    "cardiologie",
    "cabinet médical",
    "gestion de cabinet",
    "dossier médical",
    "rendez-vous",
    "suivi patient",
    "santé",
    "coeur"
  ],
  referrer: "origin-when-cross-origin",
  creator: "CardioManager",
  publisher: "CardioManager",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    alternateLocale: ["en_US", "ar_AR"],
    siteName: config.app.name,
    title: config.app.name,
    description: config.app.description,
    url: siteUrl,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: config.app.name
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: config.app.name,
    description: config.app.description,
    images: ["/og-image.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png"
  },
  manifest: "/site.webmanifest"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <I18nProvider>
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
