'use client';

import { useState, useEffect } from 'react';
import type { WizardState, WizardAction } from '@/app/empaquetador/hooks/useWizardReducer';
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
} from '@/lib/shadcn/ui';

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

  const selectedPanel = (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold">Himnos Seleccionados</h3>
        {hasSelectedHymns && <Badge variant="default">{state.selectedHymns.length}</Badge>}
      </div>
      {hasSelectedHymns ? (
        <ScrollArea className="h-[300px]" aria-label="Himnos seleccionados">
          <div className="space-y-1">
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
        <p className="text-muted-foreground text-sm">
          Aun no has seleccionado himnos. Busca y agrega himnos desde los resultados.
        </p>
      )}
    </div>
  );

  return (
    <div className={hasSelectedHymns ? 'pb-16 lg:pb-0' : ''}>
      <h2 className="text-xl font-semibold mb-4">Seleccionar Himnos</h2>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <Select
          value={hymnal}
          onValueChange={(v) => setHymnal(v === '__all__' ? '' : v)}
          disabled={filtersLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={filtersLoading ? 'Cargando...' : 'Todos los himnarios'} />
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
          value={category}
          onValueChange={(v) => setCategory(v === '__all__' ? '' : v)}
          disabled={filtersLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={filtersLoading ? 'Cargando...' : 'Todas las categorias'} />
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

      {/* Campo de busqueda */}
      <Input
        placeholder="Buscar por numero o nombre..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Buscar himnos"
        className="mb-4"
      />

      {/* Layout de dos columnas en desktop */}
      <div className="flex gap-6">
        {/* Columna de resultados */}
        <div className="flex-1">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-muted rounded-md h-14" />
              ))}
            </div>
          ) : error ? (
            <p className="text-destructive text-sm">Error al buscar. Intenta de nuevo.</p>
          ) : !hasQuery ? (
            <p className="text-muted-foreground text-sm">
              Escribe el numero o nombre de un himno para comenzar.
            </p>
          ) : results.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No se encontraron himnos. Intenta con otro termino de busqueda.
            </p>
          ) : (
            <ScrollArea className="h-[300px] lg:h-[400px]">
              <div className="space-y-2">
                {results.map((hymn) => (
                  <HymnResultRow
                    key={hymn.id}
                    hymn={hymn}
                    isSelected={state.selectedHymns.some((h) => h.id === hymn.id)}
                    onAdd={(h) => dispatch({ type: 'ADD_HYMN', hymn: h })}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Sidebar de himnos seleccionados (solo desktop) */}
        <div className="hidden lg:block w-80">{selectedPanel}</div>
      </div>

      {/* Drawer de himnos seleccionados (solo mobile) */}
      <div className="lg:hidden">
        {hasSelectedHymns && (
          <Drawer>
            <DrawerTrigger asChild>
              <button
                type="button"
                className="fixed bottom-0 left-0 right-0 h-14 bg-card border-t shadow-lg z-40 flex items-center justify-center gap-2"
              >
                <span className="text-sm font-semibold">Seleccionados</span>
                <Badge variant="default">{state.selectedHymns.length}</Badge>
              </button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="p-4">
                <DrawerTitle className="mb-3">Himnos Seleccionados</DrawerTitle>
                {selectedPanel}
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </div>
    </div>
  );
}
