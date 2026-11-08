import { PageLoading } from "@/components/ui/Spinner";

/** サーバー側の準備（ログイン確認など）が終わるまでの間に出す */
export default function Loading() {
  return <PageLoading />;
}
