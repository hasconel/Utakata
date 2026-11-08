import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
//import OfflineStatus from "@/components/offline/OfflineStatus";
import { ThemeProvider } from "@/components/theme-provider";
import { Header, BottomNav } from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/Toast";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { BackdropProvider } from "@/components/providers/BackdropProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const DESCRIPTION = "Utakata is a decentralized social media platform";

/**
 * ページの情報。各ページは generateMetadata で title / description / 画像を上書きする
 * （「%s | Utakata」の形になる）。
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000"),
  title: { default: "Utakata", template: "%s | Utakata" },
  description: DESCRIPTION,
  keywords: ["social media", "decentralized", "fediverse", "activitypub"],
  manifest: "/manifest.json",
  openGraph: { type: "website", siteName: "Utakata", title: "Utakata", description: DESCRIPTION, images: ["/og-image.jpg"] },
  twitter: { card: "summary_large_image", title: "Utakata", description: DESCRIPTION, images: ["/og-image.jpg"] },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#5bbad5" }],
  },
  other: { "msapplication-TileColor": "#da532c" },
};

/** ブラウザ上部のバーの色。画面の背景色（globals.css の --background）に合わせる */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#151019" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={inter.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
        <AuthProvider>
        <BackdropProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="container mx-auto flex-grow px-4 py-4 sm:py-6">
            {children}
          </main>
          <Footer />
          <BottomNav />
        </div>
        <Toaster />
        </BackdropProvider>
        </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


