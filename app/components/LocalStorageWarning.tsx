'use client';

/**
 * Componentes de configuracion local para herramientas IBC:
 *
 * - ToolSettingsButton: boton de engranaje que abre modal con importar/exportar
 * - ToolWelcomeModal: se muestra al entrar si la BD esta vacia (importar o comenzar nuevo)
 */

import { useState, useEffect, useRef } from 'react';
import { Settings, Download, Upload, FolderOpen, Sparkles } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Separator,
} from '@/lib/shadcn/ui';
import { downloadExport, readImportFile, importToolData, isToolEmpty } from '@/app/lib/ibc-db';

type ToolName = 'visualizador' | 'empaquetador';

// ---------------------------------------------------------------------------
// ToolSettingsButton — boton de engranaje + modal de importar/exportar
// ---------------------------------------------------------------------------

export function ToolSettingsButton({ tool }: { tool: ToolName }) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      await downloadExport(tool);
    } catch (err) {
      console.error('Error al exportar:', err);
    }
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
      alert(err instanceof Error ? err.message : 'Error al importar');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setOpen(true)}
        aria-label="Configuracion"
      >
        <Settings className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Configuracion</DialogTitle>
          <p className="text-sm text-muted-foreground -mt-2">
            Los datos de esta herramienta se guardan localmente en este navegador.
            Exporta una copia para trasladarla a otra computadora.
          </p>

          <Separator />

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 text-blue-500" />
              <div className="text-left">
                <span className="text-sm font-medium block">Exportar datos</span>
                <span className="text-[10px] text-muted-foreground">
                  Descargar archivo .ibctools
                </span>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => fileRef.current?.click()}
              disabled={importing}
            >
              <Upload className="h-4 w-4 text-green-500" />
              <div className="text-left">
                <span className="text-sm font-medium block">
                  {importing ? 'Importando...' : 'Importar datos'}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Cargar archivo .ibctools
                </span>
              </div>
            </Button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".ibctools"
            onChange={handleFileChange}
            className="hidden"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// ToolWelcomeModal — se muestra al entrar si la BD esta vacia
// ---------------------------------------------------------------------------

export function ToolWelcomeModal({
  tool,
  toolLabel,
}: {
  tool: ToolName;
  toolLabel: string;
}) {
  const [show, setShow] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    isToolEmpty(tool).then((empty) => {
      if (empty) setShow(true);
    });
  }, [tool]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const data = await readImportFile(file);
      await importToolData(data);
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al importar');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (!show) return null;

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="max-w-sm">
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-lg">
            Bienvenido al {toolLabel}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            No hay datos guardados en este navegador.
            ¿Quieres importar una configuracion existente o comenzar desde cero?
          </p>

          <div className="w-full space-y-2 mt-2">
            <Button
              variant="outline"
              className="w-full gap-2 h-12"
              onClick={() => fileRef.current?.click()}
              disabled={importing}
            >
              <FolderOpen className="h-4 w-4" />
              {importing ? 'Importando...' : 'Importar archivo .ibctools'}
            </Button>

            <Button
              className="w-full gap-2 h-12"
              onClick={() => setShow(false)}
            >
              <Sparkles className="h-4 w-4" />
              Comenzar nuevo
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground mt-1">
            Los datos se guardan localmente. Puedes exportarlos
            desde el boton de configuracion (⚙) en cualquier momento.
          </p>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".ibctools"
          onChange={handleImport}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
}

// Keep default export for backward compatibility during transition
export default function LocalStorageWarning({ tool }: { tool: ToolName }) {
  return null; // Replaced by ToolSettingsButton + ToolWelcomeModal
}
