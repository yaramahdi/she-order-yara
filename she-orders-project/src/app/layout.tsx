import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "She Orders",
  description: "لوحة تنظيم طلبيات شي إن",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}