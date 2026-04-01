'use client';

/**
 * Ventana de proyeccion fullscreen.
 * Recibe diapositivas via BroadcastChannel y las renderiza a pantalla completa
 * con transiciones crossfade. Pagina minimal sin layout chrome ni navbar.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import SlideRenderer, { VIRTUAL_W, VIRTUAL_H } from '../components/SlideRenderer';
import { CHANNEL_NAME } from '../lib/projection-channel';
import { DEFAULT_THEME } from '../lib/theme-presets';
import type { ProjectionMessage } from '../lib/projection-channel';
import type { SlideData, ThemeConfig, ProjectionMode } from '../lib/types';

export default function ProyeccionPage() {
  const [currentSlide, setCurrentSlide] = useState<SlideData | null>(null);
  const [theme, setTheme] = useState<ThemeConfig>({ ...DEFAULT_THEME });
  const [mode, setMode] = useState<ProjectionMode>('slide');
  const [fontSizeOffset, setFontSizeOffset] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  const channelRef = useRef<BroadcastChannel | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Medir dimensiones de la ventana
  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Escala para ajustar el render virtual al tamaño real de la ventana
  const scaleX = windowSize.width > 0 ? windowSize.width / VIRTUAL_W : 1;
  const scaleY = windowSize.height > 0 ? windowSize.height / VIRTUAL_H : 1;
  const projScale = Math.min(scaleX, scaleY);

  // Manejar mensajes del canal
  const handleMessage = useCallback((msg: ProjectionMessage) => {
    switch (msg.type) {
      case 'SHOW_SLIDE':
        setCurrentSlide(msg.slide);
        setTheme(msg.theme);
        setFontSizeOffset(msg.fontSize);
        setMode('slide');
        break;
      case 'BLACK_SCREEN':
        setMode('black');
        break;
      case 'CLEAR_TEXT':
        setTheme(msg.theme);
        setMode('clear');
        break;
      case 'SHOW_LOGO':
        setTheme(msg.theme);
        setMode('logo');
        break;
      case 'PONG':
        // Respuesta al handshake: sincronizar todo el estado
        setCurrentSlide(msg.slide);
        setTheme(msg.theme);
        setMode(msg.mode);
        setFontSizeOffset(msg.fontSize);
        break;
    }
  }, []);

  // Crear BroadcastChannel y enviar PING al montar
  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<ProjectionMessage>) => {
      handleMessage(event.data);
    };

    // Enviar PING para iniciar handshake con el panel de control
    channel.postMessage({ type: 'PING' } satisfies ProjectionMessage);

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [handleMessage]);

  // Solicitar pantalla completa al hacer clic
  const handleFullscreenClick = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (err) {
      console.error('Error al solicitar pantalla completa:', err);
      // Aun asi ocultar el overlay para que la proyeccion funcione
      setIsFullscreen(true);
    }
  }, []);

  // Detectar si se salio de pantalla completa (por Escape, etc.)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Duracion de la transicion crossfade (0 si reduced motion)
  const transitionDuration = shouldReduceMotion ? 0 : 0.4;

  // Key unica para el crossfade basada en contenido
  const slideKey =
    mode !== 'slide'
      ? `mode-${mode}`
      : `${currentSlide?.label ?? 'empty'}-${currentSlide?.text ?? ''}`;

  return (
    <div className="w-screen h-screen overflow-hidden cursor-none relative bg-black flex items-center justify-center">
      {/* Diapositiva con crossfade — escalada de virtual (1920x1080) a pantalla real */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slideKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: transitionDuration, ease: 'easeInOut' }}
          className="origin-center"
          style={{ transform: `scale(${projScale})` }}
        >
          <SlideRenderer
            slide={currentSlide}
            theme={theme}
            mode={mode}
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlay de pantalla completa */}
      {!isFullscreen && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 cursor-pointer"
          onClick={handleFullscreenClick}
        >
          <div className="text-center space-y-4">
            <p
              className="text-white text-2xl font-light"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              Haga clic para pantalla completa
            </p>
            <p className="text-white/50 text-sm">
              Presione Escape para salir de pantalla completa
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
