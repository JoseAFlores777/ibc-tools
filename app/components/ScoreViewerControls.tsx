'use client';

import { Play, Pause } from 'lucide-react';
import { Button, Slider, Progress } from '@/lib/shadcn/ui';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/lib/shadcn/ui';

interface ScoreViewerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  loadProgress: number;
  error: string | null;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
}

/** Formatea segundos a M:SS */
function fmt(s: number): string {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

export default function ScoreViewerControls({
  isPlaying,
  currentTime,
  duration,
  isLoading,
  loadProgress,
  error,
  onPlay,
  onPause,
  onSeek,
}: ScoreViewerControlsProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="bg-card border-t">
        <div className="flex items-center gap-3 p-3">
          {/* Play / Pause toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="default"
                className="h-11 w-11 rounded-full flex-shrink-0 cursor-pointer"
                onClick={isPlaying ? onPause : onPlay}
                disabled={isLoading}
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isPlaying ? 'Pausar' : 'Reproducir'}</TooltipContent>
          </Tooltip>

          {/* Seek bar */}
          <Slider
            className="flex-1"
            min={0}
            max={duration || 1}
            step={0.1}
            value={[currentTime]}
            onValueChange={(value) => onSeek(value[0])}
            disabled={isLoading || !duration}
            aria-label="Buscar en la pista"
          />

          {/* Time display */}
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {fmt(currentTime)} / {fmt(duration)}
          </span>
        </div>

        {/* SoundFont loading progress */}
        {isLoading && loadProgress > 0 && (
          <div className="px-3 pb-3 space-y-1">
            <Progress value={loadProgress} className="h-1.5" />
            <p className="text-xs text-muted-foreground tabular-nums">
              Descargando sonidos... {loadProgress}%
            </p>
          </div>
        )}

        {/* Audio error banner */}
        {error && (
          <div className="px-3 pb-3">
            <p className="text-xs text-muted-foreground">
              Audio no disponible. La partitura se puede ver pero no reproducir.
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
