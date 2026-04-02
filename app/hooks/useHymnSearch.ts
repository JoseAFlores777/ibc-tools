'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { HymnSearchResult, HymnSearchField } from '@/app/interfaces/Hymn.interface';

/** Filtros de audio disponibles */
export type AudioFilter = 'hasAudio' | 'hasMidi' | 'hasVoices';

export const PAGE_SIZE_OPTIONS = [15, 30, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export interface UseHymnSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  hymnal: string;
  setHymnal: (h: string) => void;
  category: string;
  setCategory: (c: string) => void;
  searchFields: Set<HymnSearchField>;
  toggleSearchField: (field: HymnSearchField) => void;
  audioFilters: Set<AudioFilter>;
  toggleAudioFilter: (filter: AudioFilter) => void;
  /** Todos los resultados del server */
  allResults: HymnSearchResult[];
  /** Resultados después de filtros de audio */
  filteredResults: HymnSearchResult[];
  /** Resultados de la página actual */
  pageResults: HymnSearchResult[];
  isLoading: boolean;
  error: string | null;
  /** Paginación */
  page: number;
  setPage: (p: number) => void;
  pageSize: PageSize;
  setPageSize: (s: PageSize) => void;
  totalPages: number;
  totalFiltered: number;
}

export function useHymnSearch(): UseHymnSearchReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Inicializar desde URL search params
  const [query, setQueryState] = useState(searchParams.get('q') ?? '');
  const [hymnal, setHymnalState] = useState(searchParams.get('hymnal') ?? '');
  const [category, setCategoryState] = useState(searchParams.get('category') ?? '');
  const [searchFields, setSearchFields] = useState<Set<HymnSearchField>>(
    new Set(['name']),
  );
  const [audioFilters, setAudioFilters] = useState<Set<AudioFilter>>(new Set());
  const [allResults, setAllResults] = useState<HymnSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(30);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sincronizar estado con URL (sin recargar página)
  const syncUrl = useCallback((q: string, h: string, c: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set('q', q); else params.delete('q');
    if (h) params.set('hymnal', h); else params.delete('hymnal');
    if (c) params.set('category', c); else params.delete('category');
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, pathname, router]);

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
    syncUrl(q, hymnal, category);
  }, [syncUrl, hymnal, category]);

  const setHymnal = useCallback((h: string) => {
    setHymnalState(h);
    syncUrl(query, h, category);
  }, [syncUrl, query, category]);

  const setCategory = useCallback((c: string) => {
    setCategoryState(c);
    syncUrl(query, hymnal, c);
  }, [syncUrl, query, hymnal]);

  const toggleAudioFilter = (filter: AudioFilter) => {
    setAudioFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
    setPage(1);
  };

  const toggleSearchField = (field: HymnSearchField) => {
    setSearchFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        if (next.size > 1) next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  // Fetch todos los resultados del server (limit alto, paginación es client-side)
  useEffect(() => {
    const hasAnyFilter = query.trim().length > 0 || hymnal !== '' || category !== '';

    if (!hasAnyFilter) {
      setAllResults([]);
      setError(null);
      setPage(1);
      return;
    }

    const timer = setTimeout(() => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (hymnal) params.set('hymnal', hymnal);
      if (category) params.set('category', category);
      if (query.trim()) params.set('fields', Array.from(searchFields).join(','));
      params.set('limit', '500');

      setIsLoading(true);
      setError(null);
      setPage(1);

      fetch(`/api/hymns/search?${params.toString()}`, { signal: controller.signal })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((json) => setAllResults(json.data ?? []))
        .catch((err) => {
          if (err.name === 'AbortError') return;
          console.error('Error al buscar himnos:', err);
          setError('Error al buscar.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      abortControllerRef.current?.abort();
    };
  }, [query, hymnal, category, searchFields]);

  // Filtrado client-side por audio
  const filteredResults = useMemo(() => {
    if (audioFilters.size === 0) return allResults;
    return allResults.filter((h) => {
      if (audioFilters.has('hasAudio') && !h.audioFiles.track_only) return false;
      if (audioFilters.has('hasMidi') && !h.audioFiles.midi_file) return false;
      if (audioFilters.has('hasVoices')) {
        const hasAnyVoice = h.audioFiles.soprano_voice || h.audioFiles.alto_voice ||
          h.audioFiles.tenor_voice || h.audioFiles.bass_voice;
        if (!hasAnyVoice) return false;
      }
      return true;
    });
  }, [allResults, audioFilters]);

  const totalFiltered = filteredResults.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  // Clamp page
  const safePage = Math.min(page, totalPages);
  if (safePage !== page) setPage(safePage);

  // Slice de la página actual
  const pageResults = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredResults.slice(start, start + pageSize);
  }, [filteredResults, safePage, pageSize]);

  const handleSetPageSize = (newSize: PageSize) => {
    setPageSize(newSize);
    setPage(1);
  };

  return {
    query,
    setQuery,
    hymnal,
    setHymnal,
    category,
    setCategory,
    searchFields,
    toggleSearchField,
    audioFilters,
    toggleAudioFilter,
    allResults,
    filteredResults,
    pageResults,
    isLoading,
    error,
    page,
    setPage,
    pageSize,
    setPageSize: handleSetPageSize,
    totalPages,
    totalFiltered,
  };
}
