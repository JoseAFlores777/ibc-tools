/**
 * Theme presets for the projection display.
 * Per D-12 and UI-SPEC color table: dark backgrounds for readability.
 */

import type { ThemeConfig } from './types';

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

/** Default theme: Oscuro Clasico solid background */
export const DEFAULT_THEME: ThemeConfig = {
  background: '#1a1a2e',
  backgroundType: 'solid',
  fontSizeOffset: 0,
};
