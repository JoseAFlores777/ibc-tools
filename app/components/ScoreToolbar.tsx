'use client';

import { ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/lib/shadcn/ui';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/lib/shadcn/ui';

interface ScoreToolbarProps {
  scale: number;
  pageCount: number;
  currentPage: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

const DEFAULT_SCALE = 40;

export default function ScoreToolbar({
  scale,
  pageCount,
  currentPage,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: ScoreToolbarProps) {
  const zoomPercent = Math.round((scale / DEFAULT_SCALE) * 100);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-2 px-3 py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 cursor-pointer"
              onClick={onZoomOut}
              aria-label="Alejar"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Alejar</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 cursor-pointer"
              onClick={onZoomIn}
              aria-label="Acercar"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Acercar</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer tabular-nums"
              onClick={onZoomReset}
              aria-label="Restablecer zoom"
            >
              {zoomPercent}%
            </Button>
          </TooltipTrigger>
          <TooltipContent>Restablecer zoom</TooltipContent>
        </Tooltip>

        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          Pag. {currentPage} / {pageCount}
        </span>
      </div>
    </TooltipProvider>
  );
}
