import { Inter } from "next/font/google";
import "../styles/globals.css";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "utakata ✨",
  description: "キラキラな思いをシェアするSNS！",
};

/**
 * ルートレイアウトコンポーネント！✨
 * テーマプロバイダーを設定するよ！💖
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <div className="relative flex flex-col min-h-screen">
            <div className="fixed inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800" />
            </div>
            <div className="relative z-10">
              <Header />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}


