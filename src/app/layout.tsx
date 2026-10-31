import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
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
      <body className="min-h-full bg-[#121212] text-white flex flex-col font-sans selection:bg-zinc-700 selection:text-white">
        <Suspense
          fallback={
            <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-[#121212]/95 backdrop-blur h-16" />
          }
        >
          <Navbar />
        </Suspense>
        <main className="flex-1 w-full bg-[#121212] flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
