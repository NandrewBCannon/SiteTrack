import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/components/AuthProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  applicationName: "SiteTrack",
  title: {
    default: "SiteTrack",
    template: "%s | SiteTrack"
  },
  description: "Job-site asset tracking for installed, moved, removed, replaced, and damaged items.",
  manifest: "/manifest.webmanifest",
  authors: [{ name: "SiteTrack" }],
  creator: "SiteTrack",
  openGraph: {
    title: "SiteTrack",
    description: "Job-site asset tracking for installed, moved, removed, replaced, and damaged items.",
    siteName: "SiteTrack",
    type: "website",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "SiteTrack app icon" }]
  },
  appleWebApp: {
    capable: true,
    title: "SiteTrack",
    statusBarStyle: "black-translucent"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#17202A"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegister />
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
