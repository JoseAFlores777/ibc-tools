'use client';

/**
 * Columna derecha del panel de control (320px).
 * Muestra vista previa en vivo de la diapositiva actual y controles de proyeccion.
 */

import SlideRenderer from './SlideRenderer';
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
  // Si no hay diapositiva y estamos en modo slide, mostrar estado vacio
  const showEmptyState = !currentSlide && projectionMode === 'slide';

  return (
    <div className="flex flex-col h-full">
      {/* Area superior: vista previa en vivo */}
      <div className="flex-1 p-3 flex flex-col gap-2">
        <div className="rounded-lg overflow-hidden border border-border">
          <div className="aspect-video relative">
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
              <SlideRenderer
                slide={currentSlide}
                theme={theme}
                mode={projectionMode}
                fontSize={16}
                isPreview={true}
              />
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
