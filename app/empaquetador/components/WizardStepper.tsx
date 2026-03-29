import { Check } from 'lucide-react';
import { cn } from '@/app/lib/shadcn/utils';

const STEPS = [
  { number: 1 as const, label: 'Seleccionar Himnos' },
  { number: 2 as const, label: 'Configurar' },
  { number: 3 as const, label: 'Descargar' },
];

interface WizardStepperProps {
  currentStep: 1 | 2 | 3;
  onStepClick: (step: 1 | 2 | 3) => void;
}

export default function WizardStepper({ currentStep, onStepClick }: WizardStepperProps) {
  return (
    <nav
      role="navigation"
      aria-label="Pasos del empaquetador"
      className="flex items-center justify-center gap-2 sm:gap-4 mb-6"
    >
      {STEPS.map((step, index) => {
        const isCompleted = step.number < currentStep;
        const isActive = step.number === currentStep;
        const isUpcoming = step.number > currentStep;

        return (
          <div key={step.number} className="flex items-center gap-2 sm:gap-4">
            {/* Paso: circulo + etiqueta */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => isCompleted && onStepClick(step.number)}
                disabled={!isCompleted}
                aria-current={isActive ? 'step' : undefined}
                aria-label={isCompleted ? `Paso ${step.number} completado` : undefined}
                className={cn(
                  'flex items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  'w-8 h-8 sm:w-10 sm:h-10',
                  isCompleted && 'bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90',
                  isActive && 'bg-primary text-primary-foreground cursor-default',
                  isUpcoming && 'bg-muted text-muted-foreground cursor-default',
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.number
                )}
              </button>
              <span
                className={cn(
                  'text-sm hidden sm:block',
                  (isActive || isCompleted) && 'font-semibold text-foreground',
                  isUpcoming && 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Linea conectora (no despues del ultimo paso) */}
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-8 sm:w-16 flex-shrink-0',
                  step.number < currentStep ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
