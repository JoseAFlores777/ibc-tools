'use client';

/**
 * Controles de proyeccion: boton de proyectar, modos (Negro/Limpiar/Logo),
 * y ajuste de tamano de texto. Ubicado en la columna derecha del panel de control.
 */

import { Monitor, EyeOff, Type, ImageIcon, Minus, Plus } from 'lucide-react';
import { Button } from '@/lib/shadcn/ui/button';
import { Separator } from '@/lib/shadcn/ui/separator';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/lib/shadcn/ui/tooltip';
import type { ProjectionMode } from '../lib/types';

interface ProjectionControlsProps {
  projectionOpen: boolean;
  projectionMode: ProjectionMode;
  onProjectToggle: () => void;
  onBlack: () => void;
  onClear: () => void;
  onLogo: () => void;
  onFontSizeUp: () => void;
  onFontSizeDown: () => void;
}

export default function ProjectionControls({
  projectionOpen,
  projectionMode,
  onProjectToggle,
  onBlack,
  onClear,
  onLogo,
  onFontSizeUp,
  onFontSizeDown,
}: ProjectionControlsProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col gap-2 p-4">
        {/* Boton principal de proyectar/cerrar */}
        <Button
          variant={projectionOpen ? 'destructive' : 'default'}
          className="w-full"
          onClick={onProjectToggle}
          aria-label={projectionOpen ? 'Cerrar proyeccion' : 'Proyectar'}
        >
          <Monitor className="mr-2 h-4 w-4" />
          {projectionOpen ? 'Cerrar Proyeccion' : 'Proyectar'}
        </Button>

        <Separator />

        {/* Botones de modo: Negro, Limpiar, Logo */}
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={projectionMode === 'black' ? 'secondary' : 'outline'}
                size="sm"
                onClick={onBlack}
                aria-label="Negro"
                className="flex-1"
              >
                <EyeOff className="mr-1 h-4 w-4" />
                Negro
              </Button>
            </TooltipTrigger>
            <TooltipContent>Negro (B)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={projectionMode === 'clear' ? 'secondary' : 'outline'}
                size="sm"
                onClick={onClear}
                aria-label="Limpiar"
                className="flex-1"
              >
                <Type className="mr-1 h-4 w-4" />
                Limpiar
              </Button>
            </TooltipTrigger>
            <TooltipContent>Limpiar (C)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={projectionMode === 'logo' ? 'secondary' : 'outline'}
                size="sm"
                onClick={onLogo}
                aria-label="Logo"
                className="flex-1"
              >
                <ImageIcon className="mr-1 h-4 w-4" />
                Logo
              </Button>
            </TooltipTrigger>
            <TooltipContent>Logo (L)</TooltipContent>
          </Tooltip>
        </div>

        <Separator />

        {/* Botones de tamano de texto */}
        <div className="flex gap-2 justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onFontSizeDown}
                aria-label="Reducir texto"
              >
                <Minus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reducir texto (Ctrl+-)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onFontSizeUp}
                aria-label="Aumentar texto"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Aumentar texto (Ctrl+=)</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
