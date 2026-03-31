/**
 * Theme presets for the projection display.
 * Per D-12 and UI-SPEC color table: dark backgrounds for readability.
 */

import type { ThemeConfig, FontPresetKey } from './types';

/** Built-in theme presets (3 solid + 2 gradient) */
export const THEME_PRESETS = [
  { name: 'Oscuro Clasico', value: '#1a1a2e', type: 'solid' as const },
  { name: 'Indigo Iglesia', value: '#393572', type: 'solid' as const },
  { name: 'Negro Puro', value: '#000000', type: 'solid' as const },
  {
    name: 'Azul Profundo',
    value: 'linear-gradient(180deg, #0f0c29, #302b63, #24243e)',
    type: 'gradient' as const,
  },
  {
    name: 'Noche Estrellada',
    value: 'linear-gradient(135deg, #0c1445, #1a1a2e)',
    type: 'gradient' as const,
  },
] as const;

/** Font family presets selectable by the user */
export const FONT_PRESETS: Record<FontPresetKey, { label: string; family: string }> = {
  sans: { label: 'Sans Serif', family: 'system-ui, -apple-system, sans-serif' },
  serif: { label: 'Serif', family: 'Georgia, "Times New Roman", serif' },
  condensed: { label: 'Condensada', family: '"Arial Narrow", "Helvetica Neue", Arial, sans-serif' },
  rounded: { label: 'Redondeada', family: '"Nunito", "Varela Round", system-ui, sans-serif' },
};

/** Get CSS font-family string from a preset key */
export function getFontFamily(preset: FontPresetKey): string {
  return FONT_PRESETS[preset]?.family ?? FONT_PRESETS.sans.family;
}

/** Default theme: Oscuro Clasico solid background, sans serif */
export const DEFAULT_THEME: ThemeConfig = {
  background: '#1a1a2e',
  backgroundType: 'solid',
  fontSizeOffset: 0,
  fontPreset: 'sans',
};
