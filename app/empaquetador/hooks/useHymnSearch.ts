'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { HymnSearchResult } from '@/app/interfaces/Hymn.interface';

/** Resultado del hook useHymnSearch */
export interface UseHymnSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  hymnal: string;
  setHymnal: (h: string) => void;
  category: string;
  setCategory: (c: string) => void;
  results: HymnSearchResult[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook de busqueda de himnos con debounce de 300ms y cancelacion de solicitudes obsoletas.
 * Construye la URL de busqueda con los filtros activos y retorna los resultados.
 */
export function useHymnSearch(): UseHymnSearchReturn {
  const [query, setQuery] = useState('');
  const [hymnal, setHymnal] = useState('');
  const [category, setCategory] = useState('');
  const [results, setResults] = useState<HymnSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Sin query ni filtros, limpiar resultados
    if (!query.trim() && !hymnal && !category) {
      setResults([]);
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      // Cancelar solicitud anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (hymnal) params.set('hymnal', hymnal);
      if (category) params.set('category', category);
      params.set('limit', '25');

      setIsLoading(true);
      setError(null);

      fetch(`/api/hymns/search?${params.toString()}`, {
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((json) => {
          setResults(json.data ?? []);
        })
        .catch((err) => {
          if (err.name === 'AbortError') return;
          console.error('Error al buscar himnos:', err);
          setError('Error al buscar.');
        })
        .finally(() => {
          // Solo actualizar si no fue abortado
          if (!controller.signal.aborted) {
            setIsLoading(false);
          }
        });
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [query, hymnal, category]);

  return {
    query,
    setQuery,
    hymnal,
    setHymnal,
    category,
    setCategory,
    results,
    isLoading,
    error,
  };
}
