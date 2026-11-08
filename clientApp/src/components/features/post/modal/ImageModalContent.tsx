import { ActivityPubImage } from "@/types/activitypub/collections";
import Modal from "@/components/ui/Modal";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { convertToInternalUrl } from "@/lib/utils";

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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, handlePrev, handleNext, setIsModalOpen]);

  const current = imagesTable[currentImageIndex];
  const src = current ? convertToInternalUrl(current.url) : "";
  // 画面に収まる大きさまで（細い画像・横長の画像でも、元の比のまま真ん中に置く）
  const fit = "block h-auto w-auto max-h-[calc(100dvh-7rem)] max-w-[calc(100vw-2rem)] object-contain";
  const navButton =
    "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20";

  return (
    <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} label="画像" fullscreen>
      <div className="flex h-full w-full items-center justify-center p-4">
        {current?.type === "Video" || current?.mediaType?.startsWith("video") ? (
          <video key={src} src={src} controls autoPlay playsInline onClick={(e) => e.stopPropagation()} className={`${fit} rounded-lg`} />
        ) : current ? (
          <img
            key={src}
            src={src}
            alt={current.name || ""}
            onClick={(e) => e.stopPropagation()}
            className={`${fit} rounded-lg animate-in fade-in duration-150`}
          />
        ) : null}
      </div>

      {imagesTable.length > 1 && (
        <>
          <button type="button" onClick={handlePrev} className={`${navButton} left-3`} aria-label="前の画像" title="前へ">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button type="button" onClick={handleNext} className={`${navButton} right-3`} aria-label="次の画像" title="次へ">
            <ChevronRight className="h-6 w-6" />
          </button>
          {/* 何枚目か（点で） */}
          <div className="pointer-events-none absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-1.5" aria-label={`${currentImageIndex + 1} / ${imagesTable.length}`}>
            {imagesTable.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === currentImageIndex ? "bg-white" : "bg-white/35"}`} />
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}
