import type { Metadata } from "next";
import "./globals.css";
import "./extra.css";

export const metadata: Metadata = {
  title: "Tampa Business Club | Member Network",
  description: "The intelligent member and event app for Tampa Business Club, powered by NetworkOS.",
  manifest: "/manifest.webmanifest",
  applicationName: "Tampa Business Club",
  appleWebApp: { capable: true, title: "Tampa Business Club", statusBarStyle: "black-translucent" },
  icons: { icon: "/app-icon.png", apple: "/app-icon.png" },
  openGraph: {
    title: "Tampa Business Club",
    description: "Meet the right people. Build relationships that move business forward.",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Tampa Business Club, powered by NetworkOS" }]
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head><meta name="theme-color" content="#0c443a" /><meta name="mobile-web-app-capable" content="yes" /></head>
      <body>{children}</body>
    </html>
  );
}
