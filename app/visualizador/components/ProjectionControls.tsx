'use client';

/**
 * Controles de proyeccion: proyectar, modos, fuente, alineacion,
 * colores, imagen de fondo, y tamano de texto.
 */

import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Monitor, EyeOff, Type, ImageIcon, Minus, Plus,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  ArrowUpToLine, ArrowDownToLine, Maximize2, Image, Palette,
  Copy, Check,
} from 'lucide-react';
import {
  Button,
  Separator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Input,
  Label,
} from '@/lib/shadcn/ui';
import type { ProjectionMode, FontPresetKey, TextAlign, VerticalAlign, ThemeConfig } from '../lib/types';
import { FONT_PRESETS } from '../lib/theme-presets';
import { cn } from '@/app/lib/shadcn/utils';

interface ProjectionControlsProps {
  projectionOpen: boolean;
  projectionMode: ProjectionMode;
  theme: ThemeConfig;
  onProjectToggle: () => void;
  onBlack: () => void;
  onClear: () => void;
  onLogo: () => void;
  onFontSizeUp: () => void;
  onFontSizeDown: () => void;
  onThemeChange: (partial: Partial<ThemeConfig>) => void;
  remotePin: string | null;
  remoteConnected: boolean;
}

const PRESET_KEYS = Object.keys(FONT_PRESETS) as FontPresetKey[];

const H_ALIGNS: { value: TextAlign; icon: typeof AlignLeft; label: string }[] = [
  { value: 'left', icon: AlignLeft, label: 'Izquierda' },
  { value: 'center', icon: AlignCenter, label: 'Centro' },
  { value: 'right', icon: AlignRight, label: 'Derecha' },
  { value: 'justify', icon: AlignJustify, label: 'Justificado' },
];

const V_ALIGNS: { value: VerticalAlign; icon: typeof ArrowUpToLine; label: string }[] = [
  { value: 'top', icon: ArrowUpToLine, label: 'Arriba' },
  { value: 'center', icon: Maximize2, label: 'Centro' },
  { value: 'bottom', icon: ArrowDownToLine, label: 'Abajo' },
];

export default function ProjectionControls({
  projectionOpen,
  projectionMode,
  theme,
  onProjectToggle,
  onBlack,
  onClear,
  onLogo,
  onFontSizeUp,
  onFontSizeDown,
  onThemeChange,
  remotePin,
  remoteConnected,
}: ProjectionControlsProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  function handleCopyLink() {
    if (!remotePin) return;
    const url = `${window.location.origin}/visualizador/control?pin=${remotePin}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onThemeChange({ background: dataUrl, backgroundType: 'image' });
    };
    reader.readAsDataURL(file);
    // Reset para poder seleccionar la misma imagen otra vez
    e.target.value = '';
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col gap-2 p-3 overflow-y-auto">
        {/* Proyectar */}
        <Button
          variant={projectionOpen ? 'destructive' : 'default'}
          className="w-full"
          onClick={onProjectToggle}
          aria-label={projectionOpen ? 'Cerrar proyeccion' : 'Proyectar'}
        >
          <Monitor className="mr-2 h-4 w-4" />
          {projectionOpen ? 'Cerrar Proyeccion' : 'Proyectar'}
        </Button>

        {/* Control remoto: QR + PIN */}
        {remotePin && (
          <div className="rounded-xl border border-border bg-gradient-to-b from-muted/60 to-muted/30 p-4 flex flex-col items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Control Remoto</span>
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <QRCodeSVG
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/visualizador/control?pin=${remotePin}`}
                size={130}
                level="M"
                fgColor="#1a1a2e"
                bgColor="#ffffff"
                imageSettings={{
                  src: '/logo-iglesia.png',
                  x: undefined,
                  y: undefined,
                  height: 24,
                  width: 24,
                  excavate: true,
                }}
              />
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  'inline-block h-2.5 w-2.5 rounded-full ring-2',
                  remoteConnected
                    ? 'bg-green-500 ring-green-500/20 animate-pulse'
                    : 'bg-amber-400 ring-amber-400/20',
                )}
              />
              <span className="text-2xl font-extrabold font-mono tracking-[0.25em] text-foreground">
                {remotePin}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground text-center leading-tight">
              {remoteConnected ? 'Dispositivo conectado' : 'Escanea el QR o ingresa el PIN'}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs w-full"
              onClick={handleCopyLink}
            >
              {copied ? (
                <><Check className="mr-1 h-3 w-3" /> Copiado</>
              ) : (
                <><Copy className="mr-1 h-3 w-3" /> Copiar enlace</>
              )}
            </Button>
          </div>
        )}

        <Separator />

        {/* Modos: Negro, Limpiar, Logo */}
        <div className="flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={projectionMode === 'black' ? 'secondary' : 'outline'}
                size="sm"
                onClick={onBlack}
                className="flex-1 text-xs"
              >
                <EyeOff className="mr-1 h-3.5 w-3.5" /> Negro
              </Button>
            </TooltipTrigger>
            <TooltipContent>B</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={projectionMode === 'clear' ? 'secondary' : 'outline'}
                size="sm"
                onClick={onClear}
                className="flex-1 text-xs"
              >
                <Type className="mr-1 h-3.5 w-3.5" /> Limpiar
              </Button>
            </TooltipTrigger>
            <TooltipContent>C</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={projectionMode === 'logo' ? 'secondary' : 'outline'}
                size="sm"
                onClick={onLogo}
                className="flex-1 text-xs"
              >
                <ImageIcon className="mr-1 h-3.5 w-3.5" /> Logo
              </Button>
            </TooltipTrigger>
            <TooltipContent>L</TooltipContent>
          </Tooltip>
        </div>

        <Separator />

        {/* Fuente */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground flex-shrink-0 w-14">Fuente</Label>
          <Select value={theme.fontPreset} onValueChange={(v) => onThemeChange({ fontPreset: v as FontPresetKey })}>
            <SelectTrigger className="h-7 text-xs flex-1">
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

        {/* Tamano de texto */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground flex-shrink-0 w-14">Tamano</Label>
          <div className="flex items-center gap-1 flex-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={onFontSizeDown}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-xs text-center w-10 tabular-nums">
              {theme.fontSizeOffset >= 0 ? '+' : ''}{theme.fontSizeOffset}
            </span>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={onFontSizeUp}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Alineacion horizontal */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground flex-shrink-0 w-14">Horiz.</Label>
          <div className="flex gap-0.5 flex-1">
            {H_ALIGNS.map(({ value, icon: Icon, label }) => (
              <Tooltip key={value}>
                <TooltipTrigger asChild>
                  <Button
                    variant={theme.textAlign === value ? 'secondary' : 'outline'}
                    size="icon"
                    className="h-7 w-7 flex-1"
                    onClick={() => onThemeChange({ textAlign: value })}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Alineacion vertical */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground flex-shrink-0 w-14">Vert.</Label>
          <div className="flex gap-0.5 flex-1">
            {V_ALIGNS.map(({ value, icon: Icon, label }) => (
              <Tooltip key={value}>
                <TooltipTrigger asChild>
                  <Button
                    variant={theme.verticalAlign === value ? 'secondary' : 'outline'}
                    size="icon"
                    className="h-7 w-7 flex-1"
                    onClick={() => onThemeChange({ verticalAlign: value })}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        <Separator />

        {/* Colores */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground flex-shrink-0 w-14">Fondo</Label>
          <div className="flex items-center gap-1 flex-1">
            <input
              type="color"
              value={theme.backgroundType === 'solid' ? theme.background : '#1a1a2e'}
              onChange={(e) => onThemeChange({ background: e.target.value, backgroundType: 'solid' })}
              className="h-7 w-10 rounded border border-input cursor-pointer"
              title="Color de fondo"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={() => imageInputRef.current?.click()}
            >
              <Image className="mr-1 h-3 w-3" /> Imagen
            </Button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground flex-shrink-0 w-14">Letra</Label>
          <div className="flex items-center gap-1 flex-1">
            <input
              type="color"
              value={theme.textColor ?? '#ffffff'}
              onChange={(e) => onThemeChange({ textColor: e.target.value })}
              className="h-7 w-10 rounded border border-input cursor-pointer"
              title="Color de letra"
            />
            <Button
              variant="outline"
              size="sm"
              className={cn('h-7 text-xs', theme.textColor === '#ffffff' && 'border-primary')}
              onClick={() => onThemeChange({ textColor: '#ffffff' })}
            >
              Blanco
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn('h-7 text-xs', theme.textColor === '#f5e642' && 'border-primary')}
              onClick={() => onThemeChange({ textColor: '#f5e642' })}
            >
              Amarillo
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
