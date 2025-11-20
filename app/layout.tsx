import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "react-hot-toast";
import { BranchProvider } from "@/context/BranchContext";

export const metadata = {
  title: "ARAN Care",
  description: "ABDM-compliant HMIS",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="t1">
      <body>
        <BranchProvider>
          {" "}
          {/* ✅ global provider lives here */}
          <ThemeProvider>
            {children}

            <Toaster
              position="bottom-center"
              gutter={8}
              toastOptions={{
                duration: 3000,
                style: {
                  width: "420px",
                  maxWidth: "95vw",
                  padding: "14px 18px",
                  fontSize: "15px",
                  fontWeight: 500,
                  borderRadius: "10px",
                  background: "var(--secondary)",
                  color: "var(--on-secondary)",
                  border: "1px solid var(--secondary)",
                  boxShadow: "0px -4px 18px rgba(0,0,0,0.18)",

                  // 🔥 START POSITION (slide up)
                  transform: "translateY(30px)",
                  opacity: 0,
                },
              }}
              containerStyle={{
                bottom: 24, // distance from bottom
              }}
              // 🔥 SLIDE-UP ANIMATION PATCH
            />
          </ThemeProvider>
        </BranchProvider>
      </body>
    </html>
  );
}
