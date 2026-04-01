'use client';

import { useState, useEffect, useRef } from 'react';
import type { HymnSearchResult, AudioFileInfo } from '@/app/interfaces/Hymn.interface';
import type { HymnForPdf } from '@/app/interfaces/Hymn.interface';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
} from '@/lib/shadcn/ui';
import { cn } from '@/app/lib/shadcn/utils';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import {
  BookOpen,
  User,
  Play,
  Pause,
  Volume2,
  Download,
  Copy,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Music,
  Check,
  Plus,
  Presentation,
  Monitor,
  Film,
} from 'lucide-react';

interface HymnDetailViewProps {
  hymn: HymnSearchResult;
  onBack: () => void;
  /** Lista de resultados para navegación prev/next */
  results: HymnSearchResult[];
  /** Callback para navegar a otro himno */
  onNavigate: (hymn: HymnSearchResult) => void;
  /** Si el himno actual está seleccionado en el empaquetador */
  isSelected: boolean;
  /** Toggle selección */
  onToggleSelect: (hymn: HymnSearchResult) => void;
  /** Sincronizar la tabla con el himno actual al navegar */
  onSyncPage?: (hymnIndex: number) => void;
}

const AUDIO_LABELS: Record<string, string> = {
  track_only: 'Pista completa',
  midi_file: 'MIDI',
  soprano_voice: 'Soprano',
  alto_voice: 'Alto',
  tenor_voice: 'Tenor',
  bass_voice: 'Bajo',
};

const AUDIO_COLORS: Record<string, string> = {
  track_only: 'bg-primary/5 text-primary border-primary/15 hover:border-primary/30',
  midi_file: 'bg-amber-50/80 text-amber-700 border-amber-200/60 hover:border-amber-300',
  soprano_voice: 'bg-rose-50/80 text-rose-700 border-rose-200/60 hover:border-rose-300',
  alto_voice: 'bg-violet-50/80 text-violet-700 border-violet-200/60 hover:border-violet-300',
  tenor_voice: 'bg-sky-50/80 text-sky-700 border-sky-200/60 hover:border-sky-300',
  bass_voice: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/60 hover:border-emerald-300',
};

const NON_PLAYABLE = new Set(['midi_file']);

/** Reproductor individual con progress bar accesible */
function AudioTrackPlayer({ field, fileInfo }: { field: string; fileInfo: AudioFileInfo }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const audioUrl = `/api/hymns/audio/${fileInfo.id}`;
  const label = AUDIO_LABELS[field] ?? field;

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play();
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    setProgress((audio.currentTime / audio.duration) * 100);
    setCurrentTime(audio.currentTime);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * audio.duration;
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      'rounded-xl border p-3 transition-all duration-200',
      AUDIO_COLORS[field] ?? 'bg-slate-50 text-slate-700 border-slate-200',
    )}>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrentTime(0); }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? `Pausar ${label}` : `Reproducir ${label}`}
          className={cn(
            'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200',
            playing
              ? 'bg-current/10 hover:bg-current/20'
              : 'bg-current/10 hover:bg-current/20',
          )}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold">{label}</span>
            <span className="text-[10px] tabular-nums opacity-60">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          {/* Progress bar — 6px height + 16px padding for touch target */}
          <div
            className="py-2 -my-2 cursor-pointer"
            onClick={handleSeek}
            role="slider"
            aria-label={`Progreso de ${label}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <div className="h-1.5 rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-current transition-[width] duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <a
          href={audioUrl}
          download={fileInfo.filename_download || `${field}.mp3`}
          aria-label={`Descargar ${label}`}
          className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 opacity-40 hover:opacity-100 hover:bg-black/5 transition-all duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <Download className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

function htmlToPlainText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

/** Cache en memoria para detalles de himnos ya cargados */
const detailsCache = new Map<string, HymnForPdf>();

export default function HymnDetailView({ hymn, onBack, results, onNavigate, isSelected, onToggleSelect, onSyncPage }: HymnDetailViewProps) {
  const [details, setDetails] = useState<HymnForPdf | null>(detailsCache.get(hymn.id) ?? null);
  const [loading, setLoading] = useState(!detailsCache.has(hymn.id));
  const abortRef = useRef<AbortController | null>(null);

  // Fetch con debounce para navegación rápida — cancela peticiones obsoletas
  useEffect(() => {
    // Si ya está en cache, usar directamente
    if (detailsCache.has(hymn.id)) {
      setDetails(detailsCache.get(hymn.id)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    setDetails(null);

    // Debounce: esperar 150ms antes de hacer fetch (navegación rápida con flechas)
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      fetch(`/api/hymns/${hymn.id}`, { signal: controller.signal })
        .then((r) => {
          if (!r.ok) throw new Error('Error fetching');
          return r.json();
        })
        .then((json) => {
          const data = json.data ?? null;
          if (data) detailsCache.set(hymn.id, data);
          if (!controller.signal.aborted) setDetails(data);
        })
        .catch((err) => {
          if (err.name === 'AbortError') return;
          console.error('Error al cargar detalle:', err);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 150);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [hymn.id]);

  // Navegación prev/next dentro de los resultados
  const currentIndex = results.findIndex((r) => r.id === hymn.id);
  const prevHymn = currentIndex > 0 ? results[currentIndex - 1] : null;
  const nextHymn = currentIndex < results.length - 1 ? results[currentIndex + 1] : null;

  // Sincronizar la página de la tabla con el himno actual
  useEffect(() => {
    if (onSyncPage && currentIndex >= 0) {
      onSyncPage(currentIndex);
    }
  }, [currentIndex, onSyncPage]);

  // Prefetch diferido del siguiente himno
  useEffect(() => {
    if (!nextHymn || detailsCache.has(nextHymn.id)) return;

    const timer = setTimeout(() => {
      fetch(`/api/hymns/${nextHymn.id}`)
        .then((r) => r.ok ? r.json() : null)
        .then((json) => {
          if (json?.data) detailsCache.set(nextHymn.id, json.data);
        })
        .catch(() => {});
    }, 500);

    return () => clearTimeout(timer);
  }, [nextHymn]);

  const availableAudio = Object.entries(hymn.audioFiles).filter(
    (entry): entry is [string, AudioFileInfo] => entry[1] !== null,
  );

  // Atajos de teclado para navegar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && prevHymn) onNavigate(prevHymn);
      if (e.key === 'ArrowRight' && nextHymn) onNavigate(nextHymn);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prevHymn, nextHymn, onNavigate]);

  const handleCopyLetter = () => {
    if (!details?.letter_hymn) return;
    const text = htmlToPlainText(details.letter_hymn);
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Letra copiada al portapapeles');
    });
  };

  const handleCopyVerse = () => {
    if (!details?.bible_reference) return;
    const text = details.bible_text
      ? `${details.bible_reference}\n"${details.bible_text}"`
      : details.bible_reference;
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Versículo copiado al portapapeles');
    });
  };

  const handleExport = (format: string) => {
    const url = `/api/hymns/${hymn.id}/export?format=${format}`;
    window.open(url, '_blank');
  };

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8">
      {/* Top bar: breadcrumb + navegación + seleccionar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Breadcrumb */}
        <nav aria-label="Navegación" className="flex items-center gap-1.5 text-sm min-w-0">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-slate-700 transition-colors duration-200 flex items-center gap-1 cursor-pointer min-h-[44px] flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Explorar Himnario</span>
            <span className="sm:hidden">Volver</span>
          </button>
          <ChevronRight className="h-3 w-3 text-slate-300 flex-shrink-0" />
          <span className="text-slate-600 font-medium truncate">
            {hymn.hymn_number !== null && `#${hymn.hymn_number} — `}{hymn.name}
          </span>
        </nav>

        {/* Navegación prev/next + seleccionar */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Contador de posición */}
          {results.length > 1 && (
            <span className="hidden sm:inline text-xs text-slate-400 tabular-nums">
              {currentIndex + 1} / {results.length}
            </span>
          )}

          {/* Prev */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 cursor-pointer"
            disabled={!prevHymn}
            onClick={() => prevHymn && onNavigate(prevHymn)}
            aria-label="Himno anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Next */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 cursor-pointer"
            disabled={!nextHymn}
            onClick={() => nextHymn && onNavigate(nextHymn)}
            aria-label="Himno siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Seleccionar / Deseleccionar */}
          <Button
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            className="min-h-[36px] cursor-pointer gap-1.5"
            onClick={() => onToggleSelect(hymn)}
          >
            {isSelected ? (
              <>
                <Check className="h-4 w-4" />
                <span className="hidden sm:inline">Seleccionado</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Seleccionar</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start gap-4 sm:gap-5 mb-4">
          {hymn.hymn_number !== null && (
            <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-3xl font-bold text-primary leading-none">{hymn.hymn_number}</span>
            </div>
          )}
          <div className="min-w-0 pt-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-2">{hymn.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              {hymn.hymnal && (
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-slate-400" />
                  {hymn.hymnal.name}
                </span>
              )}
              {details?.authors && details.authors.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-slate-400" />
                  {details.authors.map((a) => a.authors_id?.name).filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Categorias */}
        {hymn.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {hymn.categories.map((cat) =>
              cat.hymn_categories_id ? (
                <Badge key={cat.hymn_categories_id.id} variant="secondary" className="text-[11px] font-normal">
                  {cat.hymn_categories_id.name}
                </Badge>
              ) : null,
            )}
          </div>
        )}
      </header>

      <Separator className="mb-8" />

      {loading ? (
        /* Skeleton que refleja el layout real */
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse bg-slate-100 rounded-md h-4" style={{ width: `${95 - (i % 3) * 15}%` }} />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-slate-100 rounded-xl h-16" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* En mobile: audio primero, letra después */}
          <div className="lg:hidden space-y-6 mb-8">
            {/* Referencia biblica (mobile) */}
            {details?.bible_reference && (
              <Card className="border-amber-200/60 bg-amber-50/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-amber-800">{details.bible_reference}</p>
                      {details.bible_text && (
                        <p className="text-sm text-amber-700/80 italic mt-1.5 leading-relaxed">
                          &ldquo;{details.bible_text}&rdquo;
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleCopyVerse}
                      className="flex-shrink-0 p-1.5 rounded-md text-amber-500 hover:text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                      aria-label="Copiar versículo"
                      title="Copiar versículo"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audio (mobile — arriba de la letra) */}
            {availableAudio.length > 0 && (
              <div>
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  <Volume2 className="h-3.5 w-3.5" />
                  Pistas de Audio
                </h3>
                <div className="space-y-2">
                  {availableAudio.map(([field, info]) =>
                    NON_PLAYABLE.has(field) ? (
                      <a
                        key={field}
                        href={`/api/hymns/audio/${info.id}`}
                        download={info.filename_download || 'midi.mid'}
                        aria-label={`Descargar ${AUDIO_LABELS[field]}`}
                        className={cn(
                          'rounded-xl border p-3 flex items-center gap-3 transition-all duration-200 cursor-pointer',
                          AUDIO_COLORS[field],
                        )}
                      >
                        <Download className="h-4 w-4 flex-shrink-0" />
                        <span className="text-xs font-semibold">{AUDIO_LABELS[field]}</span>
                        <span className="text-[10px] opacity-60 ml-auto">Descargar</span>
                      </a>
                    ) : (
                      <AudioTrackPlayer key={field} field={field} fileInfo={info} />
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop: layout 2 columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 lg:gap-10">
            {/* Columna izquierda: Letra (2/3) */}
            <div className="min-w-0">
              {/* Referencia biblica (desktop) */}
              {details?.bible_reference && (
                <Card className="border-amber-200/60 bg-amber-50/50 mb-8 hidden lg:block">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-amber-800">{details.bible_reference}</p>
                    {details.bible_text && (
                      <p className="text-sm text-amber-700/80 italic mt-1.5 leading-relaxed">
                        &ldquo;{details.bible_text}&rdquo;
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Letra */}
              {details?.letter_hymn ? (
                <article>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Letra del Himno
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyLetter}
                      className="h-8 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <Copy className="h-3 w-3 mr-1.5" />
                      Copiar
                    </Button>
                  </div>
                  <div
                    className="max-w-prose text-[15px] text-slate-800 leading-[1.85]
                      [&_p]:mb-5
                      [&_p:empty]:mb-2 [&_p:empty]:h-2
                      [&_strong]:font-semibold [&_strong]:text-slate-500 [&_strong]:tracking-wide [&_strong]:uppercase [&_strong]:text-[11px] [&_strong]:block [&_strong]:mt-2 [&_strong]:mb-1
                      [&_em]:italic [&_em]:text-slate-500
                      selection:bg-primary/10 selection:text-primary"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(details.letter_hymn) }}
                  />
                </article>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText className="h-10 w-10 text-slate-200 mb-3" />
                  <p className="text-sm text-slate-400">Letra no disponible para este himno.</p>
                </div>
              )}
            </div>

            {/* Columna derecha: Audio + Exportar (1/3) — sticky, hidden en mobile (ya se muestra arriba) */}
            <aside className="hidden lg:block">
              <div className="sticky top-6 space-y-6">
                {/* Pistas de audio */}
                {availableAudio.length > 0 ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                        <Volume2 className="h-4 w-4 text-primary" />
                        Pistas de Audio
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      {availableAudio.map(([field, info]) =>
                        NON_PLAYABLE.has(field) ? (
                          <a
                            key={field}
                            href={`/api/hymns/audio/${info.id}`}
                            download={info.filename_download || 'midi.mid'}
                            aria-label={`Descargar ${AUDIO_LABELS[field]}`}
                            className={cn(
                              'rounded-xl border p-3 flex items-center gap-3 transition-all duration-200 cursor-pointer',
                              AUDIO_COLORS[field],
                            )}
                          >
                            <Download className="h-4 w-4 flex-shrink-0" />
                            <span className="text-xs font-semibold">{AUDIO_LABELS[field]}</span>
                            <span className="text-[10px] opacity-60 ml-auto">Descargar</span>
                          </a>
                        ) : (
                          <AudioTrackPlayer key={field} field={field} fileInfo={info} />
                        ),
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Music className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Sin pistas de audio disponibles.</p>
                    </CardContent>
                  </Card>
                )}

                {/* Exportar */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700">Exportar</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    <Button
                      variant="outline"
                      onClick={() => handleExport('pdf-decorated')}
                      className="w-full justify-start min-h-[44px] cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4 mr-2 text-primary" />
                      <div className="text-left">
                        <span className="text-sm font-medium block">PDF Decorado</span>
                        <span className="text-[10px] text-slate-400">Con diseno institucional</span>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleExport('pdf-plain')}
                      className="w-full justify-start min-h-[44px] cursor-pointer"
                    >
                      <FileText className="h-4 w-4 mr-2 text-slate-400" />
                      <div className="text-left">
                        <span className="text-sm font-medium block">PDF Plano</span>
                        <span className="text-[10px] text-slate-400">Ahorra tinta</span>
                      </div>
                    </Button>

                    <Separator className="my-2" />

                    <Button
                      variant="outline"
                      onClick={() => handleExport('pptx')}
                      className="w-full justify-start min-h-[44px] cursor-pointer"
                    >
                      <Presentation className="h-4 w-4 mr-2 text-orange-500" />
                      <div className="text-left">
                        <span className="text-sm font-medium block">PowerPoint</span>
                        <span className="text-[10px] text-slate-400">Presentacion editable (.pptx)</span>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleExport('presentation-pdf')}
                      className="w-full justify-start min-h-[44px] cursor-pointer"
                    >
                      <Monitor className="h-4 w-4 mr-2 text-blue-500" />
                      <div className="text-left">
                        <span className="text-sm font-medium block">Presentacion PDF</span>
                        <span className="text-[10px] text-slate-400">Diapositivas para proyector</span>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleExport('pro6')}
                      className="w-full justify-start min-h-[44px] cursor-pointer"
                    >
                      <Film className="h-4 w-4 mr-2 text-purple-500" />
                      <div className="text-left">
                        <span className="text-sm font-medium block">ProPresenter</span>
                        <span className="text-[10px] text-slate-400">Archivo .pro6 importable</span>
                      </div>
                    </Button>

                    {details?.letter_hymn && (
                      <>
                        <Separator className="my-2" />
                        <Button
                          variant="outline"
                          onClick={handleCopyLetter}
                          className="w-full justify-start min-h-[44px] cursor-pointer"
                        >
                          <Copy className="h-4 w-4 mr-2 text-slate-400" />
                          <div className="text-left">
                            <span className="text-sm font-medium block">Copiar letra</span>
                            <span className="text-[10px] text-slate-400">Texto plano</span>
                          </div>
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Quick stats */}
                <div className="text-[11px] text-slate-400 space-y-0.5 px-1">
                  {hymn.hymnal && <p>Himnario: {hymn.hymnal.name}</p>}
                  <p>{hymn.categories.length} categoría{hymn.categories.length !== 1 ? 's' : ''}</p>
                  <p>{availableAudio.length} pista{availableAudio.length !== 1 ? 's' : ''} de audio</p>
                </div>
              </div>
            </aside>
          </div>

          {/* Mobile: Exportar (bottom) */}
          <div className="lg:hidden mt-8">
            <Separator className="mb-6" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Exportar
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => handleExport('pdf-decorated')}
                className="min-h-[44px] cursor-pointer"
              >
                <Sparkles className="h-4 w-4 mr-1.5 text-primary" />
                Decorado
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('pdf-plain')}
                className="min-h-[44px] cursor-pointer"
              >
                <FileText className="h-4 w-4 mr-1.5" />
                Plano
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('pptx')}
                className="min-h-[44px] cursor-pointer"
              >
                <Presentation className="h-4 w-4 mr-1.5 text-orange-500" />
                PowerPoint
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('presentation-pdf')}
                className="min-h-[44px] cursor-pointer"
              >
                <Monitor className="h-4 w-4 mr-1.5 text-blue-500" />
                Presentacion
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('pro6')}
                className="col-span-2 min-h-[44px] cursor-pointer"
              >
                <Film className="h-4 w-4 mr-1.5 text-purple-500" />
                ProPresenter
              </Button>
              {details?.letter_hymn && (
                <Button
                  variant="outline"
                  onClick={handleCopyLetter}
                  className="col-span-2 min-h-[44px] cursor-pointer"
                >
                  <Copy className="h-4 w-4 mr-1.5" />
                  Copiar letra
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
