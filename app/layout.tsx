import type { Metadata } from "next";
import localFont from "next/font/local";

import { BackToTopButton } from "@/components/back-to-top-button";
import { MobileDock } from "@/components/mobile-dock";
import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeControls } from "@/components/theme-controls";
import { createDefaultMetadata } from "@/lib/seo";

import "./globals.css";

const bodyFont = localFont({
  src: [
    { path: "../public/fonts/DMSans-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/DMSans-Medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/DMSans-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});

const displayFont = localFont({
  src: [
    { path: "../public/fonts/Datatype-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/Datatype-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/Datatype-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = createDefaultMetadata();

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body className="min-h-screen">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="w-full flex-1 px-3 py-5 pb-32 sm:px-5 lg:px-6 lg:pb-10">{children}</main>
            <SiteFooter />
          </div>
          <BackToTopButton />
          <ThemeControls />
          <MobileDock />
        </Providers>
      </body>
    </html>
  );
}
