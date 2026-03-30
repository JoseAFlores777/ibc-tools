'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Card,
  Badge,
  Separator,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/lib/shadcn/ui';
import {
  Package,
  Trash2,
  RotateCcw,
  Calendar,
  Music,
  FileText,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { SavedPackage } from '@/app/empaquetador/lib/package-db';
import { getAllPackages, deletePackage } from '@/app/empaquetador/lib/package-db';

interface PackageHistoryProps {
  onBack: () => void;
  onLoad: (pkg: SavedPackage) => void;
}

export default function PackageHistory({ onBack, onLoad }: PackageHistoryProps) {
  const [packages, setPackages] = useState<SavedPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    getAllPackages()
      .then(setPackages)
      .catch((err) => console.error('Error al cargar historial:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleDelete = async (id: string) => {
    try {
      await deletePackage(id);
      setPackages((prev) => prev.filter((p) => p.id !== id));
      toast.success('Paquete eliminado');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-HN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={onBack}
            className="text-sm text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1 cursor-pointer mb-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Empaquetador
          </button>
          <h2 className="text-2xl font-bold text-slate-800">Historial de Paquetes</h2>
          <p className="text-slate-500 text-sm mt-1">
            Paquetes generados anteriormente. Puedes re-cargarlos o eliminarlos.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No hay paquetes en el historial.</p>
          <p className="text-slate-400 text-xs mt-1">Los paquetes se guardan automáticamente al generarlos.</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Paquete</TableHead>
                <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                <TableHead className="text-center">Himnos</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Audio</TableHead>
                <TableHead className="hidden md:table-cell">Configuración</TableHead>
                <TableHead className="w-28"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  {/* Nombre + himnos */}
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-slate-800 truncate max-w-[200px]">
                        {pkg.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {pkg.hymns.map((h) => h.hymn_number ? `#${h.hymn_number}` : h.name).join(', ')}
                      </p>
                    </div>
                  </TableCell>

                  {/* Fecha */}
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(pkg.createdAt)}
                    </span>
                  </TableCell>

                  {/* Himnos count */}
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      {pkg.hymnCount}
                    </Badge>
                  </TableCell>

                  {/* Audio count */}
                  <TableCell className="text-center hidden sm:table-cell">
                    <Badge variant="outline" className="text-xs">
                      <Music className="h-3 w-3 mr-1" />
                      {pkg.audioCount}
                    </Badge>
                  </TableCell>

                  {/* Config */}
                  <TableCell className="hidden md:table-cell">
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-[10px]">
                        {pkg.layout === 'one-per-page' ? '1/pág' : '2/pág'}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {pkg.style === 'decorated' ? 'Decorado' : 'Plano'}
                      </Badge>
                    </div>
                  </TableCell>

                  {/* Acciones */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer"
                        onClick={() => onLoad(pkg)}
                        aria-label="Cargar paquete"
                        title="Cargar en el empaquetador"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer"
                        onClick={() => handleDelete(pkg.id)}
                        aria-label="Eliminar paquete"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-4 py-2 text-xs text-slate-400 border-t bg-slate-50">
            {packages.length} paquete{packages.length !== 1 ? 's' : ''} guardado{packages.length !== 1 ? 's' : ''}
          </div>
        </Card>
      )}
    </div>
  );
}
