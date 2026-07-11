import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SciOly Tracker",
    template: "%s | SciOly Tracker"
  },
  description: "Science Olympiad rankings, testoffs, competition results, teams, and practice analytics."
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
