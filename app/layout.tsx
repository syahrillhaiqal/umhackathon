import type { Metadata } from "next";
import { IBM_Plex_Sans, Public_Sans } from "next/font/google";
import "./globals.css";

const headingFont = Public_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GridGuard",
  description:
    "GridGuard helps PBT, Majlis Daerah, and JKR verify AI-assisted traffic incident urgency and budget decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
