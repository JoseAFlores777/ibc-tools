'use client';

/**
 * Auto font sizing hook using binary search + canvas measurement.
 * Calculates the largest font size that guarantees ALL text fits
 * within the virtual 1920x1080 projection container with no overflow.
 */

import { useMemo, useRef } from 'react';

/** Height reserved for the verse label (24px font + margin) */
const LABEL_HEIGHT = 40;
/** Padding on all sides (matches SlideRenderer) */
const PADDING = 80;

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
 * Binary search for the largest font size where all text lines
 * fit within the available area, accounting for:
 *   - 80px padding on all sides
 *   - Verse label height (40px)
 *   - Word wrapping: lines longer than maxWidth wrap to additional visual lines
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

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return 16;

    const lines = text.split('\n');
    const maxWidth = containerWidth - PADDING * 2;
    // Reserve space for label at top + padding
    const maxHeight = containerHeight - PADDING * 2 - LABEL_HEIGHT;

    if (maxWidth <= 0 || maxHeight <= 0) return 16;

    let lo = 12;
    let hi = 120;

    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      ctx.font = `${mid}px ${fontFamily}`;

      const lineHeight = mid * 1.4;
      let totalVisualLines = 0;

      // Count visual lines including word wrapping
      for (const line of lines) {
        if (!line.trim()) {
          totalVisualLines += 1; // Empty line still takes space
          continue;
        }
        const measured = ctx.measureText(line).width;
        if (measured <= maxWidth) {
          totalVisualLines += 1;
        } else {
          // Estimate wrapped lines by measuring word by word
          totalVisualLines += countWrappedLines(ctx, line, maxWidth);
        }
      }

      const totalHeight = totalVisualLines * lineHeight;

      if (totalHeight <= maxHeight) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }

    // Apply offset but never go below minimum or above what fits
    const adjusted = lo + sizeOffset;
    return Math.max(12, Math.min(adjusted, lo + 20));
  }, [text, containerWidth, containerHeight, fontFamily, sizeOffset]);
}

/**
 * Count how many visual lines a single text line produces
 * when word-wrapped within maxWidth.
 */
function countWrappedLines(
  ctx: CanvasRenderingContext2D,
  line: string,
  maxWidth: number
): number {
  const words = line.split(/\s+/);
  let currentLine = '';
  let lineCount = 1;

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else {
      // If a single word is wider than maxWidth, it still takes one line
      if (currentLine) lineCount++;
      currentLine = word;
    }
  }

  return lineCount;
}
