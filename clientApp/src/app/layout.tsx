import { Inter } from "next/font/google";
import "../styles/globals.css";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { Header } from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
//import PerformanceDashboard from "@/components/performance/PerformanceDashboard";
//import OfflineStatus from "@/components/offline/OfflineStatus";

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
        <meta name="theme-color" content="#8b5cf6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Utakata" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.className} antialiased ` }>
        <ThemeProvider>
          <div className="relative flex flex-col min-h-screen">
            <div className="fixed inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 animate-gradient" />
              <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            </div>
            <div className="relative z-10 flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow container mx-auto px-4 py-8">
                {children}
              </main>
              <Footer />
            </div>
          </div>
        </ThemeProvider>
        <ServiceWorkerRegistration />
        {/*<PerformanceDashboard />*/}
        {/*<OfflineStatus />*/}
      </body>
    </html>
  );
}


