"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from "@/components/ui/dialog";

interface ScreenshotGalleryProps {
  screenshots: string[];
  name: string;
}

export function ScreenshotGallery({ screenshots, name }: ScreenshotGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!screenshots || screenshots.length === 0) return null;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === screenshots.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="mb-16">
      <h2 className="text-2xl font-bold mb-6">Скриншоты интерфейса</h2>
      
      {/* Slider Container */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border/40 shadow-sm bg-secondary/50 group">
        {/* Main Image */}
        <div 
          className="relative w-full h-full cursor-pointer"
          onClick={() => setSelectedImage(screenshots[currentIndex])}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={screenshots[currentIndex]} 
            alt={`Скриншот ${name} ${currentIndex + 1}`} 
            className="object-contain w-full h-full bg-background/50 transition-opacity duration-500"
          />
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <div className="bg-background/80 backdrop-blur-sm text-foreground p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-75 group-hover:scale-100 shadow-lg">
              <ZoomIn className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {screenshots.length > 1 && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); prevSlide(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-background/80 hover:bg-background text-foreground shadow-lg backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 z-10"
              aria-label="Предыдущий слайд"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); nextSlide(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-background/80 hover:bg-background text-foreground shadow-lg backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 z-10"
              aria-label="Следующий слайд"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Pagination Bullets */}
        {screenshots.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full">
            {screenshots.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); goToSlide(idx); }}
                className={`transition-all duration-300 rounded-full ${
                  currentIndex === idx 
                    ? "w-6 h-2 bg-white" 
                    : "w-2 h-2 bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Перейти к слайду ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogOverlay className="bg-black/80 z-50" />
        <DialogContent className="max-w-7xl w-full p-0 bg-transparent border-none shadow-none z-50 [&>button]:hidden">
          <DialogTitle className="sr-only">Скриншот программы {name}</DialogTitle>
          <div className="relative flex items-center justify-center w-full h-[80vh]">
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-0 right-0 p-3 m-2 md:m-4 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors z-[60]"
            >
              <X size={24} />
            </button>
            {selectedImage && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img 
                src={selectedImage} 
                alt="Полноэкранный скриншот" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
