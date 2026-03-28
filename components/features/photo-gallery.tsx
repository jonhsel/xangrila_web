'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
}

interface PhotoGalleryProps {
  images: GalleryImage[];
}

export function PhotoGallery({ images }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);

  const goNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % images.length);
    }
  };

  const goPrev = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
    }
  };

  return (
    <>
      {/* Grid de fotos */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((image, index) => (
          <button
            key={image.src}
            onClick={() => openLightbox(index)}
            className="group relative aspect-square overflow-hidden rounded-lg"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
            {image.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="text-xs text-white font-medium">{image.caption}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            aria-label="Fechar"
          >
            <X className="h-8 w-8" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 text-white hover:text-gray-300 z-10"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-10 w-10" />
          </button>

          <div
            className="relative max-w-4xl max-h-[80vh] w-full mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[selectedIndex].src}
              alt={images[selectedIndex].alt}
              width={1200}
              height={800}
              className="object-contain w-full h-full max-h-[80vh]"
            />
            {images[selectedIndex].caption && (
              <p className="text-center text-white text-sm mt-4">
                {images[selectedIndex].caption}
              </p>
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 text-white hover:text-gray-300 z-10"
            aria-label="Próxima"
          >
            <ChevronRight className="h-10 w-10" />
          </button>
        </div>
      )}
    </>
  );
}
