import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import MainShell from "@/components/MainShell";
import Providers from "@/components/Providers";
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-[#121212]`}
    >
      <body className="min-h-screen bg-[#121212] text-white flex font-sans selection:bg-zinc-700 selection:text-white">
        <Suspense
          fallback={
            <div className="fixed left-0 top-0 bottom-0 w-[220px] bg-[#0d0d0d] border-r border-zinc-800/60 z-40" />
          }
        >
          <Navbar />
        </Suspense>
        <Providers>
          <Suspense fallback={
            <main className="flex-1 ml-[220px] min-h-screen bg-[#121212] flex flex-col overflow-x-hidden">
              {children}
            </main>
          }>
            <MainShell>
              {children}
            </MainShell>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
