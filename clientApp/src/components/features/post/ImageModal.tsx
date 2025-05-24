"use client";

import { useState, useEffect } from "react";
import { ActivityPubImage } from "@/types/activitypub/collections";
import Modal from "@/components/ui/Modal";
import { getImagePreview } from "@/lib/appwrite/client";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

/**
 * 画像モーダルコンポーネント！✨
 * 画像をキラキラに表示するよ！💖
 */
export default function ImageModal({ images, isDetailOpen = false }: { images: ActivityPubImage[], isDetailOpen?: boolean }) {
  // モーダルの状態！✨
  const [isOpen, setIsOpen] = useState(false);
  // 現在の画像のインデックス！✨
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // 画像プレビューの状態！✨
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  // ローディングの状態！✨
  const [isLoading, setIsLoading] = useState(true);
  /**
   * 画像プレビューを取得するよ！✨
   * キラキラなプレビューを表示するよ！💖
   */
  useEffect(() => {
    const loadPreview = async () => {
      const previews = [];
      for (const image of images) {
        try {
          setIsLoading(true);
          const preview = await getImagePreview(image, 400);
          if (preview) {
            previews.push(preview);
          }
        } catch (error) {
          console.error("プレビューの取得に失敗したよ！💦", error);
          previews.push(image.url);
        } finally {
          setIsLoading(false);
        }
      }
      setImagePreview(previews);
    };

    loadPreview();
  }, [images]);

  /**
   * モーダルを開く処理！✨
   * クリックイベントの伝播を止めるよ！💖
   */
  const handleClick = (index: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(index);
    setIsOpen(true);
  };

  /**
   * 前の画像に移動する処理！✨
   * クリックイベントの伝播を止めるよ！💖
   */
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  /**
   * 次の画像に移動する処理！✨
   * クリックイベントの伝播を止めるよ！💖
   */
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      {/* 画像グリッド！✨ */}
      <div 
        className="grid grid-cols-2 gap-2 group"
      >
        {images.slice(0, 4).map((image, index) => (
          <div key={index} className="aspect-square relative group">
            {isLoading ? (
              <div className="w-full h-full bg-purple-100 dark:bg-pink-100 rounded-2xl animate-pulse flex items-center justify-center"
              >
                <ImageIcon className="w-8 h-8 text-purple-600 dark:text-pink-600 animate-bounce" />
              </div>
            ) : (
              <img
                src={imagePreview[index] || image.url}
                alt={image.name || "画像"}
                className="w-full h-full object-cover rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-105 cursor-pointer"
                onClick={handleClick(index)}
              />
            )}
            {index === 3 && images.length > 4 && (
              <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center group-hover:bg-black/60 transition-all duration-200">
                <span className="text-white text-xl font-bold">
                  +{images.length - 4}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* モーダル！✨ */}
      {!isDetailOpen && (
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="relative w-full h-full max-h-[90vh]">
          {/* ナビゲーションボタン！✨ */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white text-2xl hover:text-pink-500 transition-all duration-200 hover:scale-110"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white text-2xl hover:text-pink-500 transition-all duration-200 hover:scale-110"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* 画像！✨ */}
          <div className="w-full h-full flex items-center justify-center">
            {images[currentImageIndex].mediaType.startsWith("image") ? (
              <img
                src={images[currentImageIndex].url}
                alt={images[currentImageIndex].name || "画像"}
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              />
            ) : images[currentImageIndex].mediaType.startsWith("video") ? (
              <video
                src={images[currentImageIndex].url}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              >
                お使いのブラウザは動画の再生に対応していないみたいだよ！💦
              </video>
            ) : null}
          </div>
        </div>
      </Modal>
      )}
    </>
  );
} 