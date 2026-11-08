"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, Loader2, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoading } from "@/components/ui/Spinner";
import { FEED_SURFACE } from "@/components/features/timeline/TimelineContent";
import { showToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/auth/useAuth";
import { useBackdrop, useSetOwnBackdrop } from "@/components/providers/BackdropProvider";
import { getActorByUserId } from "@/lib/appwrite/database";
import { saveProfile } from "@/lib/appwrite/serverConfig";
import { mediaUrl } from "@/lib/utils";
import { compressImage, UPLOAD_LIMIT_BYTES } from "@/lib/media/compress";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const BIO_MAX = 500;

/** 画像をアップロードして、そのURLを返す */
async function uploadImage(original: File): Promise<string> {
  // 送る前に縮める（アイコンや背景に大きな写真をそのまま置かない）
  const file = await compressImage(original);
  if (file.size > UPLOAD_LIMIT_BYTES) throw new Error("upload failed");
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const res = await fetch("/api/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file: { bin: btoa(binary), name: file.name, type: file.type, width: 0, height: 0, blurhash: "", visibility: "public" },
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.url) throw new Error("upload failed");
  return data.url;
}

/** 選んだ画像（まだ保存していないもの）。null は「消す」、undefined は「変えない」 */
type ImageChange = { file: File; preview: string } | null | undefined;

const overlayButton =
  "flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70";

/**
 * プロフィールの編集🫧
 * 上はプロフィール画面と同じ見た目のまま、ヘッダー画像とアイコンを📷で差し替えられる。
 */
export default function ProfileSettings() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [actor, setActor] = useState<any | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<ImageChange>(undefined);
  const [header, setHeader] = useState<ImageChange>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const setOwnBackdrop = useSetOwnBackdrop();
  const avatarInput = useRef<HTMLInputElement>(null);
  const headerInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user && !isAuthLoading) window.location.href = "/login";
  }, [user, isAuthLoading]);

  useEffect(() => {
    if (!user) return;
    getActorByUserId(user.$id)
      .then((a) => {
        if (!a) return;
        setActor(a);
        setDisplayName(a.displayName || "");
        setBio(a.summary || "");
      })
      .catch(() => showToast("プロフィールを読めなかったわ💦"));
  }, [user]);

  // 選んだ画像のプレビュー用URLは、使い終わったら捨てる
  useEffect(() => () => void (avatar && URL.revokeObjectURL(avatar.preview)), [avatar]);
  useEffect(() => () => void (header && URL.revokeObjectURL(header.preview)), [header]);

  const pick = (set: (v: ImageChange) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return showToast("画像を選んでね💦");
    if (file.size > MAX_IMAGE_BYTES) return showToast("画像は10MBまでだよ💦");
    set({ file, preview: URL.createObjectURL(file) });
  };

  // 選んだ画像は、背景でもそのまま見られる（保存前のプレビュー）
  useBackdrop(header === undefined ? undefined : header?.preview ?? null);

  if (!actor) return <PageLoading />;

  const savedHeader = mediaUrl(actor.image?.url, 1280);
  const headerSrc = header === null ? "" : header?.preview ?? savedHeader;
  const avatarSrc = avatar === null ? "" : avatar?.preview ?? actor.icon?.url;
  const changed =
    displayName.trim() !== (actor.displayName || "") || bio.trim() !== (actor.summary || "") || avatar !== undefined || header !== undefined;

  const handleSave = async () => {
    if (!displayName.trim()) return showToast("表示名を入れてね💦");
    setIsSaving(true);
    try {
      const [avatarUrl, backgroundUrl] = await Promise.all([
        avatar ? uploadImage(avatar.file) : Promise.resolve(avatar),
        header ? uploadImage(header.file) : Promise.resolve(header),
      ]);
      const result = await saveProfile({ displayName, bio, avatarUrl, backgroundUrl });
      if (!result.ok) throw new Error(result.error);
      setActor((prev: any) => ({
        ...prev,
        displayName: displayName.trim(),
        summary: bio.trim(),
        icon: avatarUrl === undefined ? prev.icon : { ...prev.icon, url: avatarUrl ?? "" },
        image: backgroundUrl === undefined ? prev.image : { ...prev.image, url: backgroundUrl ?? "" },
      }));
      if (backgroundUrl !== undefined) setOwnBackdrop(backgroundUrl ?? "");
      setAvatar(undefined);
      setHeader(undefined);
      showToast("保存したわ🫧", "success");
    } catch (error: any) {
      showToast(error?.message === "upload failed" ? "画像をアップロードできなかったわ💦" : error?.message || "保存できなかったわ💦");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <PageHeader
        backHref="/settings"
        title="プロフィール"
        action={
          <button
            type="button"
            onClick={handleSave}
            disabled={!changed || isSaving}
            aria-label="保存"
            title="保存"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-40"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
          </button>
        }
      />

      <section className={FEED_SURFACE}>
        {/* ヘッダー画像（プロフィール画面と同じ 3:1） */}
        <div className="relative aspect-[3/1] w-full bg-linear-to-br from-accent via-secondary to-muted">
          {headerSrc && <img src={headerSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 flex items-center justify-center gap-3">
            <button type="button" onClick={() => headerInput.current?.click()} className={overlayButton} aria-label="ヘッダー画像を選ぶ" title="ヘッダー画像">
              <Camera className="h-5 w-5" />
            </button>
            {headerSrc && (
              <button type="button" onClick={() => setHeader(null)} className={overlayButton} aria-label="ヘッダー画像を外す" title="外す">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <input ref={headerInput} type="file" accept="image/*" onChange={pick(setHeader)} className="hidden" />
        </div>

        <div className="flex flex-col gap-4 px-4 pb-5">
          <div className="-mt-10 flex items-end">
            <div className="relative">
              <Avatar src={avatarSrc} alt={displayName} fallback={(displayName || "U").charAt(0)} size="2xl" interactive={false} className="ring-4 ring-card" />
              <button
                type="button"
                onClick={() => avatarInput.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/35 text-white opacity-90 transition-opacity hover:opacity-100"
                aria-label="アイコンを選ぶ"
                title="アイコン"
              >
                <Camera className="h-5 w-5" />
              </button>
              <input ref={avatarInput} type="file" accept="image/*" onChange={pick(setAvatar)} className="hidden" />
            </div>
          </div>

          <div>
            <label htmlFor="displayName" className="mb-1.5 block text-sm font-medium text-muted-foreground">表示名</label>
            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={100} autoComplete="nickname" />
          </div>
          <div>
            <label htmlFor="bio" className="mb-1.5 flex items-center justify-between text-sm font-medium text-muted-foreground">
              <span>自己紹介</span>
              <span className={`tabular-nums ${bio.length > BIO_MAX - 20 ? "text-destructive" : ""}`}>{BIO_MAX - bio.length}</span>
            </label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={BIO_MAX} rows={4} />
          </div>
          <p className="text-xs text-muted-foreground">@{actor.preferredUsername}</p>
        </div>
      </section>
    </div>
  );
}
