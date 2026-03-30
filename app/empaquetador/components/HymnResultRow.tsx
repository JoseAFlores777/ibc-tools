import type { HymnSearchResult } from '@/app/interfaces/Hymn.interface';
import { Badge, Card } from '@/lib/shadcn/ui';
import { cn } from '@/app/lib/shadcn/utils';
import { Check } from 'lucide-react';

interface HymnResultRowProps {
  hymn: HymnSearchResult;
  isSelected: boolean;
  onToggle: (hymn: HymnSearchResult) => void;
}

/** Tarjeta de himno en la grilla de resultados de busqueda */
export default function HymnResultRow({ hymn, isSelected, onToggle }: HymnResultRowProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => onToggle(hymn)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle(hymn);
        }
      }}
      className={cn(
        'relative p-4 cursor-pointer transition-all hover:shadow-md min-h-[44px]',
        isSelected
          ? 'border-primary border-2 bg-primary/5'
          : 'border hover:border-slate-300',
      )}
    >
      {/* Circulo de seleccion (top-right) */}
      <div className="absolute top-3 right-3">
        <div
          className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
            isSelected
              ? 'bg-primary border-primary text-primary-foreground'
              : 'border-slate-300 bg-white',
          )}
        >
          {isSelected && <Check className="h-3.5 w-3.5" />}
        </div>
      </div>

      {/* Numero del himno */}
      {hymn.hymn_number !== null && (
        <p className="text-lg font-light text-slate-400 mb-1">
          #{String(hymn.hymn_number).padStart(3, '0')}
        </p>
      )}

      {/* Nombre */}
      <p className="font-semibold text-slate-800 pr-8 leading-snug">{hymn.name}</p>

      {/* Categorias como badges */}
      {hymn.categories.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {hymn.categories.map((cat) =>
            cat.hymn_categories_id ? (
              <Badge
                key={cat.hymn_categories_id.id}
                variant="secondary"
                className="text-xs font-normal"
              >
                {cat.hymn_categories_id.name}
              </Badge>
            ) : null,
          )}
        </div>
      )}
    </Card>
  );
}
