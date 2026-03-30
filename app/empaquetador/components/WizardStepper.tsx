import { Check } from 'lucide-react';
import { cn } from '@/app/lib/shadcn/utils';

const STEPS = [
  { number: 1 as const, label: 'Seleccionar' },
  { number: 2 as const, label: 'Configurar' },
  { number: 3 as const, label: 'Descargar' },
];

interface WizardStepperProps {
  currentStep: 1 | 2 | 3;
  onStepClick: (step: 1 | 2 | 3) => void;
}

/** Stepper compacto horizontal para la barra inferior */
export default function WizardStepper({ currentStep, onStepClick }: WizardStepperProps) {
  return (
    <nav
      role="navigation"
      aria-label="Pasos del empaquetador"
      className="flex items-center gap-2"
    >
      {STEPS.map((step, index) => {
        const isCompleted = step.number < currentStep;
        const isActive = step.number === currentStep;
        const isUpcoming = step.number > currentStep;

        return (
          <div key={step.number} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => isCompleted && onStepClick(step.number)}
              disabled={!isCompleted}
              aria-current={isActive ? 'step' : undefined}
              aria-label={
                isCompleted
                  ? `Paso ${step.number} completado: ${step.label}`
                  : `Paso ${step.number}: ${step.label}`
              }
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium transition-colors',
                isCompleted && 'cursor-pointer hover:text-primary',
                isActive && 'text-primary cursor-default',
                isUpcoming && 'text-slate-400 cursor-default',
              )}
            >
              <span
                className={cn(
                  'flex items-center justify-center rounded-full w-6 h-6 text-xs font-semibold transition-colors',
                  isCompleted && 'bg-primary text-primary-foreground',
                  isActive && 'bg-primary text-primary-foreground',
                  isUpcoming && 'bg-slate-200 text-slate-500',
                )}
              >
                {isCompleted ? <Check className="h-3 w-3" /> : step.number}
              </span>
              <span className="hidden md:inline">{step.label}</span>
            </button>

            {/* Linea conectora */}
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-6 flex-shrink-0',
                  step.number < currentStep ? 'bg-primary' : 'bg-slate-200',
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
