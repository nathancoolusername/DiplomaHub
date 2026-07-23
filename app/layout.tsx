import { Inter, Merriweather } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthNav } from "@/components/NavAuth";
import Footer from "@/components/Footer";
import ScrollTopBtn from "@/components/scrollTop";
import { JsonLd } from "@/components/JsonLd";
import { Suspense } from "react";

const description =
  "The community platform for IB Diploma Programme students, alumni, and educators. Share resources, discuss coursework, and navigate the IB journey together.";

export const metadata: Metadata = {
  // www is the canonical domain — apex 308-redirects to it (see
  // PROJECT_CONTEXT.md's "Deployment & Google OAuth verification" section).
  // Lets Next resolve relative OG image URLs and canonical links.
  metadataBase: new URL("https://www.diplomahub.org"),
  title: {
    default: "DiplomaHub — Where IB students never graduate alone",
    // Pages that set their own `title` (e.g. "Resources") get it appended
    // automatically: "Resources | DiplomaHub".
    template: "%s | DiplomaHub",
  },
  description,
  alternates: { canonical: "/" },
  // No description set here on purpose — Next.js falls back to the
  // page-resolved `description` (root default or whatever a page's own
  // `generateMetadata`/`metadata` sets) as long as openGraph/twitter don't
  // pin their own value, which setting one here would override site-wide.
  openGraph: {
    siteName: "DiplomaHub",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "DiplomaHub",
  url: "https://www.diplomahub.org",
  description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
        <JsonLd data={websiteJsonLd} />
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
