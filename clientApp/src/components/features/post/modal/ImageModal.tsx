"use client";

import { useState, useEffect, useCallback } from "react";
import { ActivityPubImage } from "@/types/activitypub/collections";
import {  Image as ImageIcon, Play } from "lucide-react";
import Image from "next/image";
import ImageModalContent from "./ImageModalContent";
import {  convertToInternalUrl } from "@/lib/utils";

/**
 * 画像モーダルコンポーネント！✨
 * 画像をキラキラに表示するよ！💖
 */
export default function ImageModal({ images,  setIsModalOpen, isModalOpen , ModalSwitch=true ,setModalImages, setModalIndex}: { images: ActivityPubImage[],  setIsModalOpen: (isOpen: boolean) => void, isModalOpen: boolean, ModalSwitch?: boolean, setModalImages: (images: ActivityPubImage[]) => void, setModalIndex: (index: number) => void }) {
 
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
          const preview = image.url;
          previews.push(preview);
          setIsLoading(true);
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

  // モーダルの内容を更新する処理！✨
  const updateModalContent = useCallback(() => {
    if (!ModalSwitch) return;
    setCurrentImageIndex(0);
  }, [ModalSwitch, images, setIsModalOpen]);

  useEffect(() => {
    updateModalContent();
  }, [updateModalContent]);

  /**
   * モーダルを開く処理！✨
   */
  const handleClick = useCallback((index: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (ModalSwitch) {
      setModalImages(images);
      setModalIndex(index);
    } else {
      setCurrentImageIndex(index);
    }
    setIsModalOpen(true);
  }, [ModalSwitch, images, setIsModalOpen]);

  return (
    <>
      {/* 画像グリッド！✨ */}
      {/* 1枚なら横長で大きく、2枚以上は正方形で並べる */}
      <div className={`grid gap-1.5 overflow-hidden rounded-xl ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {images.slice(0, 4).map((image, index) => (
          <div key={index} className={`relative ${images.length === 1 ? "aspect-video" : "aspect-square"}`}>
            {isLoading ? (
              <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              </div>
            ) : (
              <div className="w-full h-full overflow-hidden bg-muted">
                {image.type==="Image"&&(
                                  <Image
                                  src={convertToInternalUrl(image.url)}
                                  alt={image.name || "画像"}
                                  width={400}
                                  height={400}
                                  className="w-full h-full object-cover cursor-zoom-in transition-opacity hover:opacity-90"
                                  onClick={handleClick(index)}
                                />
                )}
                {image.type==="Video"&&(<>
                  <video
                    src={convertToInternalUrl(imagePreview[index] || image.url)}
                    poster={convertToInternalUrl(imagePreview[index] || image.url)}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={handleClick(index)}
                  />
                    <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"><Play className="h-5 w-5 fill-current" /></span>
                  </>
                )}
                {image.type==="Audio"&&(<div className="relative overflow-hidden flex w-full h-full cursor-pointer bg-accent"> 
                  <audio
                    src={convertToInternalUrl(imagePreview[index] || image.url)}
                    className="w-full h-full"

                  />
                  <span className="whitespace-nowrap text-pink-500 dark:text-pink-400 absolute top-0 left-0 text-8xl font-bold font-mono animate-marquee">{image.name}</span>
                  <Play className="w-8 h-8 text-pink-500 dark:text-pink-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" 
                  onClick={()=>{
                    const audio = document.querySelector(`audio[src="${convertToInternalUrl(imagePreview[index] || image.url)}"]`);
                    if(audio){
                      (audio as HTMLAudioElement).controls = true;
                      (audio as HTMLAudioElement).play();
                    }
                  }}/>
                </div>
                )}
              </div>
            )}
            {index === 3 && images.length > 4 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45">
                <span className="text-xl font-semibold text-white tabular-nums">
                  +{images.length - 4}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      {!ModalSwitch && isModalOpen && (
        <ImageModalContent 
          imagesTable={images} 
          isModalOpen={isModalOpen} 
          setIsModalOpen={setIsModalOpen} 
          index={currentImageIndex}
        />
      )}
    </>
  );
} 