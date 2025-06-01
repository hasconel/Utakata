"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ImagePlus, X } from "lucide-react";

interface ImageUploadProps {
  onImagesChange: (files: File[]) => void;
}

/**
 * 画像アップロードコンポーネント！✨
 * 画像の選択とプレビューをキラキラに処理するよ！💖
 */
export default function ImageUpload({ onImagesChange }: ImageUploadProps) {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 画像を選択した時の処理！✨
   * プレビュー用のURLを生成するよ！💖
   */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onImagesChange(files);
      const urls = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
    }
  };

  /**
   * 画像を削除する時の処理！✨
   * プレビュー用のURLも解放するよ！💖
   */
  const handleRemoveImage = (index: number) => {
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    onImagesChange([]);
  };

  return (
    <div className="space-y-4">
      {/* 画像プレビューエリア！✨ */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative">
              <img
                src={url}
                alt={`プレビュー ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 bg-black/50 rounded-full p-1 hover:bg-black/70"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2"
      >
        <ImagePlus className="w-4 h-4" />
        画像を追加
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        multiple
        className="hidden"
      />
    </div>
  );
} 