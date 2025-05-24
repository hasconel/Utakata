/**
 * 利用規約ページ！✨
 * キラキラなルールをギャル仲間と共有！💖
 */
import { readFileSync } from "fs";
import { join } from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function TermsPage() {
  const termsPath = join(process.cwd(), "src/app/terms/terms.md");
  const termsContent = readFileSync(termsPath, "utf-8");

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0d2e] to-[#7e5bef] text-white p-4">
      <div className="max-w-3xl mx-auto prose prose-invert">
        <h1 className="text-4xl font-bold text-[#ff49db] text-center mb-6">
          キラキラ利用規約 ✨
        </h1>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{termsContent}</ReactMarkdown>
      </div>
    </div>
  );
}