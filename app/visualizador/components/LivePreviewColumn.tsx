'use client';

/**
 * Columna derecha del panel de control (320px).
 * Muestra una miniatura pixel-perfect de la proyeccion: renderiza el
 * SlideRenderer a tamaño virtual (1920x1080) y lo escala con CSS
 * transform: scale() para que encaje en el contenedor de preview.
 */

import { useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import SlideRenderer, { VIRTUAL_W, VIRTUAL_H } from './SlideRenderer';
import ProjectionControls from './ProjectionControls';
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
  onThemeChange: (partial: Partial<ThemeConfig>) => void;
  remotePin: string | null;
  remoteConnected: boolean;
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
  onThemeChange,
  remotePin,
  remoteConnected,
}: LivePreviewColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  // Medir ancho del contenedor para calcular escala
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setContainerWidth(entry.contentRect.width);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Escala para que el render virtual (1920px) encaje en el contenedor
  const scale = containerWidth > 0 ? containerWidth / VIRTUAL_W : 0;
  const scaledHeight = VIRTUAL_H * scale;

  // Key para crossfade identica a la ventana de proyeccion
  const slideKey =
    projectionMode !== 'slide'
      ? `mode-${projectionMode}`
      : `${currentSlide?.label ?? 'empty'}-${currentSlide?.text ?? ''}`;

  const transitionDuration = shouldReduceMotion ? 0 : 0.4;

  const showEmptyState = !currentSlide && projectionMode === 'slide';

  return (
    <div className="flex flex-col h-full">
      {/* Area superior: vista previa en vivo */}
      <div className="flex-1 p-3 flex flex-col gap-2">
        <div className="rounded-lg overflow-hidden border border-border">
          <div
            ref={containerRef}
            className="relative overflow-hidden"
            style={{ height: scaledHeight || 'auto', aspectRatio: scaledHeight ? undefined : '16/9' }}
          >
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
            ) : scale > 0 ? (
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
                  className="absolute top-0 left-0 origin-top-left pointer-events-none select-none"
                  style={{ transform: `scale(${scale})` }}
                >
                  <SlideRenderer
                    slide={currentSlide}
                    theme={theme}
                    mode={projectionMode}
                  />
                </motion.div>
              </AnimatePresence>
            ) : null}
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
          theme={theme}
          onProjectToggle={onProjectToggle}
          onBlack={onBlack}
          onClear={onClear}
          onLogo={onLogo}
          onFontSizeUp={onFontSizeUp}
          onFontSizeDown={onFontSizeDown}
          onThemeChange={onThemeChange}
          remotePin={remotePin}
          remoteConnected={remoteConnected}
        />
      </div>
    </div>
  );
}
