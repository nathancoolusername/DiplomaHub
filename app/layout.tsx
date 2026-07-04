import { Inter, Merriweather } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollTopBtn from "@/components/scrollTop";

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
    <html lang="en" className={`${inter.variable} ${merriweather.variable} h-1/1`}>
      <body>
        <div  className="min-h-[100vh] relative flex flex-col bg-surface-container-lowest h-full">
        <Navbar />
        <main>{children}</main>
        <Footer />
        <ScrollTopBtn/>
        </div>
      </body>
    </html>
  );
}