'use client';

import { useState, useMemo } from 'react';
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
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { PlaylistHymn } from '../lib/types';
import type { HymnSearchResult } from '@/app/interfaces/Hymn.interface';
import HymnExplorer from '@/app/components/HymnExplorer';
import { PlaylistItem } from './PlaylistItem';
import {
  ScrollArea,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  TooltipProvider,
} from '@/lib/shadcn/ui';

interface PlaylistColumnProps {
  playlist: PlaylistHymn[];
  activeHymnIndex: number;
  onSelectHymn: (index: number) => void;
  onRemoveHymn: (index: number) => void;
  onReorderPlaylist: (from: number, to: number) => void;
  onAddHymn: (hymn: HymnSearchResult) => void;
}

/**
 * Columna izquierda del visualizador: boton para agregar himnos y lista de reproduccion.
 * Usa HymnExplorer en un Dialog para busqueda completa y @dnd-kit para reordenar via drag-and-drop.
 */
export function PlaylistColumn({
  playlist,
  activeHymnIndex,
  onSelectHymn,
  onRemoveHymn,
  onReorderPlaylist,
  onAddHymn,
}: PlaylistColumnProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  // IDs de himnos ya en la playlist para marcarlos como seleccionados en HymnExplorer
  const playlistIds = useMemo(
    () => new Set(playlist.map((h) => h.id)),
    [playlist],
  );

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

  function handleToggle(hymn: HymnSearchResult) {
    if (playlistIds.has(hymn.id)) {
      // Encontrar el indice y remover
      const idx = playlist.findIndex((h) => h.id === hymn.id);
      if (idx !== -1) onRemoveHymn(idx);
    } else {
      onAddHymn(hymn);
    }
  }

  // IDs para sortable context
  const sortableIds = playlist.map((h) => h.id);

  return (
    <div className="flex flex-col h-full">
      {/* Boton para agregar himnos */}
      <div className="p-3 border-b border-border">
        <Button
          variant="outline"
          className="w-full h-8 text-sm cursor-pointer"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Agregar himno
        </Button>
      </div>

      {/* Dialog con HymnExplorer */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full h-[92vh] flex flex-col p-0 gap-0">
          <DialogTitle className="px-6 pt-5 pb-0 text-lg font-semibold">
            Explorar Himnario
          </DialogTitle>
          <div className="flex-1 overflow-auto px-6 pb-6 pt-2">
            <HymnExplorer
              selectedIds={playlistIds}
              onToggle={handleToggle}
              hideHeading
              className="flex flex-col h-full"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Lista de reproduccion */}
      <TooltipProvider delayDuration={300}>
        {playlist.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-2">
              <h3 className="text-sm font-medium text-foreground">
                Sin himnos en la lista
              </h3>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Use el boton &quot;Agregar himno&quot; para buscar y agregar
                himnos a la lista de reproduccion.
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
