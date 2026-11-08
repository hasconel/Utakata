"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ReplyToPost from "../reply/ReplyToPost";
import { Textarea } from "@/components/ui/Textarea";
import { ImagePlus, X, Loader2, Globe, Lock, SendHorizontal, Captions } from "lucide-react";

const MAX_LENGTH = 500;
import { ActivityPubImage } from "@/types/activitypub/collections";
import { compressImage, UPLOAD_LIMIT_BYTES } from "@/lib/media/compress";
import { ActivityPubNoteInClient } from "@/types/activitypub";

/**
 * 投稿フォームのプロパティ！✨
 * @property post {activityId: string 投稿のID, preferredUsername: string 投稿者のユーザー名, attributedTo: string 投稿者のID} - リプライ先の投稿情報（オプション）
 * @property onClose - フォームを閉じる時のコールバック（オプション）
 * @property isReplyDisplay - リプライ表示の有効/無効
 */
interface PostFormProps {
  /** note: リプライ先の投稿そのもの。渡すとフォームの上に表示する（取得はしない） */
  post?: { activityId: string; preferredUsername: string; attributedTo: string; note?: ActivityPubNoteInClient | null };
  onClose?: () => void;
  isReplyDisplay?: boolean;
  refreshTimeline?: () => void;
}

/**
 * ファイルタイプの定義！✨
 */
type FileType = "image" | "video" | "audio" | "unknown";

/**
 * プレビューURLの型定義！✨
 */
interface PreviewUrl {
  url: string;
  type: FileType;
  /** 画像の説明文（他のサーバーでは alt として使われる） */
  alt: string;
}

const ALT_MAX = 1500;
const VISIBILITY_KEY = "utakata:post-visibility";

/** 画像の縦横の大きさ（タイムラインで元の形のまま表示するため） */
async function imageSize(file: File): Promise<{ width: number; height: number }> {
  if (!file.type.startsWith("image/")) return { width: 0, height: 0 };
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return { width: 0, height: 0 };
  }
}

/**
 * 投稿フォームコンポーネント！✨
 * 新しい投稿やリプライを作成できるよ！💖
 * 画像も追加できるし、公開範囲も選べるよ！🎀
 */
export default function PostForm({ post, onClose, isReplyDisplay = true ,refreshTimeline}: PostFormProps) {
  // 投稿内容の状態！✨
  const [content, setContent] = useState(post ? `@${post.preferredUsername} ` : "");
  // 公開範囲の状態！✨
  const [visibility, setVisibility] = useState<"public" | "followers">("followers");
  // 説明文を書いている画像の番号
  const [editingAlt, setEditingAlt] = useState<number | null>(null);
  // 前回選んだ公開範囲を覚えておく
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VISIBILITY_KEY);
      if (saved === "public" || saved === "followers") setVisibility(saved);
    } catch {}
  }, []);
  // エラーメッセージの状態！✨
  const [error, setError] = useState<string | null>(null);
  // リプライ先の投稿の状態！✨
  const [replyToPost, setReplyToPost] = useState<string | null>(null);
  // 画像ファイルの状態！✨
  const [images, setImages] = useState<File[]>([]);
  // 画像プレビューのURLの状態！✨
  const [previewUrls, setPreviewUrls] = useState<PreviewUrl[]>([]);
  // 投稿中の状態！✨
  const [isSubmitting, setIsSubmitting] = useState(false);
  // リプライモードかどうか！✨
  const isReply = !!post;
  // ファイル入力の参照！✨
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * ファイルタイプを判定する関数！✨
   * @param file - 判定するファイル
   * @returns ファイルタイプ
   */
  const getFileType = (file: File): FileType => {
    if (file.type.includes("video")) return "video";
    if (file.type.includes("image")) return "image";
    if (file.type.includes("audio")) return "audio";
    return "unknown";
  };

  /**
   * リプライ先の投稿を取得するよ！✨
   * 投稿IDがある時だけ実行するよ！💖
   */
  useEffect(() => {
    if (!post?.activityId) return;
    setReplyToPost(post.activityId);
  }, [post?.activityId]);

  /**
   * 画像を選択した時の処理！✨
   * プレビュー用のURLを生成するよ！💖
   * @param e - ファイル選択イベント
   */
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 大きさのチェック：写真は送る前に縮めるので20MBまで、動画・音声は縮められないので3MBまで
    const tooLarge = files.find((file) =>
      file.type.startsWith("image/") && file.type !== "image/gif" ? file.size > 20 * 1024 * 1024 : file.size > UPLOAD_LIMIT_BYTES
    );
    if (tooLarge) {
      setError(tooLarge.type.startsWith("image/") ? "画像は20MBまでだよ💦" : "動画・音声・GIFは3MBまでだよ💦");
      return;
    }

    // ファイルタイプチェック
    const validFiles = files.filter(file => {
      const fileType = getFileType(file);
      if (fileType === "unknown") {
        setError("サポートされていないファイル形式です！💦");
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setImages(validFiles);
    
    const urls: PreviewUrl[] = validFiles.map(file => {
      const url = URL.createObjectURL(file);
      return { url, type: getFileType(file), alt: "" };
    });
    
    setPreviewUrls(urls);
    setError(null); // エラーをクリア
  }, []);

  /**
   * 画像を削除する時の処理！✨
   * プレビュー用のURLも解放するよ！💖
   * @param index - 削除する画像のインデックス
   */
  const handleRemoveImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previewUrls[index].url);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setEditingAlt(null);
  }, [previewUrls]);

  /**
   * ファイルをBase64に変換する関数！✨
   * @param file - 変換するファイル
   * @returns Base64文字列
   */
  const fileToBase64 = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64");
  };

  /**
   * 画像をアップロードする関数！✨
   * @param image - アップロードする画像ファイル
   * @returns アップロードされた画像情報
   */
  const uploadImage = async (original: File, visibility: "public" | "followers", alt: string): Promise<ActivityPubImage> => {
    // 写真は送る前に縮める（速くなるし、大きな写真でも送れる）
    const image = await compressImage(original);
    if (image.size > UPLOAD_LIMIT_BYTES) {
      throw new Error(image.type.startsWith("image/") ? "画像が大きすぎるわ💦" : "動画・音声は3MBまでだよ💦");
    }
    const [base64ImageString, size] = await Promise.all([fileToBase64(image), imageSize(image)]);
    //console.log("visibility", visibility);
    const response = await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file: {
          bin: base64ImageString,
          name: image.name,
          type: image.type,
          width: 0,
          height: 0,
          blurhash: "",
          visibility: visibility,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`画像のアップロードに失敗しました: ${response.statusText}`);
    }

    const uploadedFile = await response.json();
    return {
      type: uploadedFile.type,
      mediaType: uploadedFile.mediaType,
      url: uploadedFile.url,
      name: alt.trim().slice(0, ALT_MAX),
      width: size.width,
      height: size.height,
      blurhash: uploadedFile.blurhash,
    };
  };

  /**
   * 投稿を送信する処理！✨
   * 画像をBase64に変換して送信するよ！💖
   * @param e - フォーム送信イベント
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (!content.trim() && images.length === 0) {
      setError("投稿内容を入力してください💦");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 画像をアップロードするよ！✨
      const imageData = images.length > 0 
        ? await Promise.all(images.map((image, i) => uploadImage(image, visibility, previewUrls[i]?.alt ?? "")))
        : [];

      // 投稿を送信するよ！✨
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          visibility,
          images: imageData,
          inReplyTo: isReply ? {id: post.activityId, to: post.attributedTo} : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        //console.log(errorData);
        throw new Error(errorData.error || `${isReply ? "リプライ" : "投稿"}に失敗しました💦`);
      }

      // フォームをリセットするよ！✨
      setContent(isReply ? `@${post.preferredUsername} ` : "");
      setImages([]);
      setPreviewUrls([]);
      setEditingAlt(null);
      setError(null);

      if (isReply && onClose) {
        refreshTimeline && refreshTimeline();        
        onClose();
      } else {
        // タイムラインを更新するよ！💖
        refreshTimeline && refreshTimeline();
      }
    } catch (err: any) {
      console.error("投稿エラー:", err);
      setError(err.message || `${isReply ? "リプライ" : "投稿"}に失敗しました💦`);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 公開範囲を切り替える関数！✨
   */
  const toggleVisibility = useCallback(() => {
    setVisibility((prev) => {
      const next = prev === "public" ? "followers" : "public";
      try {
        localStorage.setItem(VISIBILITY_KEY, next);
      } catch {}
      return next;
    });
  }, []);

  /**
   * ファイル選択ダイアログを開く関数！✨
   */
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 本文の高さを内容に合わせて伸ばす
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  }, [content]);

  const canSubmit = !isSubmitting && (content.trim().length > 0 || images.length > 0);
  const isPublic = visibility === "public";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {/* リプライ先の投稿 */}
      {replyToPost && isReplyDisplay && post?.note && <ReplyToPost note={post.note} />}

      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          // Ctrl / ⌘ + Enter で送信
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && canSubmit) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder={isReply ? "" : "キラキラな投稿を書いてね！✨"}
        className="min-h-[72px] resize-none border-none bg-transparent px-1 py-1 text-[15px] leading-relaxed shadow-none focus-visible:ring-0"
        rows={2}
        maxLength={MAX_LENGTH}
        aria-label={isReply ? "リプライの内容" : "投稿の内容"}
        aria-describedby={error ? "post-form-error" : undefined}
      />

      {/* 選んだファイルのプレビュー */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {previewUrls.map((url, index) => (
            <div key={url.url} className="relative overflow-hidden rounded-xl border border-border bg-muted">
              {url.type === "image" && <img src={url.url} alt="" className="h-36 w-full object-cover" />}
              {url.type === "video" && <video src={url.url} className="h-36 w-full object-cover" controls />}
              {url.type === "audio" && <audio src={url.url} className="w-full p-2" controls />}
              {url.type === "image" && (
                <button
                  type="button"
                  onClick={() => setEditingAlt(editingAlt === index ? null : index)}
                  className={`absolute left-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full text-white transition-colors ${
                    url.alt ? "bg-primary" : "bg-black/55 hover:bg-black/75"
                  }`}
                  aria-label={url.alt ? "画像の説明を直す" : "画像の説明を書く"}
                  aria-pressed={editingAlt === index}
                  title="説明"
                >
                  <Captions className="h-4 w-4" />
                </button>
              )}
              {editingAlt === index && (
                <textarea
                  autoFocus
                  value={url.alt}
                  maxLength={ALT_MAX}
                  onChange={(e) => {
                    const alt = e.target.value;
                    setPreviewUrls((prev) => prev.map((p, i) => (i === index ? { ...p, alt } : p)));
                  }}
                  onKeyDown={(e) => {
                    // Esc は説明文を閉じるだけ（モーダルは閉じない）
                    if (e.key !== "Escape") return;
                    e.stopPropagation();
                    setEditingAlt(null);
                  }}
                  aria-label="画像の説明"
                  rows={3}
                  className="absolute inset-x-1.5 bottom-1.5 resize-none rounded-lg bg-black/70 p-2 text-xs text-white backdrop-blur-sm placeholder:text-white/60 focus:outline-none"
                />
              )}
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75"
                aria-label="このファイルを外す"
                title="外す"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p id="post-form-error" role="alert" className="px-1 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center gap-1 border-t border-border pt-2">
        <button
          type="button"
          onClick={openFileDialog}
          className={iconButton}
          aria-label="画像・動画・音声を添付"
          title="添付"
        >
          <ImagePlus className="h-5 w-5" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*,video/*,audio/*"
          multiple
          className="hidden"
        />
        <button
          type="button"
          onClick={toggleVisibility}
          className={`${iconButton} ${isPublic ? "text-primary" : ""}`}
          aria-label={isPublic ? "公開（押すとフォロワー限定にする）" : "フォロワー限定（押すと公開にする）"}
          title={isPublic ? "公開" : "フォロワー限定"}
        >
          {isPublic ? <Globe className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
        </button>

        <div className="ml-auto flex items-center gap-3">
          <CharacterRing length={content.length} max={MAX_LENGTH} />
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-[background-color,transform] hover:bg-primary-hover active:scale-[0.94] disabled:opacity-40 disabled:pointer-events-none"
            aria-label={isReply ? "リプライを送る" : "投稿する"}
            title={isReply ? "リプライ（Ctrl + Enter）" : "投稿（Ctrl + Enter）"}
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizontal className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </form>
  );
}

const iconButton =
  "flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground";

/** 文字数の輪。残りが少なくなったら数字を出し、超えそうになると赤くなる */
function CharacterRing({ length, max }: { length: number; max: number }) {
  if (length === 0) return null;
  const remaining = max - length;
  const ratio = Math.min(1, length / max);
  const near = remaining <= 50;
  const size = near ? 26 : 20;
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 26, height: 26 }} aria-label={`残り${remaining}文字`} role="img">
      <svg width={size} height={size} className="-rotate-90 transition-all">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={2.5} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={remaining <= 20 ? "var(--destructive)" : "var(--primary)"}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
        />
      </svg>
      {near && (
        <span className={`absolute text-[10px] tabular-nums ${remaining <= 20 ? "text-destructive" : "text-muted-foreground"}`}>
          {remaining}
        </span>
      )}
    </div>
  );
}
