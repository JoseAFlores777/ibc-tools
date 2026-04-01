'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { Plus, Save, FolderOpen, Trash2 } from 'lucide-react';
import type { PlaylistHymn } from '../lib/types';
import type { HymnSearchResult } from '@/app/interfaces/Hymn.interface';
import HymnExplorer from '@/app/components/HymnExplorer';
import { PlaylistItem } from './PlaylistItem';
import { ToolSettingsButton } from '@/app/components/LocalStorageWarning';
import {
  loadSavedPlaylists,
  saveNamedPlaylist,
  deleteSavedPlaylist,
  type SavedPlaylist,
} from '../hooks/useThemePersistence';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
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
  /** Cargar una playlist guardada por IDs de himno */
  onLoadPlaylist: (hymnIds: string[]) => void;
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
  onLoadPlaylist,
  addingHymnId,
}: PlaylistColumnProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [limitAlertOpen, setLimitAlertOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>([]);
  const [saving, setSaving] = useState(false);

  const isAtLimit = playlist.length >= MAX_PLAYLIST_SIZE;

  // Cargar playlists guardadas cuando se abre el dialog
  const refreshSaved = useCallback(async () => {
    const list = await loadSavedPlaylists();
    setSavedPlaylists(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, []);

  useEffect(() => {
    if (loadDialogOpen || saveDialogOpen) refreshSaved();
  }, [loadDialogOpen, saveDialogOpen, refreshSaved]);

  async function handleSave() {
    if (!saveName.trim() || playlist.length === 0) return;
    setSaving(true);
    await saveNamedPlaylist(saveName.trim(), playlist.map((h) => h.id));
    setSaving(false);
    setSaveName('');
    setSaveDialogOpen(false);
  }

  async function handleDelete(id: string) {
    await deleteSavedPlaylist(id);
    await refreshSaved();
  }

  function handleLoad(pl: SavedPlaylist) {
    onLoadPlaylist(pl.hymnIds);
    setLoadDialogOpen(false);
  }

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
      {/* Header: agregar himnos + playlist management */}
      <div className="p-3 border-b border-border space-y-1.5">
        <div className="flex items-center gap-1.5">
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
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-7 text-xs"
            disabled={playlist.length === 0}
            onClick={() => { setSaveName(''); setSaveDialogOpen(true); }}
          >
            <Save className="h-3 w-3 mr-1" />
            Guardar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={() => setLoadDialogOpen(true)}
          >
            <FolderOpen className="h-3 w-3 mr-1" />
            Cargar
          </Button>
        </div>
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

      {/* Dialog guardar playlist */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Guardar playlist</DialogTitle>
          <DialogDescription>
            Guarde la lista actual con un nombre para cargarla despues.
          </DialogDescription>
          <div className="space-y-3 pt-2">
            <input
              type="text"
              placeholder="Nombre de la playlist..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSaveDialogOpen(false)}>
                Cancelar
              </Button>
              <Button size="sm" disabled={!saveName.trim() || saving} onClick={handleSave}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog cargar playlist */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogContent className="max-w-sm max-h-[70vh] flex flex-col">
          <DialogTitle>Cargar playlist</DialogTitle>
          <DialogDescription>
            Seleccione una playlist guardada para cargarla.
          </DialogDescription>
          <div className="flex-1 overflow-y-auto -mx-6 px-6 min-h-0">
            {savedPlaylists.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay playlists guardadas.
              </p>
            ) : (
              <div className="space-y-1">
                {savedPlaylists.map((pl) => (
                  <div
                    key={pl.id}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group"
                  >
                    <button
                      type="button"
                      className="flex-1 min-w-0 text-left"
                      onClick={() => handleLoad(pl)}
                    >
                      <span className="text-sm font-medium block truncate">{pl.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {pl.hymnIds.length} himnos · {new Date(pl.createdAt).toLocaleDateString()}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(pl.id)}
                      className="flex-shrink-0 h-7 w-7 rounded-sm flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                      aria-label={`Eliminar ${pl.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
