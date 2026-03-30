'use client';

import { useState, useEffect } from 'react';
import type { WizardState, WizardAction } from '@/app/empaquetador/hooks/useWizardReducer';
import type { HymnSearchResult } from '@/app/interfaces/Hymn.interface';
import { useHymnSearch } from '@/app/empaquetador/hooks/useHymnSearch';
import HymnResultRow from '@/app/empaquetador/components/HymnResultRow';
import SelectedHymnChip from '@/app/empaquetador/components/SelectedHymnChip';
import {
  Input,
  Badge,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle,
  Card,
} from '@/lib/shadcn/ui';
import { Search } from 'lucide-react';

interface StepSeleccionProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

export default function StepSeleccion({ state, dispatch }: StepSeleccionProps) {
  const { query, setQuery, hymnal, setHymnal, category, setCategory, results, isLoading, error } =
    useHymnSearch();

  const [hymnals, setHymnals] = useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [filtersLoading, setFiltersLoading] = useState(true);

  // Cargar listas de himnarios y categorias al montar
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch('/api/hymnals').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
    ])
      .then(([hymnalsData, categoriesData]) => {
        if (cancelled) return;
        setHymnals(hymnalsData.data ?? []);
        setCategories(categoriesData.data ?? []);
      })
      .catch((err) => {
        console.error('Error al cargar filtros:', err);
      })
      .finally(() => {
        if (!cancelled) setFiltersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const hasQuery = query.trim().length > 0 || hymnal !== '' || category !== '';
  const hasSelectedHymns = state.selectedHymns.length > 0;

  /** Toggle de seleccion: agrega o quita segun estado actual */
  const handleToggle = (hymn: HymnSearchResult) => {
    const isSelected = state.selectedHymns.some((h) => h.id === hymn.id);
    if (isSelected) {
      dispatch({ type: 'REMOVE_HYMN', hymnId: hymn.id });
    } else {
      dispatch({ type: 'ADD_HYMN', hymn });
    }
  };

  const selectedPanel = (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-slate-700">Mi Seleccion</h3>
        {hasSelectedHymns && (
          <Badge variant="default" className="text-xs">
            {state.selectedHymns.length}
          </Badge>
        )}
      </div>
      {hasSelectedHymns ? (
        <ScrollArea className="h-[calc(100vh-280px)]" aria-label="Himnos seleccionados">
          <div className="space-y-0.5">
            {state.selectedHymns.map((hymn) => (
              <SelectedHymnChip
                key={hymn.id}
                hymn={hymn}
                onRemove={(hymnId) => dispatch({ type: 'REMOVE_HYMN', hymnId })}
              />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <p className="text-slate-400 text-sm py-4">
          Busca y selecciona himnos desde los resultados.
        </p>
      )}
    </div>
  );

  return (
    <div className="flex gap-6">
      {/* Sidebar de seleccion (solo desktop) */}
      <aside className="hidden lg:block w-[280px] flex-shrink-0 pt-8 px-4">
        <Card className="p-4 sticky top-8">{selectedPanel}</Card>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 max-w-5xl px-4 py-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Explorar Himnario</h2>
        <p className="text-slate-500 text-sm mb-6">
          Encuentra y selecciona los himnos para tu paquete.
        </p>

        {/* Barra de busqueda */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Busca por numero, titulo o fragmento..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar himnos"
            className="pl-10 h-11"
          />
        </div>

        {/* Filtros como chips */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Select
            value={hymnal || '__all__'}
            onValueChange={(v) => setHymnal(v === '__all__' ? '' : v)}
            disabled={filtersLoading}
          >
            <SelectTrigger className="w-auto min-w-[180px] h-9 text-sm rounded-full border-slate-200 bg-slate-50">
              <SelectValue placeholder={filtersLoading ? 'Cargando...' : 'Himnario'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los himnarios</SelectItem>
              {hymnals.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  {h.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={category || '__all__'}
            onValueChange={(v) => setCategory(v === '__all__' ? '' : v)}
            disabled={filtersLoading}
          >
            <SelectTrigger className="w-auto min-w-[180px] h-9 text-sm rounded-full border-slate-200 bg-slate-50">
              <SelectValue placeholder={filtersLoading ? 'Cargando...' : 'Categoria'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas las categorias</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grilla de resultados */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse bg-slate-100 rounded-lg h-28" />
            ))}
          </div>
        ) : error ? (
          <p className="text-destructive text-sm">Error al buscar. Intenta de nuevo.</p>
        ) : !hasQuery ? (
          <div className="text-center py-16">
            <Search className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              Escribe el numero o nombre de un himno para comenzar.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-sm">
              No se encontraron himnos. Intenta con otro termino de busqueda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((hymn) => (
              <HymnResultRow
                key={hymn.id}
                hymn={hymn}
                isSelected={state.selectedHymns.some((h) => h.id === hymn.id)}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </main>

      {/* Drawer de himnos seleccionados (solo mobile) */}
      <div className="lg:hidden">
        {hasSelectedHymns && (
          <Drawer>
            <DrawerTrigger asChild>
              <button
                type="button"
                className="fixed bottom-[72px] left-0 right-0 h-12 bg-white border-t shadow-md z-40 flex items-center justify-center gap-2"
              >
                <span className="text-sm font-semibold text-slate-700">Mi Seleccion</span>
                <Badge variant="default">{state.selectedHymns.length}</Badge>
              </button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="p-4">
                <DrawerTitle className="mb-3">Mi Seleccion</DrawerTitle>
                {selectedPanel}
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </div>
    </div>
  );
}
