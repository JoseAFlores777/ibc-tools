'use client';

import { useState, useEffect, useRef, type RefObject } from 'react';

interface UseScoreCursorOptions {
  /** Instancia de VerovioToolkit (desde useVerovio) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolkit: any | null;
  /** Instancia de Sequencer (desde useSpessaSynth) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sequencer: any | null;
  /** Si el sequencer esta reproduciendo */
  isPlaying: boolean;
  /** Ref al contenedor SVG del score */
  containerRef: RefObject<HTMLDivElement | null>;
  /** Callback cuando la pagina activa cambia (D-11 auto-scroll) */
  onPageChange: (page: number) => void;
}

/**
 * Hook que sincroniza la posicion de playback del sequencer
 * con el resaltado visual de notas en el SVG de Verovio.
 *
 * Usa requestAnimationFrame para rendimiento optimo,
 * y manipulacion directa del DOM (no React state) per UI-SPEC.
 */
export function useScoreCursor({
  toolkit,
  sequencer,
  isPlaying,
  containerRef,
  onPageChange,
}: UseScoreCursorOptions) {
  const [currentPage, setCurrentPage] = useState(1);
  const rafRef = useRef<number>(0);
  const currentPageRef = useRef(1);

  useEffect(() => {
    // Si no esta reproduciendo, limpiar highlights y cancelar RAF
    if (!isPlaying || !toolkit || !sequencer) {
      cancelAnimationFrame(rafRef.current);
      // Limpiar todos los highlights existentes (scoped al container)
      const container = containerRef.current;
      if (container) {
        container.querySelectorAll('g.note.playing').forEach((el) => {
          el.classList.remove('playing');
        });
      }
      return;
    }

    // Loop de sincronizacion RAF
    const tick = () => {
      if (!containerRef.current || !toolkit || !sequencer) return;

      // Leer tiempo actual en ms (sequencer usa segundos)
      const timeMs = sequencer.currentHighResolutionTime * 1000;

      // Remover clase .playing de todas las notas actuales (scoped al container)
      containerRef.current.querySelectorAll('g.note.playing').forEach((el) => {
        el.classList.remove('playing');
      });

      // Obtener elementos activos en este momento
      const result = toolkit.getElementsAtTime(timeMs);

      if (result && result.page > 0) {
        // Cambiar de pagina si es diferente (D-11 auto-scroll)
        if (result.page !== currentPageRef.current) {
          currentPageRef.current = result.page;
          setCurrentPage(result.page);
          onPageChange(result.page);
        }

        // Resaltar notas activas
        if (result.notes && result.notes.length > 0) {
          for (const noteId of result.notes) {
            const noteEl = containerRef.current!.querySelector('#' + noteId);
            if (noteEl) {
              noteEl.classList.add('playing');
            }
          }
        }
      }

      // Continuar loop si aun se esta reproduciendo
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, toolkit, sequencer, containerRef, onPageChange]);

  return { currentPage };
}
