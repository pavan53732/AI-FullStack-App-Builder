import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI App Builder Studio - Build Apps with AI",
  description: "AI-powered full-stack app builder. Describe your app idea, AI generates complete code, preview in real-time, and export as Android APK/PWA.",
  keywords: ["AI", "App Builder", "Next.js", "Android", "PWA", "React", "Code Generation"],
  authors: [{ name: "AI App Builder" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "AI App Builder Studio",
    description: "Build mobile apps with AI - No coding required",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
