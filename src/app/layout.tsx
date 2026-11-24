import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TopBar } from "@/components/shell/TopBar";
import { PwaRegister } from "@/components/shell/PwaRegister";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "STRATA — Mining & DGMS Field Mastery",
  description:
    "Interactive B.Tech Mining Engineering and DGMS statutory mastery: field theory, physics labs, equation forging, numerical workbenches and shift-crisis simulations.",
  manifest: `${BASE}/manifest.json`,
  icons: {
    icon: [{ url: `${BASE}/icon.svg`, type: "image/svg+xml" }, { url: `${BASE}/icon-192.png`, sizes: "192x192" }],
    apple: [{ url: `${BASE}/apple-touch-icon.png`, sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "STRATA", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen grid-bg">
        <TopBar />
        <main className="pb-[env(safe-area-inset-bottom)]">{children}</main>
        <PwaRegister />
      </body>
    </html>
  );
}
