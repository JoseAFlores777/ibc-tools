'use client';

/**
 * Auto font sizing hook using binary search + canvas measurement.
 * Calculates optimal font size for variable-length text content
 * to fit within projection container dimensions.
 */

import { useMemo, useRef } from 'react';

interface UseAutoFontSizeOptions {
  /** Text content to measure */
  text: string;
  /** Container width in pixels */
  containerWidth: number;
  /** Container height in pixels */
  containerHeight: number;
  /** CSS font family string */
  fontFamily: string;
  /** Offset from auto-calculated base (from theme) */
  sizeOffset: number;
}

/**
 * Binary search for the largest font size that fits all text lines
 * within the container, respecting padding.
 */
export function useAutoFontSize({
  text,
  containerWidth,
  containerHeight,
  fontFamily,
  sizeOffset,
}: UseAutoFontSizeOptions): number {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  return useMemo(() => {
    if (!text || containerWidth <= 0 || containerHeight <= 0) return 16;

    // Crear canvas una sola vez y reutilizar
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return 16;

    const lines = text.split('\n');
    // Padding: 80px cada lado
    const maxWidth = containerWidth - 160;
    const maxHeight = containerHeight - 160;

    if (maxWidth <= 0 || maxHeight <= 0) return 16;

    let lo = 16;
    let hi = 120;

    // Busqueda binaria: encontrar el tamano mas grande que quepa
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      ctx.font = `${mid}px ${fontFamily}`;

      const lineHeight = mid * 1.4;
      const totalHeight = lines.length * lineHeight;

      // Verificar que ninguna linea exceda el ancho y que la altura total quepa
      let fits = totalHeight <= maxHeight;
      if (fits) {
        for (const line of lines) {
          if (ctx.measureText(line).width > maxWidth) {
            fits = false;
            break;
          }
        }
      }

      if (fits) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }

    return Math.max(16, lo + sizeOffset);
  }, [text, containerWidth, containerHeight, fontFamily, sizeOffset]);
}
