import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import MetaPixel from "./_components/MetaPixel";
import ServiceWorkerRegistrar from "./_components/ServiceWorkerRegistrar";
import TourProvider from "./_components/TourProvider";
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
  title: "BlockPlan",
  description: "Your academic planner for BYU-Idaho",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TourProvider>
          {children}
        </TourProvider>
        <MetaPixel />
        <ServiceWorkerRegistrar />
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
