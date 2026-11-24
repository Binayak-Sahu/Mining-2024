import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TopBar } from "@/components/shell/TopBar";

export const metadata: Metadata = {
  title: "STRATA — Mining & DGMS Field Mastery",
  description:
    "Interactive B.Tech Mining Engineering and DGMS statutory mastery: field theory, physics labs, equation forging, numerical workbenches and shift-crisis simulations.",
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen grid-bg">
        <TopBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
