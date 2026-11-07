/**
 * 認証関連のフック！🫧
 * 中身は AuthProvider にある（ログイン状態の問い合わせを1回にまとめるため）。
 * 使い方は今までどおり：const { user, isLoading } = useAuth();
 */
export { useAuth } from "@/components/providers/AuthProvider";
