import type { PackageRequest } from '@/app/lib/zip/zip.schema';
import type { WizardState } from '@/app/empaquetador/hooks/useWizardReducer';

/**
 * Convierte el estado del wizard (con Map/Set) a un objeto PackageRequest plano
 * compatible con el schema de validacion y la API de generacion de ZIP.
 */
export function buildPackageRequest(state: WizardState): PackageRequest {
  const hymns = state.selectedHymns.map((hymn) => {
    const audioSet = state.audioSelections.get(hymn.id);
    const audioFiles = audioSet ? Array.from(audioSet) as PackageRequest['hymns'][number]['audioFiles'] : [];

    return {
      id: hymn.id,
      audioFiles,
    };
  });

  return {
    hymns,
    layout: state.layout,
    style: state.style,
    copiesPerPage: state.copiesPerPage,
    copiesFontSize: state.copiesFontSize,
  };
}
