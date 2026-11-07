"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ReplyToPost from "../reply/ReplyToPost";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { ImagePlus, X, ToggleRight, ToggleLeft, Loader2 } from "lucide-react";
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* リプライ先の投稿を表示するよ！✨ */}
      {replyToPost && isReplyDisplay && post?.note && <ReplyToPost note={post.note} />}

      <div className="space-y-8">
        {/* 投稿内容の入力エリア！✨ */}
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-purple-100 dark:border-pink-100 group">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="キラキラな投稿を書いてね！✨"
            className="active:border-none active:outline-none focus:border-none rounded-xl focus:outline-none bg-transparent focus:ring-0"
            rows={3}
            maxLength={500}
            aria-label="投稿内容"
          />
          {/* 文字数カウンター！✨ */}
          <div className="absolute bottom-0 right-0">
            <span className={`px-4 pb-2 text-xs ${content.length > 450 ? 'text-red-500' : 'text-gray-400'}`}>
              {content.length}/500
            </span>
          </div>
        </div>

        {/* エラーメッセージを表示するよ！✨ */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-200 border-2 border-red-200 dark:border-red-800 animate-bounce">
            <p className="font-bold">エラーが発生したよ！💦</p>
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* 画像プレビューエリア！✨ */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative group">
              {url.type === "image" && (
                <img
                  src={url.url}
                  alt={`プレビュー ${index + 1}`}
                  className="w-full h-40 object-cover rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-purple-100 dark:border-pink-100 group-hover:border-purple-200 dark:group-hover:border-pink-200"
                />
              )}
              {url.type === "video" && (
                <video
                  src={url.url}
                  className="w-full h-40 object-cover rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-purple-100 dark:border-pink-100 group-hover:border-purple-200 dark:group-hover:border-pink-200"
                  controls
                />
              )}
              {url.type === "audio" && (
                <audio
                  src={url.url}
                  className="w-full h-40 object-cover rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-purple-100 dark:border-pink-100 group-hover:border-purple-200 dark:group-hover:border-pink-200"
                  controls
                />
              )}
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/70 hover:scale-110 active:scale-95"
                aria-label="ファイルを削除"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ボタンエリア！✨ */}
      <div className="flex flex-row justify-between items-center gap-4">
        {/* 左側のボタン群！✨ */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={openFileDialog}
            className="flex items-center gap-2 bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-200 hover:bg-pink-200 dark:hover:bg-pink-900 transition-all duration-300 hover:scale-105 active:scale-95 rounded-xl border-2 border-pink-200 dark:border-pink-800 px-4 py-2" 
          >
            <ImagePlus className="w-5 h-5" />
            <span className="hidden sm:block">メディア追加 📸</span>
          </Button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*,video/*,audio/*"
            multiple
            className="hidden"
          />

          {/* 公開範囲の設定！✨ */}
          <button 
            type="button"
            onClick={toggleVisibility}
            className="px-4 py-2 rounded-2xl hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg bg-white dark:bg-gray-800"
            aria-label="公開範囲を切り替え"
          >
            <div className="flex items-center gap-2">
              {visibility === "public" ? (
                <ToggleRight className="w-4 h-4 text-green-500" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-orange-500" />
              )}
              <span className="hidden text-xs sm:block">
                {visibility === "public" ? "公開" : "限定"}
              </span>
            </div>
          </button>
        </div>

        {/* 右側のボタン群！✨ */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={isSubmitting || (!content.trim() && images.length === 0)}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 dark:from-pink-600 dark:via-purple-500 dark:to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:via-pink-600 hover:to-purple-700 dark:hover:from-pink-700 dark:hover:via-purple-600 dark:hover:to-pink-700 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
            aria-label={isReply ? "リプライを投稿" : "投稿する"}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                投稿中...
              </>
            ) : isReply ? (
              <>
                <span className="text-transparent bg-clip-text bg-purple-700 dark:bg-pink-300">💭</span>
                リプライ！
              </>
            ) : (
              <>
                <span className="hidden sm:block text-transparent bg-clip-text bg-purple-700 dark:bg-pink-300">✨</span>
                投稿する！
              </>
            )}
          </Button>
          
          {isReply && (
            <Button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-800 dark:text-gray-200 rounded-2xl hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg"
              aria-label="キャンセル"
            >
              キャンセル
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}