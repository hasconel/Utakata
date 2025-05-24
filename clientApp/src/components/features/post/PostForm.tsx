"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/ui/Alert";
import ReplyToPost from "./ReplyToPost";
import { Post } from "@/lib/appwrite/posts";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ImagePlus, X } from "lucide-react";
import { fetchReplyToPost } from "@/lib/appwrite/client";

/**
 * 投稿フォームのプロパティ！✨
 * @property post - リプライ先の投稿情報（オプション）
 * @property onClose - フォームを閉じる時のコールバック（オプション）
 */
interface PostFormProps {
  post?: { activityId: string; username: string };
  onClose?: () => void;
}

/**
 * 投稿フォームコンポーネント！✨
 * 新しい投稿やリプライを作成できるよ！💖
 * 画像も追加できるし、公開範囲も選べるよ！🎀
 */
export default function PostForm({ post, onClose }: PostFormProps) {
  // 投稿内容の状態！✨
  const [content, setContent] = useState(post ? `@${post.username} ` : "");
  // 公開範囲の状態！✨
  const [visibility, setVisibility] = useState<"public" | "followers">("followers");
  // エラーメッセージの状態！✨
  const [error, setError] = useState<string | null>(null);
  // リプライ先の投稿の状態！✨
  const [replyToPost, setReplyToPost] = useState<Post | null>(null);
  // 画像ファイルの状態！✨
  const [images, setImages] = useState<File[]>([]);
  // 画像プレビューのURLの状態！✨
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  // 投稿中の状態！✨
  const [isSubmitting, setIsSubmitting] = useState(false);
  // ルーター！✨
  const router = useRouter();
  // リプライモードかどうか！✨
  const isReply = !!post;
  // ファイル入力の参照！✨
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * リプライ先の投稿を取得するよ！✨
   * 投稿IDがある時だけ実行するよ！💖
   */
  useEffect(() => {
    if (!post?.activityId) return;
    fetchReplyToPost(post.activityId.split("/").pop() || "").then(setReplyToPost);
  }, [post?.activityId]);

  /**
   * 画像を選択した時の処理！✨
   * プレビュー用のURLを生成するよ！💖
   * @param e - ファイル選択イベント
   */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImages(files);
      const urls = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
    }
  };

  /**
   * 画像を削除する時の処理！✨
   * プレビュー用のURLも解放するよ！💖
   * @param index - 削除する画像のインデックス
   */
  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * 投稿を送信する処理！✨
   * 画像をBase64に変換して送信するよ！💖
   * @param e - フォーム送信イベント
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) return;

    setIsSubmitting(true);
    try {
      // 画像をBase64に変換するよ！✨
      const imagePromises = images.map(async (file) => {
        const image = new Image();
        image.src = URL.createObjectURL(file);
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return {
          url: URL.createObjectURL(file),
          name: file.name,
          mediaType: file.type,
          width: image.width,
          height: image.height,
          blurhash: "", // 後で実装するわ！✨
          bin: base64
        };
      });

      const imageData = await Promise.all(imagePromises);

      // 投稿を送信するよ！✨
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          visibility,
          images: imageData,
          inReplyTo: isReply ? post.activityId : undefined,
        }),
      });

      if (!response.ok) throw new Error(`${isReply ? "リプライ" : "投稿"}に失敗したよ！💦`);

      // フォームをリセットするよ！✨
      setContent(isReply ? `@${post.username} ` : "");
      setImages([]);
      setPreviewUrls([]);
      if (isReply && onClose) onClose();
      else {
        // タイムラインを更新するよ！💖
        window.dispatchEvent(new CustomEvent('postCreated'));
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || `${isReply ? "リプライ" : "投稿"}に失敗したよ！もう一度試してみてね！💦`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* リプライ先の投稿を表示するよ！✨ */}
      {replyToPost && <ReplyToPost post={replyToPost} />}

      <div className="space-y-4">
        {/* 投稿内容の入力エリア！✨ */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 p-4 border-2 border-purple-100 dark:border-pink-100">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="キラキラな投稿を書いてね！✨"
            className="w-full p-4 bg-transparent border-none focus:ring-0 resize-none text-lg placeholder-purple-300 dark:placeholder-pink-300"
            rows={3}
            required
          />
        </div>
        {/* エラーメッセージを表示するよ！✨ */}
        {error && (
          <div className="p-4 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-200 border-2 border-red-200 dark:border-red-800">
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
              <img
                src={url}
                alt={`プレビュー ${index + 1}`}
                className="w-full h-32 object-cover rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border-2 border-purple-100 dark:border-pink-100"
              />
              <button
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/70 hover:scale-110"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 画像追加と公開範囲の設定エリア！✨ */}
      <div className="flex justify-between items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 bg-purple-100 dark:bg-pink-100 text-purple-600 dark:text-pink-600 hover:bg-purple-200 dark:hover:bg-pink-200 transition-all duration-200 hover:scale-105 active:scale-95 rounded-xl border-2 border-purple-200 dark:border-pink-200"
        >
          <ImagePlus className="w-4 h-4" />
          画像を追加 📸
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          multiple
          className="hidden"
        />

        {/* 公開範囲の設定！✨ */}
        <RadioGroup
          value={visibility}
          onValueChange={(value) => setVisibility(value as "public" | "followers")}
          className="flex items-center gap-4 invisible"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="public" id="public" className="text-purple-600 dark:text-pink-600" />
            <Label htmlFor="public" className="text-purple-600 dark:text-pink-600">公開</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="followers" id="followers" className="text-purple-600 dark:text-pink-600" />
            <Label htmlFor="followers" className="text-purple-600 dark:text-pink-600">フォロワー限定</Label>
          </div>
        </RadioGroup>
      

      {/* 投稿ボタンエリア！✨ */}
      <div className="flex items-center justify-end space-x-4">
        <button
          type="submit"
          disabled={isSubmitting || (!content.trim() && images.length === 0)}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 dark:hover:from-pink-700 dark:hover:to-purple-700 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
          aria-label={isReply ? "リプライを投稿" : "投稿する"}
        >
          {isSubmitting ? (
            <span className="animate-spin">🌀</span>
          ) : isReply ? (
            "リプライ！💖"
          ) : (
            "投稿する！💖"
          )}
        </button>
        </div>
        {isReply && (
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-gray-200 dark:border-gray-700"
            aria-label="キャンセル"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
}