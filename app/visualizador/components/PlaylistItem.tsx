'use client';

import { useRef, useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import type { PlaylistHymn } from '../lib/types';
import { cn } from '@/app/lib/shadcn/utils';
import { Button } from '@/lib/shadcn/ui';

interface PlaylistItemProps {
  hymn: PlaylistHymn;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

/**
 * Item individual de la playlist con soporte de drag-and-drop.
 * Muestra nombre del himno con marquee en hover si desborda, handle de arrastre y boton de remover siempre visible.
 */
export function PlaylistItem({
  hymn,
  isActive,
  onSelect,
  onRemove,
}: PlaylistItemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflows, setOverflows] = useState(false);

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

  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    const check = () => {
      const isOverflowing = text.scrollWidth > container.clientWidth;
      setOverflows(isOverflowing);
      if (isOverflowing) {
        const offset = -(text.scrollWidth - container.clientWidth);
        container.style.setProperty('--marquee-offset', `${offset}px`);
      }
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(container);
    return () => observer.disconnect();
  }, [hymn.hymnData.name]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-1.5 px-2 min-h-[44px] rounded-md transition-colors cursor-pointer',
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

      {/* Badge con numero */}
      {hymn.hymnData.hymn_number != null && (
        <span className="flex-shrink-0 w-8 h-8 rounded-md bg-muted text-muted-foreground text-xs font-semibold flex items-center justify-center">
          {hymn.hymnData.hymn_number}
        </span>
      )}

      {/* Nombre — overflow hidden, marquee en hover solo si desborda */}
      <div ref={containerRef} className="overflow-hidden flex-1 min-w-0">
        <span
          ref={textRef}
          className={`text-sm whitespace-nowrap inline-block ${overflows ? 'group-hover:animate-[marquee_4s_linear_infinite]' : ''}`}
        >
          {hymn.hymnData.name}
        </span>
      </div>

      {/* Boton remover — siempre visible, shrink-0 */}
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label={`Quitar ${hymn.hymnData.name}`}
        className="flex-shrink-0 h-8 w-8"
      >
        <X className="h-3.5 w-3.5 text-slate-400" />
      </Button>
    </div>
  );
}
