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

export const metadata: Metadata = {
  title: {
    default: "CareMManager - Gestion de cabinet de cardiologie",
    template: "%s | CareMManager",
  },
  description: "CareMManager, spécialiste de la gestion de cabinet de cardiologie. Gérez vos patients, rendez-vous et prescriptions depuis une plateforme sécurisée.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "CareMManager - Gestion de cabinet de cardiologie",
    description: "CareMManager, spécialiste de la gestion de cabinet de cardiologie.",
    type: "website",
    locale: "fr_FR",
    siteName: "CareMManager",
  },
  icons: {
    icon: "/logo-icon.svg",
    shortcut: "/logo-icon.svg",
    apple: "/logo-icon.svg"
  },
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
