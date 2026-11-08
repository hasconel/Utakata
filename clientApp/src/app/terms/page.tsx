import { readFileSync } from "fs";
import { join } from "path";
import { LegalPage } from "@/components/features/legal/LegalPage";

export const metadata = { title: "利用規約" };

/** みんなで気持ちよく使うためのルール✨ */
export default function TermsPage() {
  return <LegalPage title="利用規約 ✨" content={readFileSync(join(process.cwd(), "src/app/terms/terms.md"), "utf-8")} />;
}
