import { Client, Permission, Role, Storage } from "node-appwrite";

/**
 * 公開の投稿・プロフィールに使う画像を「誰でも読める」にする🫧
 * アップロードしたときの権限に頼らず、保存するときにサーバー側でそろえる
 * （ログインしていない人や外のサーバーからも見えるように）。
 *
 * 持ち主のファイルだけを変える（他の人のファイルのURLを書かれても公開しない）。
 * 失敗しても投稿やプロフィールの保存は止めず、ログだけ残す。
 */
const ANY_READ = 'read("any")';

function fileIdOf(url: string): string | null {
  const prefix = `${process.env.NEXT_PUBLIC_DOMAIN}/files/`;
  if (!url.startsWith(prefix)) return null;
  const id = url.slice(prefix.length).split(/[?#/]/)[0];
  return /^[A-Za-z0-9._-]{1,36}$/.test(id) ? id : null;
}

function adminStorage() {
  return new Storage(
    new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT!)
      .setProject(process.env.APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!)
  );
}

export async function makeFilesPublic(urls: (string | null | undefined)[], ownerId: string): Promise<void> {
  const ids = [...new Set(urls.map((url) => (url ? fileIdOf(url) : null)).filter((id): id is string => !!id))];
  if (ids.length === 0) return;
  const storage = adminStorage();
  const bucket = process.env.APPWRITE_STORAGE_ID!;
  const owner = `"user:${ownerId}"`;
  await Promise.all(
    ids.map(async (id) => {
      try {
        const file = await storage.getFile(bucket, id);
        const permissions: string[] = file.$permissions ?? [];
        if (permissions.includes(ANY_READ)) return;
        // 持ち主（消せる人）でなければ触らない
        if (!permissions.some((p) => p.endsWith(`(${owner})`) && /^(delete|write)\(/.test(p))) return;
        const rest = permissions.filter((p) => !p.startsWith("read("));
        await storage.updateFile(bucket, id, undefined, [...rest, Permission.read(Role.any())]);
      } catch (error: any) {
        console.error("画像を公開にできなかったわ💦", id, error?.message);
      }
    })
  );
}
