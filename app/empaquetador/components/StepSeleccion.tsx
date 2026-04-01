'use client';

import { useMemo } from 'react';
import type { WizardState, WizardAction } from '@/app/empaquetador/hooks/useWizardReducer';
import type { HymnSearchResult } from '@/app/interfaces/Hymn.interface';
import SelectedHymnChip from '@/app/empaquetador/components/SelectedHymnChip';
import HymnExplorer from '@/app/components/HymnExplorer';
import {
  Badge,
  Button,
  ScrollArea,
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle,
} from '@/lib/shadcn/ui';
import { cn } from '@/app/lib/shadcn/utils';

interface StepSeleccionProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

export default function StepSeleccion({ state, dispatch }: StepSeleccionProps) {
  const selectedIdSet = useMemo(() => new Set(state.selectedHymns.map((h) => h.id)), [state.selectedHymns]);
  const hasSelectedHymns = state.selectedHymns.length > 0;

  const handleToggle = (hymn: HymnSearchResult) => {
    const isSelected = selectedIdSet.has(hymn.id);
    if (isSelected) {
      dispatch({ type: 'REMOVE_HYMN', hymnId: hymn.id });
    } else {
      dispatch({ type: 'ADD_HYMN', hymn });
    }
  };

  const mobileSelectedPanel = (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-slate-700">Mi Seleccion</h3>
        {hasSelectedHymns && <Badge variant="default" className="text-xs">{state.selectedHymns.length}</Badge>}
      </div>
      {hasSelectedHymns ? (
        <ScrollArea className="h-[50vh]" aria-label="Himnos seleccionados">
          <div className="space-y-0.5">
            {state.selectedHymns.map((hymn) => (
              <SelectedHymnChip key={hymn.id} hymn={hymn} onRemove={(hymnId) => dispatch({ type: 'REMOVE_HYMN', hymnId })} />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <p className="text-slate-400 text-sm py-4">Busca y selecciona himnos desde los resultados.</p>
      )}
    </div>
  );

  return (
    <div className="flex h-full overflow-hidden">
      <main className="flex-1 overflow-hidden flex flex-col">
        <HymnExplorer
          selectedIds={selectedIdSet}
          onToggle={handleToggle}
          selectedHymns={state.selectedHymns}
          className={cn('flex-1 flex flex-col overflow-hidden px-4 pt-8', hasSelectedHymns && 'pb-[132px] lg:pb-0')}
        />
      </main>

      {/* Drawer mobile */}
      <div className="lg:hidden">
        {hasSelectedHymns && (
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" className="fixed bottom-[72px] left-0 right-0 h-12 z-40 flex items-center justify-center gap-2 rounded-none border-x-0 border-b-0">
                <span className="text-sm font-semibold text-slate-700">Mi Seleccion</span>
                <Badge variant="default">{state.selectedHymns.length}</Badge>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="p-4">
                <DrawerTitle className="mb-3">Mi Seleccion</DrawerTitle>
                {mobileSelectedPanel}
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </div>
    </div>
  );
}
