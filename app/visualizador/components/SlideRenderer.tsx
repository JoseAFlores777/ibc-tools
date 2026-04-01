'use client';

/**
 * Componente compartido para renderizar diapositivas de himnos.
 * Siempre renderiza a tamaño de proyeccion (1920x1080).
 * Los contenedores de preview lo escalan con CSS transform: scale().
 *
 * Tamaños de fuente fijos (identicos a ProPresenter):
 *   - Estrofas/Coro: Helvetica Bold 26pt
 *   - Titulo intro (HIMNO + nombre): Helvetica Bold 36pt
 *   - Texto biblico intro: Helvetica Italic 22pt
 *   - Referencia biblica intro: Helvetica Bold 22pt (alineada derecha)
 */

import { useState } from 'react';
import type { SlideData, ThemeConfig, ProjectionMode } from '../lib/types';
import { getFontFamily } from '../lib/theme-presets';

/** Dimensiones virtuales de referencia para la proyeccion */
const VIRTUAL_W = 1920;
const VIRTUAL_H = 1080;

/** Tamaños de fuente fijos (matching ProPresenter RTF half-points / 2) */
const STANZA_FONT_SIZE = 26;
const INTRO_TITLE_FONT_SIZE = 36;
const INTRO_BODY_FONT_SIZE = 22;

interface SlideRendererProps {
  slide: SlideData | null;
  theme: ThemeConfig;
  mode: ProjectionMode;
  /** Clases CSS adicionales del contenedor padre */
  className?: string;
}

export default function SlideRenderer({
  slide,
  theme,
  mode,
  className = '',
}: SlideRendererProps) {
  const [logoError, setLogoError] = useState(false);

  const backgroundStyle = getBackgroundStyle(theme);
  const fontFamily = getFontFamily(theme.fontPreset);

  const containerClasses = `relative overflow-hidden ${className}`.trim();
  const containerStyle: React.CSSProperties = {
    width: VIRTUAL_W,
    height: VIRTUAL_H,
    ...backgroundStyle,
  };

  // Modo negro
  if (mode === 'black') {
    return (
      <div
        className={containerClasses}
        style={{ width: VIRTUAL_W, height: VIRTUAL_H, backgroundColor: '#000000' }}
      />
    );
  }

  // Modo limpiar
  if (mode === 'clear') {
    return <div className={containerClasses} style={containerStyle} />;
  }

  // Modo logo
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
                fontSize: `${INTRO_TITLE_FONT_SIZE}px`,
                fontFamily,
                fontWeight: 'bold',
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

  // Modo slide: diferenciar intro de estrofa/coro
  const isIntro = !!slide?.intro;
  const sizeOffset = theme.fontSizeOffset;
  const textColor = theme.textColor ?? '#ffffff';
  const hAlign = theme.textAlign ?? 'center';
  const vAlign = theme.verticalAlign ?? 'center';

  // Mapear verticalAlign a flexbox
  const justifyMap = { top: 'flex-start', center: 'center', bottom: 'flex-end' } as const;

  // Color del label: version semi-transparente del color de texto
  const labelColor = textColor === '#ffffff' ? 'rgba(255,255,255,0.5)' : textColor + '80';

  return (
    <div className={containerClasses} style={containerStyle}>
      <div
        className="absolute inset-0 flex flex-col"
        style={{ padding: '80px' }}
      >
        {/* Etiqueta del verso */}
        {slide?.verseLabel && !isIntro && (
          <div
            className="flex-shrink-0"
            style={{
              fontSize: '32px',
              color: textColor,
              opacity: 0.7,
              fontFamily,
              fontWeight: 'bold',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              textAlign: hAlign,
              marginBottom: '20px',
            }}
          >
            {slide.verseLabel}
          </div>
        )}

        {/* Contenido */}
        <div
          className="flex-1 flex overflow-hidden"
          style={{
            alignItems: justifyMap[vAlign],
            justifyContent: 'center',
          }}
        >
          {isIntro ? (
            <div style={{ textAlign: hAlign, width: '100%' }}>
              <div
                style={{
                  fontSize: `${INTRO_TITLE_FONT_SIZE + sizeOffset}px`,
                  color: textColor,
                  fontFamily,
                  fontWeight: 'bold',
                  lineHeight: 1.4,
                }}
              >
                HIMNO
              </div>
              <div
                style={{
                  fontSize: `${INTRO_TITLE_FONT_SIZE + sizeOffset}px`,
                  color: textColor,
                  fontFamily,
                  fontWeight: 'bold',
                  lineHeight: 1.4,
                  marginBottom: '24px',
                }}
              >
                &ldquo;{slide.intro!.hymnName.toUpperCase()}&rdquo;
              </div>
              {slide.intro!.bibleText && (
                <div
                  style={{
                    fontSize: `${INTRO_BODY_FONT_SIZE + sizeOffset}px`,
                    color: textColor,
                    fontFamily,
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                    marginBottom: '16px',
                  }}
                >
                  &ldquo;{slide.intro!.bibleText}&rdquo;
                </div>
              )}
              {slide.intro!.bibleReference && (
                <div
                  style={{
                    fontSize: `${INTRO_BODY_FONT_SIZE + sizeOffset}px`,
                    color: textColor,
                    fontFamily,
                    fontWeight: 'bold',
                    textAlign: 'right',
                    lineHeight: 1.4,
                  }}
                >
                  {slide.intro!.bibleReference}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                fontSize: `${STANZA_FONT_SIZE + sizeOffset}px`,
                color: textColor,
                lineHeight: 1.5,
                fontFamily,
                fontWeight: 'bold',
                textAlign: hAlign,
                width: '100%',
              }}
            >
              {slide?.text.split('\n').map((line, i) => (
                <div key={i}>{line || '\u00A0'}</div>
              ))}
            </div>
          )}
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
