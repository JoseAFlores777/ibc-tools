'use client';

import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/lib/shadcn/ui';
import { downloadExport, readImportFile, importToolData } from '@/app/lib/ibc-db';

interface LocalStorageWarningProps {
  tool: 'visualizador' | 'empaquetador';
}

const DISMISS_KEY = 'ibc-warning-dismissed';

export default function LocalStorageWarning({ tool }: LocalStorageWarningProps) {
  const [dismissed, setDismissed] = useState(true); // Start hidden to avoid flash
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const wasDismissed = localStorage.getItem(DISMISS_KEY) === '1';
    setDismissed(wasDismissed);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  const handleExport = async () => {
    try {
      await downloadExport(tool);
    } catch (err) {
      console.error('Error al exportar datos:', err);
    }
  };

  const handleImportClick = () => {
    fileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await readImportFile(file);
      await importToolData(data);
      window.location.reload();
    } catch (err) {
      console.error('Error al importar datos:', err);
      alert(err instanceof Error ? err.message : 'Error al importar archivo');
    } finally {
      setImporting(false);
      // Reset input para permitir re-importar mismo archivo
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (dismissed) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 text-sm flex items-center gap-3 flex-shrink-0">
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">
        Los datos de esta herramienta se guardan solo en este navegador.
        Exporta una copia de respaldo para no perderlos.
      </span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button variant="outline" size="sm" onClick={handleExport} className="h-7 text-xs">
          Exportar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleImportClick}
          disabled={importing}
          className="h-7 text-xs"
        >
          {importing ? 'Importando...' : 'Importar'}
        </Button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-sm hover:bg-amber-100 transition-colors"
          aria-label="Cerrar aviso"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".ibctools"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
