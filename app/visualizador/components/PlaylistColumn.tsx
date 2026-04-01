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
import { ToolSettingsButton } from '@/app/components/LocalStorageWarning';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/lib/shadcn/ui';
import { Search } from 'lucide-react';

const MAX_PLAYLIST_SIZE = 30;

interface PlaylistColumnProps {
  playlist: PlaylistHymn[];
  activeHymnIndex: number;
  onSelectHymn: (index: number) => void;
  onRemoveHymn: (index: number) => void;
  onReorderPlaylist: (from: number, to: number) => void;
  onAddHymn: (hymn: HymnSearchResult) => void;
  /** ID del himno que se esta cargando al agregar */
  addingHymnId?: string | null;
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
  addingHymnId,
}: PlaylistColumnProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [limitAlertOpen, setLimitAlertOpen] = useState(false);

  const isAtLimit = playlist.length >= MAX_PLAYLIST_SIZE;

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
      const idx = playlist.findIndex((h) => h.id === hymn.id);
      if (idx !== -1) onRemoveHymn(idx);
    } else if (isAtLimit) {
      setLimitAlertOpen(true);
    } else {
      onAddHymn(hymn);
    }
  }

  // Filtrar playlist por busqueda
  const filteredPlaylist = useMemo(() => {
    if (!searchQuery.trim()) return playlist;
    const q = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return playlist.filter((h) => {
      const name = (h.hymnData.name ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const num = String(h.hymnData.hymn_number ?? '');
      return name.includes(q) || num.includes(q);
    });
  }, [playlist, searchQuery]);

  // IDs para sortable context
  const sortableIds = playlist.map((h) => h.id);

  return (
    <div className="flex flex-col h-full">
      {/* Header: agregar himnos + configuracion */}
      <div className="p-3 border-b border-border flex items-center gap-1.5">
        <Button
          variant="outline"
          className="flex-1 h-8 text-sm cursor-pointer"
          onClick={() => isAtLimit ? setLimitAlertOpen(true) : setDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Agregar himno
          {playlist.length > 0 && (
            <span className="ml-1.5 text-xs text-muted-foreground">
              {playlist.length}/{MAX_PLAYLIST_SIZE}
            </span>
          )}
        </Button>
        <ToolSettingsButton tool="visualizador" />
      </div>

      {/* Alerta de limite alcanzado */}
      <AlertDialog open={limitAlertOpen} onOpenChange={setLimitAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limite alcanzado</AlertDialogTitle>
            <AlertDialogDescription>
              La lista permite un maximo de {MAX_PLAYLIST_SIZE} himnos.
              Elimine al menos uno antes de agregar otro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setLimitAlertOpen(false)}>
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog con HymnExplorer */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[88vw] w-full h-[84vh] flex flex-col p-0 gap-0" overlayClassName="bg-black/60 backdrop-blur-sm">
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

      {/* Buscador de himnos en la lista */}
      {playlist.length > 0 && (
        <div className="px-3 py-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar en la lista..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      )}

      {/* Lista de reproduccion */}
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
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
                {filteredPlaylist.map((hymn) => {
                  const realIndex = playlist.findIndex((h) => h.id === hymn.id);
                  return (
                    <PlaylistItem
                      key={hymn.id}
                      hymn={hymn}
                      isActive={realIndex === activeHymnIndex}
                      onSelect={() => onSelectHymn(realIndex)}
                      onRemove={() => onRemoveHymn(realIndex)}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
            {addingHymnId && (
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
                Agregando himno...
              </div>
            )}
            {searchQuery && filteredPlaylist.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                No se encontraron himnos
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
