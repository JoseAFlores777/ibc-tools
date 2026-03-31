'use client';

/**
 * Controles de proyeccion: boton de proyectar, modos (Negro/Limpiar/Logo),
 * selector de fuente, y ajuste de tamano de texto.
 */

import { Monitor, EyeOff, Type, ImageIcon, Minus, Plus } from 'lucide-react';
import { Button } from '@/lib/shadcn/ui/button';
import { Separator } from '@/lib/shadcn/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/lib/shadcn/ui';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/lib/shadcn/ui/tooltip';
import type { ProjectionMode, FontPresetKey } from '../lib/types';
import { FONT_PRESETS } from '../lib/theme-presets';

interface ProjectionControlsProps {
  projectionOpen: boolean;
  projectionMode: ProjectionMode;
  fontPreset: FontPresetKey;
  onProjectToggle: () => void;
  onBlack: () => void;
  onClear: () => void;
  onLogo: () => void;
  onFontSizeUp: () => void;
  onFontSizeDown: () => void;
  onFontPresetChange: (preset: FontPresetKey) => void;
}

const PRESET_KEYS = Object.keys(FONT_PRESETS) as FontPresetKey[];

export default function ProjectionControls({
  projectionOpen,
  projectionMode,
  fontPreset,
  onProjectToggle,
  onBlack,
  onClear,
  onLogo,
  onFontSizeUp,
  onFontSizeDown,
  onFontPresetChange,
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

        {/* Selector de fuente */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex-shrink-0">Fuente:</span>
          <Select value={fontPreset} onValueChange={(v) => onFontPresetChange(v as FontPresetKey)}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESET_KEYS.map((key) => (
                <SelectItem key={key} value={key}>
                  <span style={{ fontFamily: FONT_PRESETS[key].family }}>
                    {FONT_PRESETS[key].label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
