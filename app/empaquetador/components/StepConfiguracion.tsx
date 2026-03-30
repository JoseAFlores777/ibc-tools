import {
  Checkbox,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Separator,
  Badge,
  Switch,
} from '@/lib/shadcn/ui';
import type { WizardState, WizardAction } from '@/app/empaquetador/hooks/useWizardReducer';
import { AUDIO_FIELD_NAMES } from '@/app/empaquetador/hooks/useWizardReducer';
import type { HymnAudioFiles } from '@/app/interfaces/Hymn.interface';
import AudioTrackRow from './AudioTrackRow';
import { cn } from '@/app/lib/shadcn/utils';
import {
  FileText,
  Grid2X2,
  Sparkles,
  LayoutList,
  Music,
  BookOpen,
  Smartphone,
  Type,
  ALargeSmall,
  ZoomIn,
  AlertTriangle,
} from 'lucide-react';

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
    <div className="h-full overflow-auto">
    <div className="max-w-5xl mx-auto px-4 py-8 pb-12">
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
            {/* Modo de Impresion */}
            <div>
              <Label className="text-xs font-semibold tracking-wide uppercase text-slate-400 mb-3 block">
                Modo de Impresion
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_PRINT_MODE', printMode: 'simple' })}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all min-h-[48px]',
                    state.printMode === 'simple'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600',
                  )}
                >
                  <FileText className="h-8 w-8" />
                  <span className="text-sm font-medium">Hoja Simple</span>
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_PRINT_MODE', printMode: 'booklet' })}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all min-h-[48px]',
                    state.printMode === 'booklet'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600',
                  )}
                >
                  <BookOpen className="h-8 w-8" />
                  <span className="text-sm font-medium">Booklet</span>
                </button>
              </div>
              {state.printMode === 'booklet' && (
                <p className="text-xs text-slate-500 mt-2">
                  Para imprimir: seleccione &quot;Ambos lados&quot; y &quot;Voltear en borde corto&quot;. Engrapadora al centro.
                </p>
              )}
            </div>

            <Separator />

            {/* Diseno de pagina - solo visible en modo simple */}
            {state.printMode === 'simple' && (
              <>
                <div>
                  <Label className="text-xs font-semibold tracking-wide uppercase text-slate-400 mb-3 block">
                    Diseno de Pagina
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'SET_LAYOUT', layout: 'one-per-page' })}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all min-h-[48px]',
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
                        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all min-h-[48px]',
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
              </>
            )}

            {/* Orientacion - solo visible en modo simple */}
            {state.printMode === 'simple' && (
              <>
                <div>
                  <Label className="text-xs font-semibold tracking-wide uppercase text-slate-400 mb-3 block">
                    Orientacion
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'SET_ORIENTATION', orientation: 'portrait' })}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all min-h-[48px]',
                        state.orientation === 'portrait'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600',
                      )}
                    >
                      <Smartphone className="h-8 w-8" />
                      <span className="text-sm font-medium">Vertical</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'SET_ORIENTATION', orientation: 'landscape' })}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all min-h-[48px]',
                        state.orientation === 'landscape'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600',
                      )}
                    >
                      <Smartphone className="h-8 w-8 rotate-90" />
                      <span className="text-sm font-medium">Horizontal</span>
                    </button>
                  </div>
                </div>

                <Separator />
              </>
            )}

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
                    'w-full text-left p-4 rounded-lg border-2 transition-all min-h-[48px]',
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
                    'w-full text-left p-4 rounded-lg border-2 transition-all min-h-[48px]',
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

            <Separator />

            {/* Fuente */}
            <div>
              <Label className="text-xs font-semibold tracking-wide uppercase text-slate-400 mb-3 block">
                Fuente
              </Label>
              <div className="space-y-3">
                {([
                  { value: 'clasica' as const, label: 'Clasica', desc: 'Tipografia serif elegante (Adamina)', icon: Type },
                  { value: 'moderna' as const, label: 'Moderna', desc: 'Tipografia sans-serif limpia (Helvetica)', icon: ALargeSmall },
                  { value: 'legible' as const, label: 'Legible', desc: 'Tamano grande para lectura facil', icon: ZoomIn },
                ]).map(({ value, label, desc, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => dispatch({ type: 'SET_FONT_PRESET', fontPreset: value })}
                    className={cn(
                      'w-full text-left p-4 rounded-lg border-2 transition-all min-h-[48px]',
                      state.fontPreset === value
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 hover:border-slate-300',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={cn('h-4 w-4', state.fontPreset === value ? 'text-primary' : 'text-slate-500')} />
                      <span className={cn('text-sm font-semibold', state.fontPreset === value ? 'text-primary' : 'text-slate-700')}>
                        {label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 pl-6">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Referencia biblica */}
            <div className="flex items-center gap-3">
              <Switch
                id="include-bible-ref"
                checked={state.includeBibleRef}
                onCheckedChange={(checked) =>
                  dispatch({ type: 'SET_INCLUDE_BIBLE_REF', includeBibleRef: Boolean(checked) })
                }
              />
              <div>
                <Label htmlFor="include-bible-ref" className="text-sm cursor-pointer">
                  Incluir referencia biblica
                </Label>
                <p className="text-xs text-slate-500">Muestra el texto y cita biblica en el PDF</p>
              </div>
            </div>

            {/* Booklet warning */}
            {state.printMode === 'booklet' && state.selectedHymns.length > 40 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-600">
                  Los booklets con mas de 40 paginas son dificiles de engrapar. Considere dividir en varios paquetes.
                </p>
              </div>
            )}
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
            <div className="flex items-center gap-2 mb-4 min-h-[48px]">
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
    </div>
  );
}
