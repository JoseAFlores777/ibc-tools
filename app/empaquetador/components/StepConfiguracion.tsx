import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
  Calendar,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/lib/shadcn/ui';
import { Input } from '@/app/lib/shadcn/ui/input';
import { Textarea } from '@/app/lib/shadcn/ui/textarea';
import { Button } from '@/app/lib/shadcn/ui/button';
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
  CalendarIcon,
  Copy,
} from 'lucide-react';

/** Formatea una Date como "30 de marzo del 2026" */
function formatDateEs(date: Date): string {
  const day = date.getDate();
  const month = format(date, 'MMMM', { locale: es });
  const year = date.getFullYear();
  return `${day} de ${month} del ${year}`;
}

/** Mapa de campo de audio a etiqueta en espanol */
const AUDIO_LABELS: Record<string, string> = {
  track_only: 'Pista completa',
  midi_file: 'MIDI',
  soprano_voice: 'Soprano',
  alto_voice: 'Alto',
  tenor_voice: 'Tenor',
  bass_voice: 'Bajo',
};

/** Preview HTML del layout de copias — refleja orientación y usa texto de ejemplo */
function CopiesPreview({
  copies,
  fontSize,
  hymnName,
  hymnNumber,
  orientation,
}: {
  copies: 1 | 2 | 4;
  fontSize: number;
  hymnName: string;
  hymnNumber: number | null;
  orientation: 'portrait' | 'landscape';
}) {
  const isLandscape = orientation === 'landscape';
  const scale = fontSize / 9;
  const titleSize = Math.round(9 * scale);
  const markerSize = Math.round(7 * scale);
  const bodySize = Math.round(6 * scale);

  const title = hymnNumber != null ? `# ${hymnNumber}  ${hymnName}` : hymnName;

  const cellContent = (
    <div className="flex flex-col items-center justify-start p-1.5 overflow-hidden h-full">
      <p
        className="font-bold text-slate-700 text-center leading-tight w-full uppercase"
        style={{ fontSize: `${titleSize}px` }}
      >
        {title}
      </p>
      <p className="text-amber-600 text-center font-semibold mt-1" style={{ fontSize: `${markerSize}px` }}>I</p>
      <div className="text-slate-500 text-center leading-snug mt-0.5 w-full" style={{ fontSize: `${bodySize}px` }}>
        <p>LA CREACION NO PUEDO EXPLICARLA,</p>
        <p>NI LOS PLANETAS EN SU ENORMIDAD;</p>
        <p>CONTAR LA ARENA DE LA MAR NO PUEDO,</p>
        <p>NI LAS ESTRELLAS DE LA ANTIGUEDAD.</p>
      </div>
      <p className="text-amber-600 text-center font-semibold mt-1" style={{ fontSize: `${markerSize}px` }}>CORO</p>
      <div className="text-slate-500 text-center leading-snug mt-0.5 w-full" style={{ fontSize: `${bodySize}px` }}>
        <p>LO IMPOSIBLE OBRA NUESTRO DIOS,</p>
        <p>CONTROLANDO EL MUNDO ESTA;</p>
      </div>
    </div>
  );

  const aspect = isLandscape ? '11 / 8.5' : '8.5 / 11';
  const maxW = isLandscape ? 240 : 180;

  if (copies <= 1) {
    return (
      <div
        className="bg-white border border-slate-200 rounded mx-auto overflow-hidden shadow-sm"
        style={{ aspectRatio: aspect, maxWidth: maxW }}
      >
        {cellContent}
      </div>
    );
  }

  if (copies === 2) {
    return (
      <div
        className="bg-white border border-slate-200 rounded mx-auto overflow-hidden shadow-sm"
        style={{ aspectRatio: aspect, maxWidth: maxW }}
      >
        <div className="flex h-full">
          <div className="flex-1 border-r border-dashed border-slate-400">{cellContent}</div>
          <div className="flex-1">{cellContent}</div>
        </div>
      </div>
    );
  }

  // 4 copies: 2x2 grid
  return (
    <div
      className="bg-white border border-slate-200 rounded mx-auto overflow-hidden shadow-sm"
      style={{ aspectRatio: aspect, maxWidth: maxW }}
    >
      <div className="flex flex-col h-full">
        <div className="flex flex-1 border-b border-dashed border-slate-400">
          <div className="flex-1 border-r border-dashed border-slate-400">{cellContent}</div>
          <div className="flex-1">{cellContent}</div>
        </div>
        <div className="flex flex-1">
          <div className="flex-1 border-r border-dashed border-slate-400">{cellContent}</div>
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
  const [datePickerOpen, setDatePickerOpen] = useState(false);
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

            {/* Campos de portada - solo visible en modo booklet */}
            {state.printMode === 'booklet' && (
              <>
                <Separator />
                <div>
                  <Label className="text-xs font-semibold tracking-wide uppercase text-slate-400 mb-3 block">
                    Portada del Booklet
                  </Label>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="booklet-title" className="text-xs text-slate-600 mb-1 block">
                        Titulo
                      </Label>
                      <Input
                        id="booklet-title"
                        placeholder="Ej: Himnos de Alabanza"
                        value={state.bookletTitle}
                        onChange={(e) => dispatch({ type: 'SET_BOOKLET_TITLE', bookletTitle: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="booklet-subtitle" className="text-xs text-slate-600 mb-1 block">
                        Subtitulo
                      </Label>
                      <Input
                        id="booklet-subtitle"
                        placeholder="Ej: Servicio dominical"
                        value={state.bookletSubtitle}
                        onChange={(e) => dispatch({ type: 'SET_BOOKLET_SUBTITLE', bookletSubtitle: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600 mb-1 block">
                        Fecha
                      </Label>
                      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal h-9 text-sm',
                              !state.bookletDate && 'text-muted-foreground',
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {state.bookletDate || 'Seleccionar fecha'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={state.bookletDate ? new Date(state.bookletDate) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                dispatch({ type: 'SET_BOOKLET_DATE', bookletDate: formatDateEs(date) });
                              }
                              setDatePickerOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="booklet-bible-ref" className="text-xs text-slate-600 mb-1 block">
                        Referencia biblica
                      </Label>
                      <Textarea
                        id="booklet-bible-ref"
                        placeholder="Ej: Cantad a Jehova cantico nuevo — Salmo 96:1"
                        value={state.bookletBibleRef}
                        onChange={(e) => dispatch({ type: 'SET_BOOKLET_BIBLE_REF', bookletBibleRef: e.target.value })}
                        className="text-sm min-h-[60px]"
                        rows={2}
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      Deje en blanco para usar valores automaticos.
                    </p>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Copias por pagina - solo visible con 1 himno y modo simple */}
            {state.selectedHymns.length === 1 && state.printMode === 'simple' && (
              <>
                <div>
                  <Label className="text-xs font-semibold tracking-wide uppercase text-slate-400 mb-3 block">
                    <span className="flex items-center gap-1.5">
                      <Copy className="h-4 w-4" />
                      Copias por Pagina
                    </span>
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
                            : 'border-slate-200 hover:border-slate-300 text-slate-600',
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  {/* Tamano de fuente: solo visible cuando copies > 1 */}
                  {state.copiesPerPage > 1 && (
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-slate-500">Tamano de fuente</Label>
                        <span className="text-xs font-mono text-slate-500">{state.copiesFontSize}pt</span>
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

                </div>

                <Separator />
              </>
            )}

            {/* Diseno de pagina - solo visible en modo simple y copiesPerPage <= 1 */}
            {state.printMode === 'simple' && state.copiesPerPage <= 1 && (
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

            {/* Vista previa de copias — debajo de orientación */}
            {state.selectedHymns.length === 1 && state.printMode === 'simple' && (
              <>
                <div>
                  <Label className="text-xs font-semibold tracking-wide uppercase text-slate-400 mb-3 block">
                    Vista Previa
                  </Label>
                  <CopiesPreview
                    copies={state.copiesPerPage}
                    fontSize={state.copiesFontSize}
                    hymnName={state.selectedHymns[0]?.name ?? 'Himno'}
                    hymnNumber={state.selectedHymns[0]?.hymn_number ?? null}
                    orientation={state.orientation}
                  />
                  {state.copiesPerPage > 1 && (
                    <p className="text-xs text-slate-400 text-center mt-2">
                      Lineas punteadas = guia de corte
                    </p>
                  )}
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
                  onClick={() => dispatch({ type: 'SET_STYLE', style: 'decorated-eco' })}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border-2 transition-all min-h-[48px]',
                    state.style === 'decorated-eco'
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-slate-300',
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles
                      className={cn(
                        'h-4 w-4',
                        state.style === 'decorated-eco' ? 'text-primary' : 'text-slate-500',
                      )}
                    />
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        state.style === 'decorated-eco' ? 'text-primary' : 'text-slate-700',
                      )}
                    >
                      Decorada Economica
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 pl-6">
                    Misma estructura decorada sin fondos de color. Ahorra tinta.
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
