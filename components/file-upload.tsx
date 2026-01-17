"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  currentUrl?: string | null;
  onUploadComplete: (url: string) => void;
  type: "avatar" | "logo" | "cover" | "favicon";
  label: string;
  accept?: string;
  maxSize?: number; // in MB
}

export function FileUpload({
  currentUrl,
  onUploadComplete,
  type,
  label,
  accept = "image/jpeg,image/jpg,image/png,image/webp,image/gif",
  maxSize = 5,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Файл слишком большой. Максимальный размер: ${maxSize}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка загрузки");
      }

      const data = await response.json();
      onUploadComplete(data.url);
      toast.success("Файл успешно загружен");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Не удалось загрузить файл");
      setPreviewUrl(currentUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onUploadComplete("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Preview */}
        {previewUrl ? (
          <div className={`relative group overflow-hidden ${
            type === "avatar" ? "w-20 h-20 rounded-full" : 
            type === "logo" || type === "favicon" ? "w-20 h-20" : 
            "w-40 h-24"
          }`}>
            <Image
              src={previewUrl}
              alt="Preview"
              width={type === "avatar" ? 80 : type === "logo" || type === "favicon" ? 80 : 160}
              height={type === "avatar" ? 80 : type === "logo" || type === "favicon" ? 80 : 96}
              className={`object-cover rounded-lg border border-border ${
                type === "avatar" ? "w-full h-full rounded-full" : 
                type === "logo" || type === "favicon" ? "w-full h-full object-contain" : 
                "w-full h-full"
              }`}
              unoptimized={previewUrl.startsWith('blob:') || previewUrl.startsWith('data:')}
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className={`flex items-center justify-center bg-secondary rounded-lg border-2 border-dashed border-border ${
            type === "avatar" ? "w-20 h-20 rounded-full" : 
            type === "logo" || type === "favicon" ? "w-20 h-20" : 
            "w-40 h-24"
          }`}>
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
        )}

        {/* Upload Button */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            id={`file-upload-${type}`}
            disabled={isUploading}
          />
          <label htmlFor={`file-upload-${type}`}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              className="cursor-pointer"
              asChild
            >
              <span>
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {label}
                  </>
                )}
              </span>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground mt-2">
            JPG, PNG, WebP, GIF (макс. {maxSize}MB)
          </p>
        </div>
      </div>
    </div>
  );
}
