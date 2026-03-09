import type { Metadata, Viewport } from "next";
import { Noto_Sans_Hebrew } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n/context";
import "./globals.css";

const notoSansHebrew = Noto_Sans_Hebrew({
  subsets: ["hebrew", "latin"],
  variable: "--font-noto-hebrew",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "Can I Nap? | \u05D0\u05E4\u05E9\u05E8 \u05DC\u05E0\u05DE\u05E0\u05DD?",
  description:
    "Real-time nap risk calculator during the Iran-Israel war. Check if your nap will be interrupted by a rocket alert.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Can I Nap? | \u05D0\u05E4\u05E9\u05E8 \u05DC\u05E0\u05DE\u05E0\u05DD?",
    description:
      "Real-time nap risk calculator during the Iran-Israel war. Check if your nap will be interrupted by a rocket alert.",
    type: "website",
    locale: "he_IL",
    siteName: "Can I Nap?",
  },
  twitter: {
    card: "summary",
    title: "Can I Nap? | \u05D0\u05E4\u05E9\u05E8 \u05DC\u05E0\u05DE\u05E0\u05DD?",
    description:
      "Real-time nap risk calculator. Check if your nap will be interrupted by a rocket alert.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Can I Nap?",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="dark">
      <body
        className={`${notoSansHebrew.variable} font-sans bg-surface text-white min-h-screen antialiased`}
      >
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
