import { Inter, Merriweather } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthNav } from "@/components/NavAuth";
import Footer from "@/components/Footer";
import ScrollTopBtn from "@/components/scrollTop";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "DiplomaHub",
  description: "Where IB students never graduate alone.",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const merriweather = Merriweather({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-serif",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${merriweather.variable} h-1/1`}
      suppressHydrationWarning
    >
      <body>
        <div className="min-h-[100vh] relative flex flex-col bg-surface-container-lowest h-full notranslate">
          <Navbar
            authSlot={
              <Suspense
                fallback={
                  <div className="w-20 h-5 bg-gray-100 rounded animate-pulse" />
                }
              >
                <AuthNav />
              </Suspense>
            }
          />
          <main>{children}</main>
          <Footer />
          <ScrollTopBtn />
        </div>
      </body>
    </html>
  );
}
