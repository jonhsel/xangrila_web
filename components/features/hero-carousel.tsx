'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface HeroCarouselProps {
  images: {
    src: string;
    alt: string;
  }[];
  interval?: number; // em ms, default 5000
}

export function HeroCarousel({ images, interval = 5000 }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {images.map((image, index) => (
        <div
          key={image.src}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: index === currentIndex ? 1 : 0 }}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover"
            priority={index === 0}
            sizes="100vw"
          />
        </div>
      ))}
      {/* Overlay escuro para legibilidade do texto */}
      <div className="absolute inset-0 bg-black/40" />
      {/* Gradiente inferior para transição suave */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      {/* Indicadores */}
      {images.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Ir para imagem ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
