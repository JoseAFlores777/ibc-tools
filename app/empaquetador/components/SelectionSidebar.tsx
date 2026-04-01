'use client';

import { useState } from 'react';
import type { WizardState, WizardAction } from '@/app/empaquetador/hooks/useWizardReducer';
import SelectedHymnChip from '@/app/empaquetador/components/SelectedHymnChip';
import { Badge, Button, ScrollArea } from '@/lib/shadcn/ui';
import { History, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { ToolSettingsButton } from '@/app/components/LocalStorageWarning';

interface SelectionSidebarProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  onShowHistory?: () => void;
}

export default function SelectionSidebar({ state, dispatch, onShowHistory }: SelectionSidebarProps) {
  const [open, setOpen] = useState(true);
  const hasSelected = state.selectedHymns.length > 0;

  return (
    <aside className={`hidden lg:flex lg:flex-col flex-shrink-0 border-r border-slate-200 bg-white transition-all duration-300 ${open ? 'w-[280px]' : 'w-[48px]'}`}>
      {open ? (
        <>
          <div className="p-4 flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-700">Mi Selección</h3>
                {hasSelected && (
                  <Badge variant="default" className="text-xs">
                    {state.selectedHymns.length}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="h-7 w-7 text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Colapsar panel"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
            {hasSelected ? (
              <ScrollArea className="flex-1" aria-label="Himnos seleccionados">
                <div className="space-y-0.5">
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
              <p className="text-slate-400 text-xs py-4">
                Busca y selecciona himnos.
              </p>
            )}
          </div>
          <div className="px-3 py-2 border-t border-slate-200 flex-shrink-0 flex items-center gap-1">
            {onShowHistory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onShowHistory}
                className="flex-1 justify-start h-8 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <History className="h-3.5 w-3.5 mr-2" />
                Historial
              </Button>
            )}
            <ToolSettingsButton tool="empaquetador" />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center pt-3 gap-2 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            className="h-8 w-8 text-slate-400 hover:text-slate-700 cursor-pointer"
            aria-label="Expandir panel"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
          {hasSelected && (
            <Badge variant="default" className="text-[10px] px-1.5">
              {state.selectedHymns.length}
            </Badge>
          )}
          {onShowHistory && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onShowHistory}
              className="h-8 w-8 text-slate-400 hover:text-slate-700 cursor-pointer mt-auto mb-2"
              aria-label="Historial"
              title="Historial"
            >
              <History className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </aside>
  );
}
