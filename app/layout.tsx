import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NetworkOS",
  description: "Your business network, working intelligently."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
