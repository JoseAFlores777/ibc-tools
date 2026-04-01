'use client';

import { useRef, useState, useEffect } from 'react';
import SlideRenderer, { VIRTUAL_W } from './SlideRenderer';
import type { SlideData, ThemeConfig } from '../lib/types';
import { cn } from '@/app/lib/shadcn/utils';

interface SlideThumbnailProps {
  slide: SlideData;
  theme: ThemeConfig;
  isActive: boolean;
  onClick: () => void;
  index: number;
}

/**
 * Miniatura de diapositiva con aspecto 16:9.
 * Renderiza el SlideRenderer a tamaño virtual (1920x1080) y lo escala
 * con CSS transform para una miniatura pixel-perfect.
 */
export function SlideThumbnail({
  slide,
  theme,
  isActive,
  onClick,
  index,
}: SlideThumbnailProps) {
  const containerRef = useRef<HTMLButtonElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setScale(entry.contentRect.width / VIRTUAL_W);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      type="button"
      ref={containerRef}
      onClick={onClick}
      className={cn(
        'relative aspect-video w-full rounded-lg overflow-hidden text-left transition-all cursor-pointer',
        'hover:ring-2 hover:ring-primary/40',
        isActive
          ? 'ring-[3px] ring-[#eaba1c] shadow-[0_0_12px_rgba(234,186,28,0.4)]'
          : 'ring-1 ring-white/10',
      )}
      aria-label={`Diapositiva ${index + 1}: ${slide.verseLabel}`}
      aria-pressed={isActive}
    >
      {scale > 0 && (
        <div
          className="absolute top-0 left-0 origin-top-left pointer-events-none select-none"
          style={{ transform: `scale(${scale})` }}
        >
          <SlideRenderer
            slide={slide}
            theme={theme}
            mode="slide"
          />
        </div>
      )}

      {/* Etiqueta de seccion */}
      <span className={cn(
        'absolute top-1.5 left-2 text-[10px] font-bold uppercase tracking-wide z-10 px-1.5 py-0.5 rounded',
        isActive
          ? 'bg-[#eaba1c] text-black'
          : 'bg-black/50 text-white/80',
      )}>
        {slide.verseLabel}
      </span>

      {/* Numero de diapositiva */}
      <span className="absolute bottom-1 right-1.5 text-[9px] text-white/40 z-10 font-medium">
        {index + 1}
      </span>
    </button>
  );
}
