// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider"; // <- add this

// Keep your font setup
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Update metadata to match ARAN HMIS
export const metadata: Metadata = {
  title: "ARAN HMIS",
  description: "ABDM-compliant HMIS - ARAN",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-theme="t1" gives a no-flicker default before ThemeProvider hydrates
    <html lang="en" data-theme="t1" className="h-full bg-gray-50">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased text-gray-900`}
      >
        {/* Wrap the app so theme toggling works everywhere, including /login */}
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
