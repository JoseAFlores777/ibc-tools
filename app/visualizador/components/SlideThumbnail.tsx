'use client';

import { useRef, useState, useEffect } from 'react';
import SlideRenderer, { VIRTUAL_W, VIRTUAL_H } from './SlideRenderer';
import { useAutoFontSize } from '../hooks/useAutoFontSize';
import { getFontFamily } from '../lib/theme-presets';
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

  const autoFontSize = useAutoFontSize({
    text: slide.text,
    containerWidth: VIRTUAL_W,
    containerHeight: VIRTUAL_H,
    fontFamily: getFontFamily(theme.fontPreset),
    sizeOffset: theme.fontSizeOffset,
  });

  return (
    <button
      type="button"
      ref={containerRef}
      onClick={onClick}
      className={cn(
        'relative aspect-video w-full rounded-md overflow-hidden text-left transition-all cursor-pointer',
        'hover:ring-1 hover:ring-primary/50',
        isActive && 'ring-2 ring-[#eaba1c]',
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
            fontSize={autoFontSize}
          />
        </div>
      )}

      {/* Numero de diapositiva */}
      <span className="absolute bottom-1 right-1.5 text-[9px] text-white/30 z-10">
        {index + 1}
      </span>
    </button>
  );
}
