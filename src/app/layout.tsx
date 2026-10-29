import type { Metadata, Viewport } from "next";
import {
  Fraunces,
  IBM_Plex_Sans_Arabic,
  Plus_Jakarta_Sans,
} from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { AppProvider } from "@/components/providers/app-provider";
import { AppShell } from "@/components/shell/app-shell";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://darna.example"),
  title: {
    default: "Daarik · A taste of home, wherever you are",
    template: "%s · Daarik",
  },
  description:
    "Daarik is a marketplace for homemade Arabic food, cooked by neighbours in your city. Order directly from home cooks and pick up a taste of home.",
  applicationName: "Daarik",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Daarik",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Daarik · A taste of home, wherever you are",
    description:
      "Homemade Arabic food from home cooks in your city. Pre-order, pick up, enjoy.",
    type: "website",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF6EF" },
    { media: "(prefers-color-scheme: dark)", color: "#FAF6EF" },
  ],
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="nl"
      dir="ltr"
      className={`${jakarta.variable} ${fraunces.variable} ${arabic.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        <QueryProvider>
          <AppProvider>
            <AppShell>{children}</AppShell>
          </AppProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
