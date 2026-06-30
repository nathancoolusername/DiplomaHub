import { Inter, Merriweather } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "IBPeople",
  description: "By IB People, For IB People",
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


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${merriweather.variable}`}>
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}