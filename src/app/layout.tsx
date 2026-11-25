import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TopBar, BottomNav } from "@/components/shell/TopBar";
import { PwaRegister } from "@/components/shell/PwaRegister";
import { ClientEffects } from "@/components/shell/ClientEffects";
import { AppToaster } from "@/components/shell/AppToaster";
import { InspectorKit } from "@/components/shell/InspectorKit";
import { Providers } from "@/components/shell/Providers";
import { SvgDefs } from "@/components/sim/defs";
import { THEME_BOOT } from "@/lib/prefs";

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
  themeColor: "#0B0F19",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen studio-bg" suppressHydrationWarning>
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <Providers>
        <SvgDefs />
        <TopBar />
        <main>{children}</main>
        <BottomNav />
        <PwaRegister />
        <ClientEffects />
        <InspectorKit />
          <AppToaster />
        </Providers>
      </body>
    </html>
  );
}
