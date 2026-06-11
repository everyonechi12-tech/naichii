import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Naichii Bakery Shop",
  description: "Modern bakery e-commerce with TikTok Shop style experience.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
