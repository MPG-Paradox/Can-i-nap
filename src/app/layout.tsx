import type { Metadata, Viewport } from "next";
import { Noto_Sans_Hebrew } from "next/font/google";
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
};

export const metadata: Metadata = {
  title: "Can I Nap? | \u05D0\u05E4\u05E9\u05E8 \u05DC\u05D9\u05E9\u05D5\u05DF?",
  description:
    "Calculate the risk of your nap being interrupted by a rocket alert during the Iran-Israel war.",
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
        {children}
      </body>
    </html>
  );
}
