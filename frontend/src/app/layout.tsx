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
    "AI-powered blockchain agent that verifies farmers, detects natural disasters, and distributes subsidies instantly. No corruption. No waiting. Just automated relief when farmers need it most.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
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
