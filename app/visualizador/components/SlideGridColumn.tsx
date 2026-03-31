'use client';

import type { SlideData } from '../lib/types';

interface SlideGridColumnProps {
  slides: SlideData[];
  activeSlideIndex: number;
  onSelectSlide: (index: number) => void;
  hymnName: string;
}

/**
 * Columna central: grilla de miniaturas de diapositivas del himno activo.
 * Implementacion completa en Task 2.
 */
export function SlideGridColumn(_props: SlideGridColumnProps) {
  return <div className="h-full" />;
}
