'use client';

/**
 * Componente compartido para renderizar diapositivas de himnos.
 * Se usa tanto en la vista previa del panel de control (escalada)
 * como en la ventana de proyeccion (pantalla completa).
 */

import { useState } from 'react';
import type { SlideData, ThemeConfig, ProjectionMode } from '../lib/types';

interface SlideRendererProps {
  slide: SlideData | null;
  theme: ThemeConfig;
  mode: ProjectionMode;
  /** Font size calculado externamente */
  fontSize?: number;
  /** Clases CSS adicionales del contenedor padre */
  className?: string;
  /** true = preview escalada en panel de control, false = proyeccion fullscreen */
  isPreview?: boolean;
}

export default function SlideRenderer({
  slide,
  theme,
  mode,
  fontSize = 48,
  className = '',
  isPreview = false,
}: SlideRendererProps) {
  const [logoError, setLogoError] = useState(false);

  // Calcular estilos de fondo segun tipo de tema
  const backgroundStyle = getBackgroundStyle(theme);

  // Clases base del contenedor
  const containerClasses = [
    'relative w-full h-full overflow-hidden',
    isPreview ? 'pointer-events-none select-none' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Modo negro: fondo negro sin texto
  if (mode === 'black') {
    return <div className={containerClasses} style={{ backgroundColor: '#000000' }} />;
  }

  // Modo limpiar: fondo tematico sin texto
  if (mode === 'clear') {
    return <div className={containerClasses} style={backgroundStyle} />;
  }

  // Modo logo: fondo tematico con logo centrado
  if (mode === 'logo') {
    return (
      <div className={containerClasses} style={backgroundStyle}>
        <div className="absolute inset-0 flex items-center justify-center">
          {!logoError ? (
            <img
              src="/logo-iglesia.png"
              alt="Iglesia Bautista El Calvario"
              className="max-w-[60%] max-h-[60%] object-contain"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span
              style={{
                color: '#ffffff',
                fontSize: '32px',
                fontFamily: 'system-ui, sans-serif',
                textAlign: 'center',
              }}
            >
              Iglesia Bautista El Calvario
            </span>
          )}
        </div>
      </div>
    );
  }

  // Modo slide: fondo tematico con etiqueta de verso y texto de la letra
  return (
    <div className={containerClasses} style={backgroundStyle}>
      {/* Area segura con padding proporcional */}
      <div
        className="absolute inset-0 flex flex-col"
        style={{ padding: isPreview ? '8%' : '80px' }}
      >
        {/* Etiqueta del verso en la parte superior */}
        {slide?.verseLabel && (
          <div
            className="text-center text-white/50 flex-shrink-0"
            style={{
              fontSize: isPreview ? '10px' : '24px',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {slide.verseLabel}
          </div>
        )}

        {/* Texto de la letra centrado vertical y horizontalmente */}
        <div className="flex-1 flex items-center justify-center">
          <div
            style={{
              fontSize: `${fontSize}px`,
              color: '#ffffff',
              lineHeight: 1.4,
              fontFamily: 'system-ui, sans-serif',
              textAlign: 'center',
              width: '100%',
            }}
          >
            {slide?.text.split('\n').map((line, i) => (
              <div key={i}>{line || '\u00A0'}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Genera el objeto de estilos CSS para el fondo segun el tipo de tema */
function getBackgroundStyle(
  theme: ThemeConfig
): React.CSSProperties {
  switch (theme.backgroundType) {
    case 'solid':
      return { backgroundColor: theme.background };
    case 'gradient':
      return { background: theme.background };
    case 'image':
      return {
        backgroundImage: `url(${theme.background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    default:
      return { backgroundColor: theme.background };
  }
}
