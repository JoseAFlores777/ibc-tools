'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Resultado de getElementsAtTime de Verovio
 */
export interface VerovioTimeElements {
  notes: string[];
  page: number;
}

/**
 * Hook que encapsula la inicializacion de Verovio WASM,
 * carga de MusicXML, renderizado SVG, y generacion MIDI.
 */
export function useVerovio() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toolkitRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inicializar WASM al montar
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const createVerovioModule = (await import('verovio/wasm')).default;
        const { VerovioToolkit } = await import('verovio/esm');
        const VerovioModule = await createVerovioModule();
        const tk = new VerovioToolkit(VerovioModule);

        // Opciones por defecto (UI-SPEC responsive breakpoints)
        tk.setOptions({
          scale: 40,
          adjustPageWidth: true,
          svgViewBox: true,
          pageWidth: 2100,
          footer: 'none',
          header: 'none',
        });

        if (!cancelled) {
          toolkitRef.current = tk;
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error inicializando Verovio WASM:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al inicializar Verovio');
          setIsLoading(false);
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  /**
   * Carga un score MusicXML. Llama renderToMIDI despues de loadData
   * para construir el timing map (Research Pitfall 4).
   */
  const loadScore = useCallback((musicXmlString: string): boolean => {
    const tk = toolkitRef.current;
    if (!tk) return false;

    // Verovio WASM emite console.error para warnings no fatales (beam/chord).
    // Next.js 16 dev overlay los muestra como errores bloqueantes.
    // Silenciar temporalmente durante loadData y renderToMIDI.
    const origError = console.error;
    console.error = (...args: unknown[]) => {
      const msg = String(args[0] ?? '');
      if (msg.includes('beam') || msg.includes('Chord') || msg.includes('MusicXML import')) {
        console.warn('[Verovio]', ...args);
        return;
      }
      origError.apply(console, args);
    };

    try {
      const loaded = tk.loadData(musicXmlString);
      if (loaded) {
        // CRITICO: renderToMIDI debe llamarse despues de loadData
        // para construir el timing map interno (Pitfall 4)
        tk.renderToMIDI();
      }
      return loaded;
    } finally {
      console.error = origError;
    }
  }, []);

  /** Renderiza una pagina como SVG */
  const renderPage = useCallback((pageNum: number): string => {
    const tk = toolkitRef.current;
    if (!tk) return '';
    return tk.renderToSVG(pageNum);
  }, []);

  /** Renderiza todas las paginas como array de SVG strings */
  const renderAllPages = useCallback((): string[] => {
    const tk = toolkitRef.current;
    if (!tk) return [];
    const count = tk.getPageCount();
    const pages: string[] = [];
    for (let i = 1; i <= count; i++) {
      pages.push(tk.renderToSVG(i));
    }
    return pages;
  }, []);

  /** Retorna el MIDI en base64 */
  const getMidi = useCallback((): string => {
    const tk = toolkitRef.current;
    if (!tk) return '';
    return tk.renderToMIDI();
  }, []);

  /** Retorna el numero de paginas del score cargado */
  const getPageCount = useCallback((): number => {
    const tk = toolkitRef.current;
    if (!tk) return 0;
    return tk.getPageCount();
  }, []);

  /** Cambia la escala y ancho de pagina, y recalcula el layout */
  const setScale = useCallback((scale: number, pageWidth: number): void => {
    const tk = toolkitRef.current;
    if (!tk) return;
    tk.setOptions({
      scale,
      pageWidth,
      adjustPageWidth: true,
      svgViewBox: true,
    });
    tk.redoLayout();
  }, []);

  /** Retorna los elementos activos en un momento dado (ms) */
  const getElementsAtTime = useCallback((timeMs: number): VerovioTimeElements => {
    const tk = toolkitRef.current;
    if (!tk) return { notes: [], page: 0 };
    return tk.getElementsAtTime(timeMs);
  }, []);

  return {
    toolkit: toolkitRef.current,
    isLoading,
    error,
    loadScore,
    renderPage,
    renderAllPages,
    getMidi,
    getPageCount,
    setScale,
    getElementsAtTime,
  };
}
