import {
  Checkbox,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Separator,
  Badge,
} from '@/lib/shadcn/ui';
import type { WizardState, WizardAction } from '@/app/empaquetador/hooks/useWizardReducer';
import { AUDIO_FIELD_NAMES } from '@/app/empaquetador/hooks/useWizardReducer';
import type { HymnAudioFiles } from '@/app/interfaces/Hymn.interface';
import AudioTrackRow from './AudioTrackRow';
import { cn } from '@/app/lib/shadcn/utils';
import { FileText, Grid2X2, Sparkles, LayoutList, Music } from 'lucide-react';

/** Mapa de campo de audio a etiqueta en espanol */
const AUDIO_LABELS: Record<string, string> = {
  track_only: 'Pista completa',
  midi_file: 'MIDI',
  soprano_voice: 'Soprano',
  alto_voice: 'Alto',
  tenor_voice: 'Tenor',
  bass_voice: 'Bajo',
};

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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Configurar Impresion y Audio</h2>
      <p className="text-slate-500 text-sm mb-8">
        Personalice el formato de su PDF y seleccione las pistas de audio.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda: Ajustes de impresion */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-primary" />
              Ajustes de Impresion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Diseno de pagina */}
            <div>
              <Label className="text-xs font-semibold tracking-wide uppercase text-slate-400 mb-3 block">
                Diseno de Pagina
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_LAYOUT', layout: 'one-per-page' })}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all min-h-[44px]',
                    state.layout === 'one-per-page'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600',
                  )}
                >
                  <LayoutList className="h-8 w-8" />
                  <span className="text-sm font-medium">1 Himno</span>
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_LAYOUT', layout: 'two-per-page' })}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all min-h-[44px]',
                    state.layout === 'two-per-page'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600',
                  )}
                >
                  <Grid2X2 className="h-8 w-8" />
                  <span className="text-sm font-medium">2 Himnos</span>
                </button>
              </div>
            </div>

            <Separator />

            {/* Estilo visual */}
            <div>
              <Label className="text-xs font-semibold tracking-wide uppercase text-slate-400 mb-3 block">
                Estilo Visual
              </Label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_STYLE', style: 'decorated' })}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border-2 transition-all min-h-[44px]',
                    state.style === 'decorated'
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-slate-300',
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles
                      className={cn(
                        'h-4 w-4',
                        state.style === 'decorated' ? 'text-primary' : 'text-slate-500',
                      )}
                    />
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        state.style === 'decorated' ? 'text-primary' : 'text-slate-700',
                      )}
                    >
                      Diseno Institucional (IBC)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 pl-6">
                    Encabezados con marca, tipografia editorial y bordes elegantes.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_STYLE', style: 'plain' })}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border-2 transition-all min-h-[44px]',
                    state.style === 'plain'
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-slate-300',
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileText
                      className={cn(
                        'h-4 w-4',
                        state.style === 'plain' ? 'text-primary' : 'text-slate-500',
                      )}
                    />
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        state.style === 'plain' ? 'text-primary' : 'text-slate-700',
                      )}
                    >
                      Texto Simple
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 pl-6">
                    Minimalista, sin elementos graficos. Ideal para ahorro de tinta.
                  </p>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Columna derecha: Seleccion de audios */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Music className="h-5 w-5 text-primary" />
                Seleccion de Audios
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {state.selectedHymns.length} himno{state.selectedHymns.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
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

            <Separator className="mb-4" />

            <div className="space-y-4">
              {state.selectedHymns.map((hymn, index) => (
                <div key={hymn.id}>
                  {/* Nombre del himno */}
                  <div className="flex items-center gap-2 mb-2">
                    {hymn.hymn_number !== null && (
                      <span className="flex-shrink-0 w-7 h-7 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center">
                        {hymn.hymn_number}
                      </span>
                    )}
                    <span className="text-sm font-medium text-slate-700">{hymn.name}</span>
                  </div>

                  {!hymn.hasAnyAudio ? (
                    <p className="text-xs text-slate-400 ml-9">Sin pistas disponibles</p>
                  ) : (
                    <>
                      <Label className="text-[10px] font-semibold tracking-wide uppercase text-slate-400 ml-9 mb-2 block">
                        Pistas Disponibles
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 ml-9">
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
                    </>
                  )}

                  {/* Separador entre himnos */}
                  {index < state.selectedHymns.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
