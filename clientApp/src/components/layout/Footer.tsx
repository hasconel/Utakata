import Link from "next/link";

export default function Footer() {
  return (
    <footer className=" bg-pink dark:bg-dark-purple text-purple dark:text-pink py-4 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center">
        <p className="text-sm">&copy; 2025 utakata. All rights reserved.</p>
        <nav className="flex space-x-4 mt-2 sm:mt-0" aria-label="フッターナビゲーション">
          <Link
            href="/privacy"
            className="text-sm hover:text-purple dark:hover:text-pink hover:scale-105 transition-all duration-200"
          >
            プライバシーポリシー
          </Link>
          <Link
            href="/terms"
            className="text-sm hover:text-purple dark:hover:text-pink hover:scale-105 transition-all duration-200"
          >
            利用規約
          </Link>
        </nav>
      </div>
    </footer>
  );
}