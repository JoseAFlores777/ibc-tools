'use client';

import { useRef, useEffect, useState } from 'react';
import type { HymnSearchResult } from '@/app/interfaces/Hymn.interface';
import { Button } from '@/lib/shadcn/ui';
import { X } from 'lucide-react';

interface SelectedHymnChipProps {
  hymn: HymnSearchResult;
  onRemove: (hymnId: string) => void;
}

/** Fila de himno seleccionado en el sidebar "Mi Selección" */
export default function SelectedHymnChip({ hymn, onRemove }: SelectedHymnChipProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflows, setOverflows] = useState(false);

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
  }, [hymn.name]);

  return (
    <div className="flex items-center gap-2 min-h-[44px] px-2 rounded-md hover:bg-slate-50 group max-w-[100%]">
      {/* Badge con numero — shrink-0, nunca se corta */}
      {hymn.hymn_number !== null && (
        <span className="flex-shrink-0 w-8 h-8 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center">
          {hymn.hymn_number}
        </span>
      )}

      {/* Nombre — overflow hidden, marquee en hover solo si desborda */}
      <div ref={containerRef} className="overflow-hidden flex-1 min-w-0">
        <span
          ref={textRef}
          className={`text-sm text-slate-700 whitespace-nowrap inline-block ${overflows ? 'group-hover:animate-[marquee_4s_linear_infinite]' : ''}`}
        >
          {hymn.name}
        </span>
      </div>

      {/* Boton remover — shrink-0, nunca se corta */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(hymn.id)}
        aria-label={`Quitar ${hymn.name}`}
        className="flex-shrink-0 h-8 w-8"
      >
        <X className="h-3.5 w-3.5 text-slate-400" />
      </Button>
    </div>
  );
}