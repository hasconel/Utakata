"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ReplyToPost from "../reply/ReplyToPost";
import { Textarea } from "@/components/ui/Textarea";
import { ImagePlus, X, Loader2, Globe, Lock, SendHorizontal } from "lucide-react";

const MAX_LENGTH = 500;
import { ActivityPubImage } from "@/types/activitypub/collections";
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

    // ファイルサイズチェック（10MB制限）
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setError("ファイルサイズが大きすぎます！10MB以下にしてください💦");
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
      return { url, type: getFileType(file) };
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
  const uploadImage = async (image: File ,visibility: "public" | "followers"): Promise<ActivityPubImage> => {
    const base64ImageString = await fileToBase64(image);
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
      name: uploadedFile.name,
      width: uploadedFile.width,
      height: uploadedFile.height,
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
        ? await Promise.all(images.map(image => uploadImage(image, visibility)))
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
    setVisibility(prev => prev === "public" ? "followers" : "public");
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
