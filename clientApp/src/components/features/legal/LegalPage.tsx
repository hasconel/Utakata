import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PageHeader } from "@/components/ui/PageHeader";

/** 利用規約・プライバシーポリシー（Markdown をそのまま読みやすく表示する） */
export function LegalPage({ title, content }: { title: string; content: string }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-6">
      <PageHeader backHref="/" title={title} />
      <article className="prose prose-neutral max-w-none rounded-3xl bg-card p-6 shadow-soft dark:prose-invert prose-headings:text-foreground prose-a:text-primary sm:p-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </div>
  );
}
