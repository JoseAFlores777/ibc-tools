'use client';

import type { SlideData } from '../lib/types';
import { SlideThumbnail } from './SlideThumbnail';
import { ScrollArea } from '@/lib/shadcn/ui';

interface SlideGridColumnProps {
  slides: SlideData[];
  activeSlideIndex: number;
  onSelectSlide: (index: number) => void;
  hymnName: string;
}

/**
 * Columna central del visualizador: grilla responsive de miniaturas de diapositivas.
 * Muestra las diapositivas del himno activo con seleccion por clic.
 */
export function SlideGridColumn({
  slides,
  activeSlideIndex,
  onSelectSlide,
  hymnName,
}: SlideGridColumnProps) {
  // Estado vacio: ningun himno seleccionado
  if (slides.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Seleccione un himno
          </h3>
          <p className="text-sm text-muted-foreground max-w-[280px]">
            Haga clic en un himno de la lista para ver sus diapositivas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Encabezado con nombre del himno activo */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border">
        <h2 className="text-lg font-semibold truncate">{hymnName}</h2>
        <p className="text-xs text-muted-foreground">
          {slides.length} diapositiva{slides.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Grilla de miniaturas */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 p-4">
          {slides.map((slide, index) => (
            <SlideThumbnail
              key={`${slide.verseLabel}-${index}`}
              slide={slide}
              isActive={index === activeSlideIndex}
              onClick={() => onSelectSlide(index)}
              index={index}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
