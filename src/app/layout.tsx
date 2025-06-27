import type { Metadata } from "next";
import { Outfit, Manrope } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { PlaylistProvider } from "@/contexts/PlaylistContext";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "MusicFlow",
  description: "Modern music streaming service with YouTube API and liquid glass design",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${manrope.variable} antialiased font-outfit`}
      >
        <PlayerProvider>
          <PlaylistProvider>
            {children}
          </PlaylistProvider>
        </PlayerProvider>
      </body>
    </html>
  );
}
