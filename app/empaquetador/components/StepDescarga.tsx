'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Progress, Button, Card, Separator } from '@/lib/shadcn/ui';
import { buildPackageRequest } from '../lib/build-package-request';
import { savePackage } from '../lib/package-db';
import type { WizardState, WizardAction } from '@/app/empaquetador/hooks/useWizardReducer';
import { Check, Download, FileText, Music, Package, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

interface StepDescargaProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

export default function StepDescarga({ state, dispatch }: StepDescargaProps) {
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Calcular total de pistas seleccionadas
  let totalAudioTracks = 0;
  for (const trackSet of state.audioSelections.values()) {
    totalAudioTracks += trackSet.size;
  }

  const handleGenerate = useCallback(async () => {
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
      setBlobUrl(url);

      // Auto-descarga
      const a = document.createElement('a');
      a.href = url;
      a.download = 'himnos.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Guardar en IndexedDB
      savePackage(state.selectedHymns, state.layout, state.style, state.audioSelections, 'completed')
        .catch((err) => console.error('Error al guardar en historial:', err));

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
  }, [state, dispatch]);

  const handleDownloadAgain = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = 'himnos.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }
    dispatch({ type: 'RESET' });
    setDownloadComplete(false);
  };

  // Estado de exito (post-descarga)
  if (downloadComplete) {
    return (
      <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto px-4 py-16 pb-12 text-center">
        {/* Icono de exito */}
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Check className="h-8 w-8 text-primary" />
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mb-2">Todo listo!</h2>
        <p className="text-slate-500 mb-8">El paquete ha sido procesado correctamente.</p>

        {/* Estadisticas */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="p-4 text-center">
            <FileText className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-800">{state.selectedHymns.length}</p>
            <p className="text-xs text-slate-500">Partituras generadas</p>
          </Card>
          <Card className="p-4 text-center">
            <Music className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-800">{totalAudioTracks}</p>
            <p className="text-xs text-slate-500">Audios incluidos</p>
          </Card>
        </div>

        {/* Boton de descarga */}
        <Button size="lg" className="w-full mb-4 min-h-[44px]" onClick={handleDownloadAgain}>
          <Download className="h-4 w-4 mr-2" />
          Descargar Paquete (.zip)
        </Button>

        {/* Acciones secundarias */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" onClick={handleReset} className="min-h-[44px]">
            <RotateCcw className="h-4 w-4 mr-2" />
            Crear otro paquete
          </Button>
          <Link href="/">
            <Button variant="ghost" className="min-h-[44px]">
              <Home className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
      </div>
    );
  }

  // Estado de generacion (durante)
  if (state.isGenerating) {
    return (
      <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        {/* Spinner */}
        <div className="mx-auto w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-6" />
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Generando tu paquete...</h2>
        <p className="text-slate-500 text-sm mb-6">
          Esto puede tardar unos segundos dependiendo de la cantidad de himnos.
        </p>
        <Progress value={100} className="animate-pulse max-w-md mx-auto" />
      </div>
      </div>
    );
  }

  // Estado inicial (resumen antes de generar)
  return (
    <div className="h-full overflow-auto">
    <div className="max-w-2xl mx-auto px-4 py-8 pb-12">
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Generar y Descargar</h2>
      <p className="text-slate-500 text-sm mb-8">
        Revisa el resumen de tu paquete antes de generar.
      </p>

      {/* Resumen del paquete */}
      <Card className="p-6 mb-8">
        <h3 className="text-base font-semibold text-slate-700 mb-4">Resumen del Paquete</h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Himnos</span>
            <span className="font-medium text-slate-700">{state.selectedHymns.length}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Disposición</span>
            <span className="font-medium text-slate-700">
              {state.layout === 'one-per-page' ? '1 himno por página' : '2 himnos por página'}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Estilo</span>
            <span className="font-medium text-slate-700">
              {state.style === 'decorated' ? 'Institucional (IBC)' : 'Texto Simple'}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Pistas de audio</span>
            <span className="font-medium text-slate-700">
              {totalAudioTracks > 0 ? `${totalAudioTracks} archivo(s)` : 'Ninguna'}
            </span>
          </div>
        </div>
      </Card>

      {/* Error */}
      {state.error && (
        <p className="text-destructive text-sm mb-4 text-center">{state.error}</p>
      )}

      {/* Boton de generacion */}
      <Button
        size="lg"
        onClick={handleGenerate}
        disabled={state.isGenerating}
        className="w-full min-h-[44px]"
      >
        <Package className="h-4 w-4 mr-2" />
        Generar Paquete
      </Button>
    </div>
    </div>
  );
}
