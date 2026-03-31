'use client';

/**
 * Componente compartido para renderizar diapositivas de himnos.
 * Siempre renderiza a tamaño de proyeccion (1920x1080) con las mismas
 * dimensiones absolutas. Los contenedores de preview lo escalan con
 * CSS transform: scale() para que sea una miniatura pixel-perfect.
 */

import { useState } from 'react';
import type { SlideData, ThemeConfig, ProjectionMode } from '../lib/types';
import { getFontFamily } from '../lib/theme-presets';

/** Dimensiones virtuales de referencia para la proyeccion */
const VIRTUAL_W = 1920;
const VIRTUAL_H = 1080;

interface SlideRendererProps {
  slide: SlideData | null;
  theme: ThemeConfig;
  mode: ProjectionMode;
  /** Font size calculado externamente (para la resolucion virtual) */
  fontSize?: number;
  /** Clases CSS adicionales del contenedor padre */
  className?: string;
}

export default function SlideRenderer({
  slide,
  theme,
  mode,
  fontSize = 48,
  className = '',
}: SlideRendererProps) {
  const [logoError, setLogoError] = useState(false);

  // Calcular estilos de fondo segun tipo de tema
  const backgroundStyle = getBackgroundStyle(theme);

  const containerClasses = `relative overflow-hidden ${className}`.trim();
  const containerStyle: React.CSSProperties = {
    width: VIRTUAL_W,
    height: VIRTUAL_H,
    ...backgroundStyle,
  };

  // Modo negro: fondo negro sin texto
  if (mode === 'black') {
    return (
      <div
        className={containerClasses}
        style={{ width: VIRTUAL_W, height: VIRTUAL_H, backgroundColor: '#000000' }}
      />
    );
  }

  // Modo limpiar: fondo tematico sin texto
  if (mode === 'clear') {
    return <div className={containerClasses} style={containerStyle} />;
  }

  // Modo logo: fondo tematico con logo centrado
  if (mode === 'logo') {
    return (
      <div className={containerClasses} style={containerStyle}>
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
                fontSize: '48px',
                fontFamily: getFontFamily(theme.fontPreset),
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
    <div className={containerClasses} style={containerStyle}>
      {/* Area segura con padding de 80px */}
      <div
        className="absolute inset-0 flex flex-col"
        style={{ padding: '80px' }}
      >
        {/* Etiqueta del verso en la parte superior */}
        {slide?.verseLabel && (
          <div
            className="text-center flex-shrink-0"
            style={{
              fontSize: '24px',
              color: 'rgba(255,255,255,0.5)',
              fontFamily: getFontFamily(theme.fontPreset),
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
              fontFamily: getFontFamily(theme.fontPreset),
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

/** Exportar dimensiones para que los contenedores puedan calcular la escala */
export { VIRTUAL_W, VIRTUAL_H };
