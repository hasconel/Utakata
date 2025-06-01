"use client";

import { useState, useEffect, useCallback } from "react";
import { ActivityPubImage } from "@/types/activitypub/collections";
import { getImagePreview } from "@/lib/appwrite/client";
import {  Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import ImageModalContent from "./ImageModalContent";

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
          setIsLoading(true);
          const preview = await getImagePreview(image);
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
      <div className="grid grid-cols-2 gap-2">
        {images.slice(0, 4).map((image, index) => (
          <div key={index} className="aspect-square relative">
            {isLoading ? (
              <div className="w-full h-full bg-pink-100 dark:bg-pink-900/20 rounded-xl animate-pulse flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-pink-500 dark:text-pink-400 animate-bounce" />
              </div>
            ) : (
              <div className="w-full h-full rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                <Image
                  src={imagePreview[index] || image.url}
                  alt={image.name || "画像"}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover transition-all duration-300 hover:scale-110 cursor-pointer border-2 border-pink-200 dark:border-pink-800"
                  onClick={handleClick(index)}
                />
              </div>
            )}
            {index === 3 && images.length > 4 && (
              <div className="absolute inset-0 bg-pink-500/50 dark:bg-pink-900/50 rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-pink-500/60 dark:hover:bg-pink-900/60 backdrop-blur-sm">
                <span className="text-white text-xl font-bold animate-pulse">
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