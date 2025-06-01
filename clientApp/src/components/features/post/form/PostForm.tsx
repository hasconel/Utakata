"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ReplyToPost from "../reply/ReplyToPost";
import { Post } from "@/lib/appwrite/posts";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
//import { Label } from "@/components/ui/label";
//import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  isReplyDisplay?: boolean;
}

/**
 * 投稿フォームコンポーネント！✨
 * 新しい投稿やリプライを作成できるよ！💖
 * 画像も追加できるし、公開範囲も選べるよ！🎀
 */
export default function PostForm({ post, onClose, isReplyDisplay=true }: PostFormProps) {
  // 投稿内容の状態！✨
  const [content, setContent] = useState(post ? `@${post.username} ` : "");
  // 公開範囲の状態！✨
  //const [visibility, setVisibility] = useState<"public" | "followers">("followers");
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
          visibility: "followers",
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
      {replyToPost && isReplyDisplay && <ReplyToPost post={replyToPost} />}

      <div className="space-y-4">
        {/* 投稿内容の入力エリア！✨ */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-purple-100 dark:border-pink-100 group">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="キラキラな投稿を書いてね！✨"
            className="w-full p-4 bg-transparent border-none rounded-3xl focus:ring-0 resize-none text-lg placeholder-purple-300 dark:placeholder-pink-300 group-hover:placeholder-purple-400 dark:group-hover:placeholder-pink-400 transition-all duration-300"
            rows={3}
            required
          />
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
              <img
                src={url}
                alt={`プレビュー ${index + 1}`}
                className="w-full h-40 object-cover rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-purple-100 dark:border-pink-100 group-hover:border-purple-200 dark:group-hover:border-pink-200"
              />
              <button
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/70 hover:scale-110 active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 画像追加と公開範囲の設定エリア！✨ */}
      <div className="flex justify-between items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/30 transition-all duration-300 hover:scale-105 active:scale-95 rounded-xl border-2 border-pink-200 dark:border-pink-800"
        >
          <ImagePlus className="w-4 h-4" />
          画像追加 📸
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          multiple
          className="hidden"
        />

      {/* 投稿ボタンエリア！✨ */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="submit"
          disabled={isSubmitting || (!content.trim() && images.length === 0)}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 dark:from-pink-600 dark:via-purple-500 dark:to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:via-pink-600 hover:to-purple-700 dark:hover:from-pink-700 dark:hover:via-purple-600 dark:hover:to-pink-700 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
          aria-label={isReply ? "リプライを投稿" : "投稿する"}
        >
          {isSubmitting ? (
            <span className="animate-spin">🌀</span>
          ) : isReply ? (
            <>
              <span className="animate-bounce">💭</span>
              リプライ！💖
            </>
          ) : (
            <>
              <span className="animate-bounce">✨</span>
              投稿する！💖
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
        {/* 公開範囲の設定！✨ 
        <RadioGroup
          value={visibility}
          onValueChange={(value) => setVisibility(value as "public" | "followers")}
          className="flex items-center gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="public" id="public" className="text-pink-600" />
            <Label htmlFor="public" className="text-pink-600">公開</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="followers" id="followers" className="text-pink-600" />
            <Label htmlFor="followers" className="text-pink-600">Utakata限定</Label>
          </div>
        </RadioGroup>
        */}
      </div>

    </form>
  );
}