import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#D4A017",
};

export const metadata: Metadata = {
  title: "ShearFRAC - Photos",
  description: "Professional photo management for oil and gas field operations",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ShearFRAC",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "ShearFRAC - Field Photo Organizer",
    description: "Professional photo management for oil and gas field operations",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ShearFRAC - Field Photo Organizer",
    description: "Professional photo management for oil and gas field operations",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a href="#main-content" className="skip-link">Skip to content</a>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <ServiceWorkerRegister />
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
