import "./globals.css";
import { Inter } from "next/font/google";
import Header from "./header";
import api from "@/feature/api";
import { Footer } from "./footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Utakata",
  description: "12時間で投稿が消えるSNS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
