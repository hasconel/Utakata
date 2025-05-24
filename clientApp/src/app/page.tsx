
import Link from "next/link";
import { getLoggedInUser } from "@/lib/appwrite/serverConfig";
import { redirect } from "next/navigation";
interface CTAButtonProps {
  href: string;
  text: string;
  primary?: boolean;
}

const CTAButton = ({ href, text, primary = false }: CTAButtonProps) => (
  <Link
    href={href}
    className={`px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
      primary
        ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50"
        : "bg-white/80 text-purple-600 dark:bg-gray-800/80 dark:text-purple-300 border-2 border-purple-600 dark:border-pink-500 hover:bg-purple-50 dark:hover:bg-gray-700 shadow-md hover:shadow-lg backdrop-blur-sm"
    }`}
    aria-label={text}
  >
    {text}
  </Link>
);

export default async function Home() {
  const currentUser = await getLoggedInUser().catch((err:any)=>{
    
  });
  if(currentUser){
    redirect("/timeline");
  }
  return (
    <div>
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 sm:py-24">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-slow"></div>
          <h2 className="relative text-5xl sm:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-6 animate-float">
            utakataでキミのキラキラを世界に！🌟
          </h2>
        </div>
        <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 mb-12 max-w-2xl leading-relaxed">
          短文でサクッと投稿！ActivityPubで世界中のSNSと繋がって、キミの瞬間を自由にシェア！
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <CTAButton href="/register" text="今すぐ始める！" primary />
          <CTAButton href="/login" text="ログイン" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="group p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-purple-100 dark:border-purple-900">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900 rounded-full flex items-center justify-center group-hover:animate-bounce-slow">
              <svg
                className="w-8 h-8 text-pink-500 dark:text-pink-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-4">
              瞬間を投稿
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              500文字以内で、思ったことをパッとシェア！
            </p>
          </div>
          <div className="group p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-purple-100 dark:border-purple-900">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900 rounded-full flex items-center justify-center group-hover:animate-bounce-slow">
              <svg
                className="w-8 h-8 text-pink-500 dark:text-pink-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-4">
              世界とリンク
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              ActivityPubで他のSNSと繋がる！
            </p>
          </div>
          <div className="group p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-purple-100 dark:border-purple-900">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900 rounded-full flex items-center justify-center group-hover:animate-bounce-slow">
              <svg
                className="w-8 h-8 text-pink-500 dark:text-pink-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-4">
              キミの色
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              プロフィールをカスタマイズして輝こう！
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

