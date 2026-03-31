import {
  RadioGroup,
  RadioGroupItem,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Checkbox,
  Label,
  Card,
  Separator,
} from '@/lib/shadcn/ui';
import type { WizardState, WizardAction } from '@/app/empaquetador/hooks/useWizardReducer';
import { AUDIO_FIELD_NAMES } from '@/app/empaquetador/hooks/useWizardReducer';
import type { HymnAudioFiles } from '@/app/interfaces/Hymn.interface';
import AudioTrackRow from './AudioTrackRow';
import { cn } from '@/app/lib/shadcn/utils';
import { Copy } from 'lucide-react';

/** Mapa de campo de audio a etiqueta en espanol (per UI-SPEC Section 9) */
const AUDIO_LABELS: Record<string, string> = {
  track_only: 'Pista completa',
  midi_file: 'MIDI',
  soprano_voice: 'Soprano',
  alto_voice: 'Alto',
  tenor_voice: 'Tenor',
  bass_voice: 'Bajo',
};

/** Preview HTML del layout de copias en miniatura */
function CopiesPreview({
  copies,
  fontSize,
  hymnName,
}: {
  copies: 2 | 4;
  fontSize: number;
  hymnName: string;
}) {
  // Escala relativa: fontSize 9 = base, rango 6-14
  const scale = fontSize / 9;
  const titleSize = Math.round(10 * scale);
  const bodySize = Math.round(7 * scale);

  const cellContent = (
    <div className="flex flex-col items-center justify-start p-2 overflow-hidden h-full">
      <p
        className="font-semibold text-slate-700 text-center leading-tight truncate w-full"
        style={{ fontSize: `${titleSize}px` }}
      >
        {hymnName}
      </p>
      <p
        className="text-slate-400 text-center mt-1 leading-tight"
        style={{ fontSize: `${bodySize}px` }}
      >
        Verso 1...
      </p>
    </div>
  );

  if (copies === 2) {
    return (
      <div
        className="bg-white border border-slate-200 rounded mx-auto overflow-hidden"
        style={{ aspectRatio: '8.5 / 11', maxWidth: 180 }}
      >
        <div className="flex h-full">
          <div className="flex-1 border-r border-dashed border-slate-300">{cellContent}</div>
          <div className="flex-1">{cellContent}</div>
        </div>
      </div>
    );
  }

  // 4 copies: 2x2 grid
  return (
    <div
      className="bg-white border border-slate-200 rounded mx-auto overflow-hidden"
      style={{ aspectRatio: '8.5 / 11', maxWidth: 180 }}
    >
      <div className="flex flex-col h-full">
        <div className="flex flex-1 border-b border-dashed border-slate-300">
          <div className="flex-1 border-r border-dashed border-slate-300">{cellContent}</div>
          <div className="flex-1">{cellContent}</div>
        </div>
        <div className="flex flex-1">
          <div className="flex-1 border-r border-dashed border-slate-300">{cellContent}</div>
          <div className="flex-1">{cellContent}</div>
        </div>
      </div>
    </div>
  );
}

interface StepConfiguracionProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

export default function StepConfiguracion({ state, dispatch }: StepConfiguracionProps) {
  // Calcular si todas las pistas disponibles estan seleccionadas
  const hymnsWithAudio = state.selectedHymns.filter((h) => h.hasAnyAudio);
  const allSelected =
    hymnsWithAudio.length > 0 &&
    hymnsWithAudio.every((hymn) => {
      const selectedSet = state.audioSelections.get(hymn.id);
      if (!selectedSet) return false;
      return AUDIO_FIELD_NAMES.every((field) => {
        if (hymn.audioFiles[field as keyof HymnAudioFiles] === null) return true;
        return selectedSet.has(field);
      });
    });

  return (
    <div className="space-y-6 py-4">
      <h2 className="text-xl font-semibold">Configurar Impresion y Audio</h2>

      {/* Seccion de impresion */}
      <Card className="p-4">
        <h3 className="text-base font-semibold mb-3">Impresion</h3>

        {/* Disposicion: oculta cuando copiesPerPage > 1 */}
        {state.copiesPerPage <= 1 && (
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Disposicion</Label>
            <RadioGroup
              value={state.layout}
              onValueChange={(v) =>
                dispatch({ type: 'SET_LAYOUT', layout: v as 'one-per-page' | 'two-per-page' })
              }
              className="flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="one-per-page" id="layout-one" />
                <Label htmlFor="layout-one" className="cursor-pointer">
                  1 himno por pagina
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="two-per-page" id="layout-two" />
                <Label htmlFor="layout-two" className="cursor-pointer">
                  2 himnos por pagina
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {state.copiesPerPage <= 1 && <Separator className="my-4" />}

        {/* Copias por pagina: visible solo con 1 himno seleccionado */}
        {state.selectedHymns.length === 1 && (
          <>
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Copy className="h-4 w-4" />
                Copias por Pagina
              </Label>
              <div className="flex gap-2">
                {([1, 2, 4] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => dispatch({ type: 'SET_COPIES_PER_PAGE', copiesPerPage: n })}
                    className={cn(
                      'flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                      state.copiesPerPage === n
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted hover:border-muted-foreground/30 text-muted-foreground',
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Tamano de fuente: solo visible cuando copies > 1 */}
              {state.copiesPerPage > 1 && (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Tamano de fuente</Label>
                    <span className="text-xs font-mono text-muted-foreground">{state.copiesFontSize}pt</span>
                  </div>
                  <input
                    type="range"
                    min={6}
                    max={14}
                    step={1}
                    value={state.copiesFontSize}
                    onChange={(e) =>
                      dispatch({ type: 'SET_COPIES_FONT_SIZE', copiesFontSize: Number(e.target.value) })
                    }
                    className="w-full accent-primary"
                  />
                </div>
              )}

              {/* Preview del layout de copias */}
              {state.copiesPerPage > 1 && (
                <div className="mt-3">
                  <Label className="text-xs text-muted-foreground mb-2 block">Vista previa</Label>
                  <CopiesPreview
                    copies={state.copiesPerPage as 2 | 4}
                    fontSize={state.copiesFontSize}
                    hymnName={state.selectedHymns[0]?.name ?? 'Himno'}
                  />
                </div>
              )}
            </div>

            <Separator className="my-4" />
          </>
        )}

        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">Estilo</Label>
          <RadioGroup
            value={state.style}
            onValueChange={(v) =>
              dispatch({ type: 'SET_STYLE', style: v as 'decorated' | 'plain' })
            }
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="decorated" id="style-decorated" />
              <Label htmlFor="style-decorated" className="cursor-pointer">
                Decorado
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="plain" id="style-plain" />
              <Label htmlFor="style-plain" className="cursor-pointer">
                Plano
              </Label>
            </div>
          </RadioGroup>
        </div>
      </Card>

      {/* Seccion de audio */}
      <Card className="p-4">
        <h3 className="text-base font-semibold mb-3">Audio</h3>

        {/* Seleccionar todas las pistas */}
        <div className="flex items-center gap-2 mb-4 min-h-[44px]">
          <Checkbox
            id="select-all-audio"
            checked={allSelected}
            onCheckedChange={(checked) =>
              dispatch({ type: 'SELECT_ALL_AUDIO', selectAll: Boolean(checked) })
            }
          />
          <Label htmlFor="select-all-audio" className="text-sm font-medium cursor-pointer">
            Seleccionar todas las pistas
          </Label>
        </div>

        <Accordion type="multiple" className="w-full">
          {state.selectedHymns.map((hymn) => {
            if (!hymn.hasAnyAudio) {
              return (
                <div key={hymn.id} className="flex items-center justify-between py-3 px-1">
                  <span className="text-sm">
                    Himno {hymn.hymn_number ?? '?'} - {hymn.name}
                  </span>
                  <p className="text-muted-foreground text-sm">Sin pistas disponibles</p>
                </div>
              );
            }

            return (
              <AccordionItem key={hymn.id} value={hymn.id}>
                <AccordionTrigger className="text-sm">
                  Himno {hymn.hymn_number ?? '?'} - {hymn.name}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 pl-2">
                    {AUDIO_FIELD_NAMES.map((field) => {
                      if (hymn.audioFiles[field as keyof HymnAudioFiles] === null) return null;
                      return (
                        <AudioTrackRow
                          key={field}
                          field={`${hymn.id}-${field}`}
                          label={AUDIO_LABELS[field] ?? field}
                          checked={state.audioSelections.get(hymn.id)?.has(field) ?? false}
                          onToggle={() =>
                            dispatch({ type: 'TOGGLE_AUDIO', hymnId: hymn.id, field })
                          }
                        />
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </Card>
    </div>
  );
}
