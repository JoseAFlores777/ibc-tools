'use client';

import { useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useWizardReducer } from '@/app/empaquetador/hooks/useWizardReducer';
import WizardStepper from '@/app/empaquetador/components/WizardStepper';
import SelectionSidebar from '@/app/empaquetador/components/SelectionSidebar';
import StepSeleccion from '@/app/empaquetador/components/StepSeleccion';
import StepConfiguracion from '@/app/empaquetador/components/StepConfiguracion';
import StepDescarga from '@/app/empaquetador/components/StepDescarga';
import PackageHistory from '@/app/empaquetador/components/PackageHistory';
import { Button } from '@/lib/shadcn/ui';
import { ChevronLeft, ChevronRight, History, Package } from 'lucide-react';
import { deserializeAudioSelections } from '@/app/empaquetador/lib/package-db';
import type { SavedPackage } from '@/app/empaquetador/lib/package-db';
import type { HymnSearchResult } from '@/app/interfaces/Hymn.interface';
import { ToolSettingsButton, ToolWelcomeModal } from '@/app/components/LocalStorageWarning';

export default function EmpaquetadorPage() {
  const [state, dispatch] = useWizardReducer();
  const [showHistory, setShowHistory] = useState(false);
  const [loadingPackage, setLoadingPackage] = useState(false);
  const dirRef = useRef<'forward' | 'backward'>('forward');
  const shouldReduceMotion = useReducedMotion();

  const handleStepClick = (step: 1 | 2 | 3) => {
    if (step < state.step) {
      dirRef.current = 'backward';
      dispatch({ type: 'SET_STEP', step });
    }
  };

  const handleNext = () => {
    if (state.step < 3) {
      dirRef.current = 'forward';
      dispatch({ type: 'SET_STEP', step: (state.step + 1) as 1 | 2 | 3 });
    }
  };

  const handleBack = () => {
    if (state.step > 1) {
      dirRef.current = 'backward';
      dispatch({ type: 'SET_STEP', step: (state.step - 1) as 1 | 2 | 3 });
    }
  };

  const isNextDisabled = state.step === 1 && state.selectedHymns.length === 0;

  const handleLoadPackage = useCallback(async (pkg: SavedPackage) => {
    setLoadingPackage(true);
    try {
      const hymnPromises = pkg.hymns.map((h) =>
        fetch(`/api/hymns/search?q=${encodeURIComponent(h.name)}&limit=1`)
          .then((r) => r.json())
          .then((json) => {
            const results = json.data as HymnSearchResult[] ?? [];
            return results.find((r: HymnSearchResult) => r.id === h.id) ?? results[0] ?? null;
          })
          .catch(() => null),
      );
      const hymns = (await Promise.all(hymnPromises)).filter(Boolean) as HymnSearchResult[];

      if (hymns.length === 0) {
        throw new Error('No se pudieron cargar los himnos');
      }

      dispatch({
        type: 'LOAD_PACKAGE',
        hymns,
        layout: pkg.layout,
        style: pkg.style,
        audioSelections: deserializeAudioSelections(pkg.audioSelections),
      });
      setShowHistory(false);
    } catch (err) {
      console.error('Error al cargar paquete:', err);
    } finally {
      setLoadingPackage(false);
    }
  }, [dispatch]);

  const variants = {
    forward: {
      initial: { x: 20, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -20, opacity: 0 },
    },
    backward: {
      initial: { x: -20, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 20, opacity: 0 },
    },
  };

  const renderStep = () => {
    switch (state.step) {
      case 1:
        return <StepSeleccion state={state} dispatch={dispatch} />;
      case 2:
        return <StepConfiguracion state={state} dispatch={dispatch} />;
      case 3:
        return <StepDescarga state={state} dispatch={dispatch} />;
    }
  };

  if (loadingPackage) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="inline-block h-8 w-8 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando paquete...</p>
        </div>
      </div>
    );
  }

  if (showHistory) {
    return (
      <PackageHistory
        onBack={() => setShowHistory(false)}
        onLoad={handleLoadPackage}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <ToolWelcomeModal tool="empaquetador" toolLabel="Empaquetador de Himnos" />
      {/* Contenido: sidebar + step */}
      <div className="flex-1 overflow-hidden pb-[68px] flex">
        {/* Sidebar compartido — visible en todos los steps */}
        <SelectionSidebar
          state={state}
          dispatch={dispatch}
          onShowHistory={() => setShowHistory(true)}
        />

        {/* Área principal del step */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {shouldReduceMotion ? (
            <div className="flex-1 overflow-hidden">{renderStep()}</div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={state.step}
                className="flex-1 overflow-hidden"
                initial={variants[dirRef.current].initial}
                animate={variants[dirRef.current].animate}
                exit={variants[dirRef.current].exit}
                transition={{ duration: 0.2 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Barra de accion inferior fija */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="hidden sm:block">
            <WizardStepper currentStep={state.step} onStepClick={handleStepClick} />
          </div>

          {state.step === 1 && (
            <div className="sm:hidden flex items-center gap-2 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHistory(true)}
                className="h-9 w-9 text-slate-400 hover:text-slate-700 lg:hidden"
                aria-label="Historial"
              >
                <History className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-600 flex-1 text-center">
                {state.selectedHymns.length} himno{state.selectedHymns.length !== 1 ? 's' : ''}{' '}
                seleccionado{state.selectedHymns.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            {state.step > 1 && (
              <Button variant="outline" onClick={handleBack} className="min-h-[44px]">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
            )}

            {state.step === 1 && (
              <>
                <span className="hidden sm:inline text-sm text-slate-600">
                  {state.selectedHymns.length} himno{state.selectedHymns.length !== 1 ? 's' : ''}{' '}
                  seleccionado{state.selectedHymns.length !== 1 ? 's' : ''}
                </span>
                <Button
                  variant="default"
                  onClick={handleNext}
                  disabled={isNextDisabled}
                  className="min-h-[44px]"
                 
                >
                  Siguiente ({state.selectedHymns.length})
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            )}

            {state.step === 2 && (
              <Button variant="default" onClick={handleNext} className="min-h-[44px]">
                <Package className="h-4 w-4 mr-2" />
                Generar Paquete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
