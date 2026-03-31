'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import type { PlaylistHymn } from '../lib/types';
import { cn } from '@/app/lib/shadcn/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/lib/shadcn/ui';

interface PlaylistItemProps {
  hymn: PlaylistHymn;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

/**
 * Item individual de la playlist con soporte de drag-and-drop.
 * Muestra nombre del himno, numero, handle de arrastre y boton de remover.
 */
export function PlaylistItem({
  hymn,
  isActive,
  onSelect,
  onRemove,
}: PlaylistItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: hymn.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors cursor-pointer',
        isActive && 'bg-card border-l-2 border-[#eaba1c]',
        !isActive && 'hover:bg-muted/50',
        isDragging && 'opacity-50 z-50',
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Handle de arrastre */}
      <button
        type="button"
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        aria-label="Arrastrar para reordenar"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Info del himno */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        {hymn.hymnData.hymn_number != null && (
          <span className="flex-shrink-0 text-[11px] font-mono text-muted-foreground bg-muted rounded px-1">
            {hymn.hymnData.hymn_number}
          </span>
        )}
        <span className="text-sm truncate">{hymn.hymnData.name}</span>
      </div>

      {/* Boton de remover */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label={`Quitar ${hymn.hymnData.name} de la lista`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Quitar</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
