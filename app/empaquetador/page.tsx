'use client';

import { useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useWizardReducer } from '@/app/empaquetador/hooks/useWizardReducer';
import WizardStepper from '@/app/empaquetador/components/WizardStepper';
import StepSeleccion from '@/app/empaquetador/components/StepSeleccion';
import StepConfiguracion from '@/app/empaquetador/components/StepConfiguracion';
import StepDescarga from '@/app/empaquetador/components/StepDescarga';
import { Button } from '@/lib/shadcn/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/herramientas"
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Herramientas
      </Link>
      <h1 className="text-2xl font-semibold leading-tight mb-6">Empaquetador de Himnos</h1>

      <WizardStepper currentStep={state.step} onStepClick={handleStepClick} />

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

      {/* Barra de navegacion inferior */}
      <div className="flex justify-between mt-6">
        {state.step > 1 ? (
          <Button variant="outline" onClick={handleBack}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            {`Atr\u00e1s`}
          </Button>
        ) : (
          <div />
        )}

        {state.step < 3 && (
          <Button variant="default" onClick={handleNext} disabled={isNextDisabled}>
            Siguiente
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
