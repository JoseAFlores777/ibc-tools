'use client';

import { useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useWizardReducer } from '@/app/empaquetador/hooks/useWizardReducer';
import WizardStepper from '@/app/empaquetador/components/WizardStepper';
import StepSeleccion from '@/app/empaquetador/components/StepSeleccion';
import StepConfiguracion from '@/app/empaquetador/components/StepConfiguracion';
import StepDescarga from '@/app/empaquetador/components/StepDescarga';
import { Button } from '@/lib/shadcn/ui';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';

export default function EmpaquetadorPage() {
  const [state, dispatch] = useWizardReducer();
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Contenido principal con padding para barra inferior */}
      <div className="flex-1 pb-24">
        {shouldReduceMotion ? (
          renderStep()
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={state.step}
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

      {/* Barra de accion inferior fija */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Izquierda: Stepper compacto */}
          <div className="hidden sm:block">
            <WizardStepper currentStep={state.step} onStepClick={handleStepClick} />
          </div>

          {/* Centro: info de seleccion (step 1) */}
          {state.step === 1 && (
            <div className="sm:hidden flex-1 text-center">
              <span className="text-sm text-slate-600">
                {state.selectedHymns.length} himno{state.selectedHymns.length !== 1 ? 's' : ''}{' '}
                seleccionado{state.selectedHymns.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Derecha: botones de accion */}
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
