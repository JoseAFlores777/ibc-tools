'use client';

/**
 * Global keyboard shortcuts hook for the visualizador.
 * Handles slide navigation, audio control, projection modes, and font sizing.
 */

import { useEffect } from 'react';
import type { VisualizadorAction } from '../lib/types';

interface UseKeyboardShortcutsOptions {
  /** Dispatch function from useVisualizador reducer */
  dispatch: React.Dispatch<VisualizadorAction>;
  /** Toggle audio play/pause callback */
  togglePlayPause: () => void;
  /** Whether the projection window is currently open */
  projectionOpen: boolean;
}

/**
 * Registers global keydown listener for visualizador controls.
 * Ignores events when focus is on input/textarea elements.
 *
 * Shortcuts:
 * - ArrowRight / Space: NEXT_SLIDE
 * - ArrowLeft: PREV_SLIDE
 * - B: Toggle black screen
 * - L: Toggle logo
 * - C: Toggle clear text
 * - P: Toggle audio play/pause
 * - Ctrl+= : Font size up
 * - Ctrl+- : Font size down
 */
export function useKeyboardShortcuts({
  dispatch,
  togglePlayPause,
  projectionOpen,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // No interceptar si el usuario esta escribiendo en un input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case ' ': // Space
          e.preventDefault();
          dispatch({ type: 'NEXT_SLIDE' });
          break;

        case 'ArrowLeft':
          e.preventDefault();
          dispatch({ type: 'PREV_SLIDE' });
          break;

        case 'b':
        case 'B':
          e.preventDefault();
          dispatch({ type: 'SET_PROJECTION_MODE', mode: 'black' });
          break;

        case 'l':
        case 'L':
          e.preventDefault();
          dispatch({ type: 'SET_PROJECTION_MODE', mode: 'logo' });
          break;

        case 'c':
        case 'C':
          e.preventDefault();
          dispatch({ type: 'SET_PROJECTION_MODE', mode: 'clear' });
          break;

        case 'p':
        case 'P':
          e.preventDefault();
          togglePlayPause();
          break;

        case '=':
        case '+':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            dispatch({ type: 'FONT_SIZE_UP' });
          }
          break;

        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            dispatch({ type: 'FONT_SIZE_DOWN' });
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, togglePlayPause, projectionOpen]);
}
