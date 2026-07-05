import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/lib/i18n/client";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

const title = `${config.app.name} - ${config.app.description}`;

export const metadata: Metadata = {
  title: {
    default: title,
    template: `%s | ${config.app.name}`,
  },
  description: `${config.app.name}, spécialiste de la gestion de cabinet de cardiologie. Gérez vos patients, rendez-vous et prescriptions depuis une plateforme sécurisée.`,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title,
    description: `${config.app.name}, spécialiste de la gestion de cabinet de cardiologie.`,
    type: "website",
    locale: "fr_FR",
    siteName: config.app.name,
  },
  icons: {
    icon: "/logo4.png",
    shortcut: "/logo4.png",
    apple: "/logo4.png"
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
