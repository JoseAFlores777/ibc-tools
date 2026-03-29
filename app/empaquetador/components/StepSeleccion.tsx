'use client';

import type { WizardState, WizardAction } from '@/app/empaquetador/hooks/useWizardReducer';

interface StepSeleccionProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

/** Placeholder - sera implementado completamente en Task 2 */
export default function StepSeleccion({ state, dispatch }: StepSeleccionProps) {
  return (
    <div className="py-4">
      <h2 className="text-xl font-semibold">Seleccionar Himnos</h2>
      <p className="text-muted-foreground text-sm mt-2">
        Paso 1 - {state.selectedHymns.length} himnos seleccionados
      </p>
    </div>
  );
}
