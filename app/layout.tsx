// app/layout.tsx
import type { ReactNode } from "react";
import "./globals.css"; // if you have Tailwind/global styles
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "react-hot-toast";

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
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "green",
                color: "#111",
                border: "1px solid #e5e7eb",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              },
              success: {
                iconTheme: { primary: "#10b981", secondary: "#fff" },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
