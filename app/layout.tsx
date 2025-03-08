import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/app/lib/shadcn/utils"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});


export const metadata: Metadata = {
  title: "IBC | El Calvario",
  description: "Iglesia Bautista El Calvario",
  icons: {
    icon: {
      url: '/favicon_io/favicon-32x32.png',
      type: 'image/png',
    }
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body  className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}>{children}</body>
    </html>
  );
}
