'use client';

import type { SlideData } from '../lib/types';
import { cn } from '@/app/lib/shadcn/utils';

interface SlideThumbnailProps {
  slide: SlideData;
  isActive: boolean;
  onClick: () => void;
  index: number;
}

/**
 * Miniatura de diapositiva con aspecto 16:9.
 * Muestra la etiqueta del verso y un preview del texto de la letra.
 * Borde dorado cuando esta activa.
 */
export function SlideThumbnail({
  slide,
  isActive,
  onClick,
  index,
}: SlideThumbnailProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative aspect-video w-full rounded-md overflow-hidden bg-[#1a1a2e] p-2 text-left transition-all cursor-pointer',
        'hover:ring-1 hover:ring-primary/50',
        isActive && 'ring-2 ring-[#eaba1c]',
      )}
      aria-label={`Diapositiva ${index + 1}: ${slide.verseLabel}`}
      aria-pressed={isActive}
    >
      {/* Etiqueta de seccion */}
      <span className="block text-[10px] font-medium text-white/50 mb-1">
        {slide.verseLabel}
      </span>

      {/* Preview del texto */}
      <p className="text-[9px] text-white leading-tight line-clamp-5 whitespace-pre-line">
        {slide.text}
      </p>

      {/* Numero de diapositiva */}
      <span className="absolute bottom-1 right-1.5 text-[9px] text-white/30">
        {index + 1}
      </span>
    </button>
  );
}
