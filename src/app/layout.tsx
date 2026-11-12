import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import MainShell from "@/components/MainShell";
import Providers from "@/components/Providers";
import { MobileNavProvider } from "@/components/MobileNavContext";
import { SIDEBAR_INIT_SCRIPT } from "@/lib/sidebar-config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Devportal - Developer Platform Infrastructure",
  description: "Centralized management for developer infrastructure, media pipelines, and cloud services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-[#121212]`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SIDEBAR_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-[#121212] text-white flex font-sans selection:bg-zinc-700 selection:text-white">
        <MobileNavProvider>
          <Suspense
            fallback={
              <div className="fixed left-0 top-0 bottom-0 w-[220px] bg-[#0d0d0d] border-r border-zinc-800/60 z-50 hidden md:flex" />
            }
          >
            <Navbar />
          </Suspense>
          <Providers>
            <Suspense fallback={
              <main className="flex-1 min-w-0 md:ml-[220px] min-h-screen bg-[#121212] flex flex-col overflow-x-clip">
                {children}
              </main>
            }>
              <MainShell>
                {children}
              </MainShell>
            </Suspense>
          </Providers>
        </MobileNavProvider>
      </body>
    </html>
  );
}
