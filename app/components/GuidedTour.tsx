'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/lib/shadcn/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface TourStep {
  target: string; // CSS selector, e.g. '[data-tour="agregar-himno"]'
  title: string; // Spanish title
  description: string; // Spanish description
  position?: 'top' | 'bottom' | 'left' | 'right'; // tooltip placement relative to target
}

/* ------------------------------------------------------------------ */
/*  useTour hook                                                       */
/* ------------------------------------------------------------------ */

export function useTour(storageKey: string) {
  const [isActive, setIsActive] = useState(false);

  // Auto-start on mount if not completed
  useEffect(() => {
    const completed = localStorage.getItem(`tour-completed-${storageKey}`);
    if (!completed) {
      // Small delay to let the page render and data-tour elements mount
      const timer = setTimeout(() => setIsActive(true), 600);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const startTour = useCallback(() => setIsActive(true), []);
  const handleComplete = useCallback(() => setIsActive(false), []);

  return { isActive, startTour, handleComplete };
}

/* ------------------------------------------------------------------ */
/*  GuidedTour component                                               */
/* ------------------------------------------------------------------ */

interface GuidedTourProps {
  steps: TourStep[];
  storageKey: string;
  active: boolean;
  onComplete?: () => void;
}

export function GuidedTour({ steps, storageKey, active, onComplete }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(true);
  const recalcTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Find and observe the current target element
  const recalcRect = useCallback(() => {
    if (!active || currentStep >= steps.length) return;
    const step = steps[currentStep];
    const el = document.querySelector(step.target);
    if (el) {
      setSpotlightRect(el.getBoundingClientRect());
    } else {
      setSpotlightRect(null);
    }
  }, [active, currentStep, steps]);

  // Recalculate on step change, scroll, resize
  useEffect(() => {
    if (!active) return;
    recalcRect();

    const debounced = () => {
      if (recalcTimerRef.current) clearTimeout(recalcTimerRef.current);
      recalcTimerRef.current = setTimeout(recalcRect, 100);
    };

    window.addEventListener('scroll', debounced, { passive: true });
    window.addEventListener('resize', debounced);

    const observer = new ResizeObserver(debounced);
    observer.observe(document.body);

    return () => {
      window.removeEventListener('scroll', debounced);
      window.removeEventListener('resize', debounced);
      observer.disconnect();
      if (recalcTimerRef.current) clearTimeout(recalcTimerRef.current);
    };
  }, [active, recalcRect]);

  // Scroll target into view when step changes
  useEffect(() => {
    if (!active || currentStep >= steps.length) return;
    const step = steps[currentStep];
    const el = document.querySelector(step.target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Recalculate after scroll animation
      setTimeout(recalcRect, 400);
    } else {
      // Target not found, skip to next
      if (currentStep < steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        completeTour();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, currentStep]);

  // Reset step when tour starts
  useEffect(() => {
    if (active) {
      setCurrentStep(0);
      setTooltipVisible(true);
    }
  }, [active]);

  function completeTour() {
    localStorage.setItem(`tour-completed-${storageKey}`, 'true');
    onComplete?.();
  }

  function goNext() {
    if (currentStep < steps.length - 1) {
      setTooltipVisible(false);
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setTooltipVisible(true);
      }, 200);
    } else {
      completeTour();
    }
  }

  function goPrev() {
    if (currentStep > 0) {
      setTooltipVisible(false);
      setTimeout(() => {
        setCurrentStep((prev) => prev - 1);
        setTooltipVisible(true);
      }, 200);
    }
  }

  if (!active || steps.length === 0) return null;

  const step = steps[currentStep];
  const padding = 8;
  const borderRadius = 8;

  // Tooltip position calculation
  const pos = step.position ?? 'bottom';
  let tooltipStyle: React.CSSProperties = {};

  if (spotlightRect) {
    const margin = 16; // from viewport edges
    const tooltipMaxW = 320;
    const gap = 12; // gap between spotlight and tooltip

    switch (pos) {
      case 'bottom': {
        const left = Math.max(
          margin,
          Math.min(
            spotlightRect.left + spotlightRect.width / 2 - tooltipMaxW / 2,
            window.innerWidth - tooltipMaxW - margin,
          ),
        );
        tooltipStyle = {
          top: spotlightRect.bottom + padding + gap,
          left,
        };
        break;
      }
      case 'top': {
        const left = Math.max(
          margin,
          Math.min(
            spotlightRect.left + spotlightRect.width / 2 - tooltipMaxW / 2,
            window.innerWidth - tooltipMaxW - margin,
          ),
        );
        tooltipStyle = {
          bottom: window.innerHeight - spotlightRect.top + padding + gap,
          left,
        };
        break;
      }
      case 'left':
        tooltipStyle = {
          top: Math.max(margin, spotlightRect.top + spotlightRect.height / 2 - 80),
          right: window.innerWidth - spotlightRect.left + padding + gap,
        };
        break;
      case 'right':
        tooltipStyle = {
          top: Math.max(margin, spotlightRect.top + spotlightRect.height / 2 - 80),
          left: spotlightRect.right + padding + gap,
        };
        break;
    }
  }

  return (
    <>
      {/* SVG overlay with spotlight cutout */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 9998, pointerEvents: 'auto' }}
        onClick={(e) => e.stopPropagation()} // Prevent accidental dismissal
      >
        <svg
          width="100%"
          height="100%"
          className="absolute inset-0"
          style={{ pointerEvents: 'none' }}
        >
          <defs>
            <mask id="tour-spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {spotlightRect && (
                <rect
                  x={spotlightRect.left - padding}
                  y={spotlightRect.top - padding}
                  width={spotlightRect.width + padding * 2}
                  height={spotlightRect.height + padding * 2}
                  rx={borderRadius}
                  ry={borderRadius}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="black"
            opacity="0.6"
            mask="url(#tour-spotlight-mask)"
            style={{ pointerEvents: 'auto' }}
          />
        </svg>

        {/* Tooltip card */}
        {spotlightRect && (
          <div
            ref={tooltipRef}
            className="fixed bg-white rounded-xl shadow-2xl border border-border p-5 max-w-[320px]"
            style={{
              zIndex: 9999,
              pointerEvents: 'auto',
              ...tooltipStyle,
              opacity: tooltipVisible ? 1 : 0,
              transform: tooltipVisible ? 'translateY(0)' : 'translateY(4px)',
              transition: 'opacity 200ms, transform 200ms',
            }}
          >
            <p className="text-sm font-semibold text-foreground">{step.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
            <p className="text-xs text-muted-foreground mt-3">
              Paso {currentStep + 1} de {steps.length}
            </p>
            <div className="flex items-center justify-between mt-3 gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={completeTour}
              >
                Omitir
              </Button>
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={goPrev}
                  >
                    Anterior
                  </Button>
                )}
                <Button
                  variant="default"
                  size="sm"
                  className="text-xs h-7"
                  onClick={goNext}
                >
                  {currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  HelpButton component                                               */
/* ------------------------------------------------------------------ */

interface HelpButtonProps {
  onClick: () => void;
}

export function HelpButton({ onClick }: HelpButtonProps) {
  return (
    <button
      onClick={onClick}
      title="Ver tutorial"
      className="fixed bottom-6 right-6 z-50 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center cursor-pointer transition-shadow"
    >
      <span className="text-lg font-bold">?</span>
    </button>
  );
}
