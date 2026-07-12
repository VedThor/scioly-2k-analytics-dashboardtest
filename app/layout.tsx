import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SciOly Tracker",
    template: "%s | SciOly Tracker"
  },
  description: "The team workspace for Tompkins Science Olympiad — rosters, results, testoffs, practice, and resources."
};

export const viewport: Viewport = {
  themeColor: "#f3f6f3",
  colorScheme: "light"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
