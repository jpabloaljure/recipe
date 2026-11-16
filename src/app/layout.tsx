import type { Metadata, Viewport } from "next";
import { pageTitle } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: pageTitle(),
  description: "Short cooking videos, each with an easy recipe.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
