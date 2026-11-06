import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Slotly — Simple booking for small businesses",
    template: "%s · Slotly",
  },
  description:
    "Slotly gives independent professionals one simple place to take bookings. Share your link, avoid double bookings, and manage every appointment from one dashboard.",
  applicationName: "Slotly",
  openGraph: {
    title: "Slotly — Simple booking for small businesses",
    description:
      "Share one link. Let customers book themselves. Manage every appointment in one place.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#17243A",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <body className="min-h-dvh bg-canvas font-sans text-ink antialiased">
        {children}
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: {
              borderRadius: "12px",
              border: "1px solid #E5EAF0",
              fontFamily: "var(--font-inter), sans-serif",
            },
          }}
        />
      </body>
    </html>
  );
}
