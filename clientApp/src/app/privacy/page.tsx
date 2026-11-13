import { readFileSync } from "fs";
import { join } from "path";
import { LegalPage } from "@/components/features/legal/LegalPage";

export const metadata = { title: "プライバシーポリシー" };

/** プライバシーポリシー */
export default function PrivacyPage() {
  return <LegalPage title="プライバシーポリシー" content={readFileSync(join(process.cwd(), "src/app/privacy/privacy.md"), "utf-8")} />;
}
