import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TechGALA Image Generator",
  description: "TechGALAイベント用の画像ジェネレーター",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased min-h-screen gradient-bg">
        {children}
      </body>
    </html>
  );
}
