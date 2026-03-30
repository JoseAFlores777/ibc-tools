'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button, Card, Separator } from '@/lib/shadcn/ui';
import { buildPackageRequest } from '../lib/build-package-request';
import type { WizardState, WizardAction } from '@/app/empaquetador/hooks/useWizardReducer';

interface StepDescargaProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

export default function StepDescarga({ state, dispatch }: StepDescargaProps) {
  const [downloadComplete, setDownloadComplete] = useState(false);

  // Calcular total de pistas seleccionadas
  let totalAudioTracks = 0;
  for (const trackSet of state.audioSelections.values()) {
    totalAudioTracks += trackSet.size;
  }

  const handleGenerate = async () => {
    dispatch({ type: 'SET_GENERATING', isGenerating: true });
    dispatch({ type: 'SET_ERROR', error: null });

    try {
      const body = buildPackageRequest(state);
      const res = await fetch('/api/hymns/package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error('Server error');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'himnos.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Paquete descargado exitosamente!');
      setDownloadComplete(true);
    } catch (error) {
      console.error('Error al generar el paquete:', error);
      dispatch({ type: 'SET_ERROR', error: 'Error al generar el paquete.' });
      toast.error('Error al generar el paquete. Intenta de nuevo.', {
        action: {
          label: 'Reintentar',
          onClick: () => handleGenerate(),
        },
      });
    } finally {
      dispatch({ type: 'SET_GENERATING', isGenerating: false });
    }
  };

  return (
    <div className="space-y-6 py-4">
      <h2 className="text-xl font-semibold">Generar y Descargar</h2>

      {/* Resumen del paquete */}
      <Card className="p-4 rounded-lg">
        <h3 className="text-base font-semibold mb-3">Resumen</h3>

        <div className="space-y-2 text-sm">
          <p>{state.selectedHymns.length} himno(s)</p>
          <ul className="mt-1 space-y-0.5 text-muted-foreground">
            {state.selectedHymns.map((h) => (
              <li key={h.id}>
                {h.hymn_number ? `#${h.hymn_number} - ` : ''}
                {h.name}
              </li>
            ))}
          </ul>
          <Separator />
          <p>
            Disposicion: {state.layout === 'one-per-page' ? '1 por pagina' : '2 por pagina'}
          </p>
          <Separator />
          <p>Estilo: {state.style === 'decorated' ? 'Decorado' : 'Plano'}</p>
          <Separator />
          <p>
            {totalAudioTracks > 0
              ? `${totalAudioTracks} pista(s) de audio`
              : 'Sin pistas de audio'}
          </p>
        </div>
      </Card>

      {/* Boton de generacion y progreso */}
      <div className="space-y-4">
        <Button
          size="lg"
          disabled={state.isGenerating}
          onClick={handleGenerate}
          className="w-full sm:w-auto"
        >
          {state.isGenerating ? 'Generando...' : 'Generar Paquete'}
        </Button>

        {state.isGenerating && (
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full w-1/3 bg-primary rounded-full"
              style={{
                animation: 'indeterminate 1.5s ease-in-out infinite',
              }}
            />
            <style>{`
              @keyframes indeterminate {
                0% { transform: translateX(-100%); }
                50% { transform: translateX(200%); }
                100% { transform: translateX(-100%); }
              }
            `}</style>
          </div>
        )}
      </div>

      {/* Post-descarga: crear otro paquete */}
      {downloadComplete && (
        <Button
          variant="outline"
          onClick={() => {
            dispatch({ type: 'RESET' });
            setDownloadComplete(false);
          }}
        >
          Crear otro paquete
        </Button>
      )}
    </div>
  );
}
