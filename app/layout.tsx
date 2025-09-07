// app/layout.tsx
import type { ReactNode } from "react";
import "./globals.css"; // if you have Tailwind/global styles
import { ThemeProvider } from "@/components/theme-provider";

export const metadata = {
  title: "ARAN Care",
  description: "ABDM-compliant HMIS",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Theme + UI style context (needed for theme-toggle, appearance-panel, etc.) */}
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
