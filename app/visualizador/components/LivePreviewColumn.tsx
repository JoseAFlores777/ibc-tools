'use client';

/**
 * Columna derecha del panel de control (320px).
 * Replica fielmente lo que se ve en la ventana de proyeccion:
 * mismo SlideRenderer, auto font sizing proporcional, y crossfade.
 */

import { useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import SlideRenderer from './SlideRenderer';
import ProjectionControls from './ProjectionControls';
import { useAutoFontSize } from '../hooks/useAutoFontSize';
import type { SlideData, ThemeConfig, ProjectionMode } from '../lib/types';

interface LivePreviewColumnProps {
  currentSlide: SlideData | null;
  projectionMode: ProjectionMode;
  projectionOpen: boolean;
  theme: ThemeConfig;
  onProjectToggle: () => void;
  onBlack: () => void;
  onClear: () => void;
  onLogo: () => void;
  onFontSizeUp: () => void;
  onFontSizeDown: () => void;
}

export default function LivePreviewColumn({
  currentSlide,
  projectionMode,
  projectionOpen,
  theme,
  onProjectToggle,
  onBlack,
  onClear,
  onLogo,
  onFontSizeUp,
  onFontSizeDown,
}: LivePreviewColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const shouldReduceMotion = useReducedMotion();

  // Medir dimensiones del contenedor de preview
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto font size proporcional al contenedor de preview
  const autoFontSize = useAutoFontSize({
    text: currentSlide?.text ?? '',
    containerWidth: containerSize.width,
    containerHeight: containerSize.height,
    fontFamily: 'system-ui, sans-serif',
    sizeOffset: theme.fontSizeOffset,
  });

  // Key para crossfade identica a la ventana de proyeccion
  const slideKey =
    projectionMode !== 'slide'
      ? `mode-${projectionMode}`
      : `${currentSlide?.label ?? 'empty'}-${currentSlide?.text ?? ''}`;

  const transitionDuration = shouldReduceMotion ? 0 : 0.4;

  // Si no hay diapositiva y estamos en modo slide, mostrar estado vacio
  const showEmptyState = !currentSlide && projectionMode === 'slide';

  return (
    <div className="flex flex-col h-full">
      {/* Area superior: vista previa en vivo */}
      <div className="flex-1 p-3 flex flex-col gap-2">
        <div className="rounded-lg overflow-hidden border border-border">
          <div ref={containerRef} className="aspect-video relative">
            {showEmptyState ? (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: theme.background }}
              >
                <span
                  className="text-white/60 text-center px-4"
                  style={{
                    fontSize: '10px',
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  Iglesia Bautista El Calvario
                </span>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={slideKey}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: transitionDuration,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0"
                >
                  <SlideRenderer
                    slide={currentSlide}
                    theme={theme}
                    mode={projectionMode}
                    fontSize={autoFontSize}
                    isPreview={true}
                  />
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Estado de la proyeccion */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          {projectionOpen ? (
            <>
              <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span>Proyectando</span>
            </>
          ) : (
            <span>Ventana de proyeccion cerrada</span>
          )}
        </div>
      </div>

      {/* Area inferior: controles de proyeccion */}
      <div className="flex-shrink-0 border-t border-border">
        <ProjectionControls
          projectionOpen={projectionOpen}
          projectionMode={projectionMode}
          onProjectToggle={onProjectToggle}
          onBlack={onBlack}
          onClear={onClear}
          onLogo={onLogo}
          onFontSizeUp={onFontSizeUp}
          onFontSizeDown={onFontSizeDown}
        />
      </div>
    </div>
  );
}
