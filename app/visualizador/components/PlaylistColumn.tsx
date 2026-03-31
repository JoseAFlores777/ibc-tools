'use client';

import { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Search, Music } from 'lucide-react';
import type { PlaylistHymn } from '../lib/types';
import type { HymnSearchResult } from '@/app/interfaces/Hymn.interface';
import { useHymnSearch } from '@/app/empaquetador/hooks/useHymnSearch';
import { PlaylistItem } from './PlaylistItem';
import { ScrollArea, Input, TooltipProvider } from '@/lib/shadcn/ui';
import { cn } from '@/app/lib/shadcn/utils';

interface PlaylistColumnProps {
  playlist: PlaylistHymn[];
  activeHymnIndex: number;
  onSelectHymn: (index: number) => void;
  onRemoveHymn: (index: number) => void;
  onReorderPlaylist: (from: number, to: number) => void;
  onAddHymn: (hymn: HymnSearchResult) => void;
}

/**
 * Columna izquierda del visualizador: busqueda de himnos y lista de reproduccion.
 * Usa useHymnSearch para busqueda y @dnd-kit para reordenar via drag-and-drop.
 */
export function PlaylistColumn({
  playlist,
  activeHymnIndex,
  onSelectHymn,
  onRemoveHymn,
  onReorderPlaylist,
  onAddHymn,
}: PlaylistColumnProps) {
  const {
    query,
    setQuery,
    pageResults,
    isLoading,
  } = useHymnSearch();

  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sensor con distancia minima para evitar conflictos con clicks
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = playlist.findIndex((h) => h.id === active.id);
    const newIndex = playlist.findIndex((h) => h.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorderPlaylist(oldIndex, newIndex);
    }
  }

  function handleAddResult(result: HymnSearchResult) {
    onAddHymn(result);
    setShowResults(false);
    setQuery('');
  }

  // IDs para sortable context
  const sortableIds = playlist.map((h) => h.id);

  return (
    <div className="flex flex-col h-full">
      {/* Busqueda */}
      <div ref={searchContainerRef} className="relative p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar himno por nombre o numero..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => {
              if (query.trim()) setShowResults(true);
            }}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* Dropdown de resultados */}
        {showResults && query.trim() && (
          <div className="absolute left-3 right-3 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
            {isLoading && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Buscando...
              </div>
            )}

            {!isLoading && pageResults.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Sin resultados
              </div>
            )}

            {!isLoading &&
              pageResults.map((result) => {
                const isAlready = playlist.some((h) => h.id === result.id);
                return (
                  <button
                    key={result.id}
                    type="button"
                    disabled={isAlready}
                    onClick={() => handleAddResult(result)}
                    className={cn(
                      'flex items-center gap-2 w-full px-3 py-1.5 text-left text-sm transition-colors',
                      isAlready
                        ? 'text-muted-foreground cursor-not-allowed'
                        : 'hover:bg-muted cursor-pointer',
                    )}
                  >
                    <Music className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate">
                      {result.hymn_number != null && (
                        <span className="font-mono text-muted-foreground mr-1">
                          {result.hymn_number} -
                        </span>
                      )}
                      {result.name}
                    </span>
                    {isAlready && (
                      <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">
                        ya agregado
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {/* Lista de reproduccion */}
      <TooltipProvider delayDuration={300}>
        {playlist.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-2">
              <h3 className="text-sm font-medium text-foreground">
                Sin himnos en la lista
              </h3>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Busque un himno arriba para agregarlo a la lista de
                reproduccion.
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortableIds}
                  strategy={verticalListSortingStrategy}
                >
                  {playlist.map((hymn, index) => (
                    <PlaylistItem
                      key={hymn.id}
                      hymn={hymn}
                      isActive={index === activeHymnIndex}
                      onSelect={() => onSelectHymn(index)}
                      onRemove={() => onRemoveHymn(index)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </ScrollArea>
        )}
      </TooltipProvider>
    </div>
  );
}
