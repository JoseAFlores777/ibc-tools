'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Step } from 'react-joyride';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/lib/shadcn/ui';

// react-joyride usa window — importar sin SSR
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Joyride = dynamic(
  () => import('react-joyride').then((mod) => ({ default: (mod as any).default ?? mod })),
  { ssr: false },
) as any;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface TourStep {
  target: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

/* ------------------------------------------------------------------ */
/*  useTour hook                                                       */
/* ------------------------------------------------------------------ */

export function useTour(storageKey: string) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(`tour-completed-${storageKey}`);
    if (!completed) {
      const timer = setTimeout(() => setIsActive(true), 800);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const startTour = useCallback(() => setIsActive(true), []);

  const handleComplete = useCallback(() => {
    setIsActive(false);
    localStorage.setItem(`tour-completed-${storageKey}`, '1');
  }, [storageKey]);

  return { isActive, startTour, handleComplete };
}

/* ------------------------------------------------------------------ */
/*  GuidedTour — wrapper de react-joyride                              */
/* ------------------------------------------------------------------ */

interface GuidedTourProps {
  steps: TourStep[];
  storageKey: string;
  active: boolean;
  onComplete: () => void;
}

export function GuidedTour({ steps, storageKey, active, onComplete }: GuidedTourProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Sincronizar con el estado externo
  useEffect(() => {
    if (active) {
      setStepIndex(0);
      setRun(true);
    } else {
      setRun(false);
    }
  }, [active]);

  const joyrideSteps: Step[] = steps.map((s) => ({
    target: s.target,
    title: s.title,
    content: s.description,
    placement: s.position || 'auto',
    disableBeacon: true,
  }));

  const handleCallback = useCallback(
    (data: { status: string; action: string; index: number; type: string }) => {
      const { status, action, index, type } = data;

      const finishedStatuses: string[] = ['finished', 'skipped'];

      if (finishedStatuses.includes(status)) {
        setRun(false);
        onComplete();
        return;
      }

      if (type === 'step:after') {
        if (action === 'next') {
          setStepIndex(index + 1);
        } else if (action === 'prev') {
          setStepIndex(index - 1);
        }
      }
    },
    [onComplete],
  );

  if (!run) return null;

  return (
    <Joyride
      steps={joyrideSteps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      disableOverlayClose
      spotlightClicks={false}
      locale={{
        back: 'Anterior',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        open: 'Abrir',
        skip: 'Omitir tour',
      }}
      styles={{
        options: {
          primaryColor: '#6366f1',
          zIndex: 10000,
          arrowColor: '#ffffff',
          backgroundColor: '#ffffff',
          textColor: '#1e293b',
          overlayColor: 'rgba(0, 0, 0, 0.55)',
          spotlightShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
        },
        tooltip: {
          borderRadius: '12px',
          padding: '20px',
          fontSize: '14px',
        },
        tooltipTitle: {
          fontSize: '16px',
          fontWeight: 700,
          marginBottom: '8px',
        },
        tooltipContent: {
          fontSize: '13px',
          lineHeight: '1.5',
          color: '#64748b',
          padding: '8px 0',
        },
        buttonNext: {
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          padding: '8px 16px',
        },
        buttonBack: {
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          color: '#64748b',
          marginRight: '8px',
        },
        buttonSkip: {
          fontSize: '12px',
          color: '#94a3b8',
        },
        spotlight: {
          borderRadius: '8px',
        },
        overlay: {
          mixBlendMode: undefined as unknown as 'normal',
        },
      }}
      callback={handleCallback}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  HelpButton — boton "?" fijo en esquina inferior derecha            */
/* ------------------------------------------------------------------ */

export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      className="fixed bottom-4 right-4 z-50 h-10 w-10 rounded-full shadow-lg bg-background/95 backdrop-blur-sm border-border hover:bg-accent"
      aria-label="Iniciar tour de ayuda"
    >
      <HelpCircle className="h-5 w-5" />
    </Button>
  );
}
