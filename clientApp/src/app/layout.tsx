import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
//import OfflineStatus from "@/components/offline/OfflineStatus";
import { ThemeProvider } from "@/components/theme-provider";
import {Header} from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Utakata",
  description: "Utakata is a decentralized social media platform",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="Utakata is a decentralized social media platform" />
        <meta name="keywords" content="social media, decentralized, fediverse, activitypub" />
        <meta name="author" content="Utakata Team" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={process.env.NEXT_PUBLIC_DOMAIN} />
        <meta property="og:title" content="Utakata" />
        <meta property="og:description" content="Utakata is a decentralized social media platform" />
        <meta property="og:image" content={process.env.NEXT_PUBLIC_DOMAIN + "/og-image.jpg"} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={process.env.NEXT_PUBLIC_DOMAIN} />
        <meta property="twitter:title" content="Utakata" />
        <meta property="twitter:description" content="Utakata is a decentralized social media platform" />
        <meta property="twitter:image" content={process.env.NEXT_PUBLIC_DOMAIN + "/og-image.jpg"} />

        {/* PWA */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
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
      </body>
    </html>
  );
}


