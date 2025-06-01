import { ActivityPubImage } from "@/types/activitypub/collections";
import Modal from "@/components/ui/Modal";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

/**
   * モーダルの内容
   * モーダルの内容を設定するよ！💖
   * @returns モーダルの内容のset
   */
export default function ImageModalContent({ imagesTable, isModalOpen, setIsModalOpen, index }: { imagesTable: ActivityPubImage[], isModalOpen: boolean, setIsModalOpen: (isOpen: boolean) => void, index: number }) {
    
  // 現在の画像のインデックス！✨
  const [currentImageIndex, setCurrentImageIndex] = useState(index);
  // インデックスが変更されたときにcurrentImageIndexを更新！✨
  useEffect(() => {
    setCurrentImageIndex(index);
  }, [index]);

  /**
   * 前の画像に移動する処理！✨
   * クリックイベントの伝播を止めるよ！💖
   */
  const handlePrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? imagesTable.length - 1 : prev - 1));
  }, [imagesTable.length]);

  /**
   * 次の画像に移動する処理！✨
   * クリックイベントの伝播を止めるよ！💖
   */
  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === imagesTable.length - 1 ? 0 : prev + 1));
  }, [imagesTable.length]);

  /**
   * キーボードでの操作を追加！✨
   * 左右キーで画像を切り替えられるよ！💖
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;
      
      switch (e.key) {
        case "ArrowLeft":
          handlePrev(e as any);
          break;
        case "ArrowRight":
          handleNext(e as any);
          break;
        case "Escape":
          setIsModalOpen(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, handlePrev, handleNext, setIsModalOpen]);

  return (
    <div>
      <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm"
        >
          <div 
            className="relative w-full h-full max-h-[90vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ナビゲーションボタン！✨ */}
            {imagesTable.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl backdrop-blur-sm"
                  aria-label="前の画像"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl backdrop-blur-sm"
                  aria-label="次の画像"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* 画像！✨ */}
            <div className="w-full h-full flex items-center justify-center">
              {imagesTable[currentImageIndex]?.mediaType.startsWith("image") ? (
                <img
                  src={imagesTable[currentImageIndex].url}
                  alt={imagesTable[currentImageIndex].name || "画像"}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-lg transition-all duration-300"
                  loading="lazy"
                />
              ) : imagesTable[currentImageIndex]?.mediaType.startsWith("video") ? (
                <video
                  src={imagesTable[currentImageIndex].url}
                  controls
                  autoPlay
                  className="max-w-full max-h-full object-contain rounded-xl shadow-lg transition-all duration-300"
                >
                  お使いのブラウザは動画の再生に対応していないみたいだよ！💦
                </video>
              ) : null}
            </div>

            {/* 画像カウンター！✨ */}
            {imagesTable.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium transition-all duration-300 hover:bg-white/20 backdrop-blur-sm">
                {currentImageIndex + 1} / {imagesTable.length}
              </div>
            )}
          </div>
        </Modal>
    </div>
  );
  };
