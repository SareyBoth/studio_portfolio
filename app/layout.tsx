import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getPortfolioData } from "@/lib/portfolio";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0b0d",
};

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getPortfolioData();
  return {
    title: `${profile.name} — ${profile.role}`,
    description: profile.subhead,
    keywords: [
      profile.name,
      "Portfolio",
      profile.location,
      "Graphic Designer",
      "Poster Design",
      "Video Editor",
      "IT Support",
    ],
    authors: [{ name: profile.name }],
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[#0a0b0d] text-[#f2efe8] selection:bg-[#d7ff3f] selection:text-black">
        {children}
      </body>
    </html>
  );
}
