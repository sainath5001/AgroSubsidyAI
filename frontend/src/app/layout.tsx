import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/Providers";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "AgroSubsidyAI | Autonomous Subsidy Distribution",
  description:
    "AI + blockchain agent that verifies farmers, tracks weather disasters, and releases subsidies instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} antialiased bg-slate-950 text-white`}
      >
        <Providers>
          <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
