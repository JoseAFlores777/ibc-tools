'use client';

import { useState, useEffect, useMemo } from 'react';
import type { WizardState, WizardAction } from '@/app/empaquetador/hooks/useWizardReducer';
import type { HymnSearchResult } from '@/app/interfaces/Hymn.interface';
import { useHymnSearch } from '@/app/empaquetador/hooks/useHymnSearch';
import SelectedHymnChip from '@/app/empaquetador/components/SelectedHymnChip';
import HymnDetailView from '@/app/empaquetador/components/HymnDetailModal';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  Input,
  Badge,
  Button,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle,
  Card,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
} from '@/lib/shadcn/ui';
import { cn } from '@/app/lib/shadcn/utils';
import {
  Search, SlidersHorizontal, X, Hash, Type, FileText, Music, Mic,
  ChevronLeft, ChevronRight, ListFilter, ArrowUpDown, ArrowUp, ArrowDown, Eye,
} from 'lucide-react';

interface StepSeleccionProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

export default function StepSeleccion({ state, dispatch }: StepSeleccionProps) {
  const { query, setQuery, hymnal, setHymnal, category, setCategory, searchFields, toggleSearchField, audioFilters, toggleAudioFilter, allResults, filteredResults, isLoading, error } =
    useHymnSearch();

  const [hymnals, setHymnals] = useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [detailHymn, setDetailHymn] = useState<HymnSearchResult | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/hymnals').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
    ])
      .then(([hymnalsData, categoriesData]) => {
        if (cancelled) return;
        const loadedHymnals = hymnalsData.data ?? [];
        setHymnals(loadedHymnals);
        setCategories(categoriesData.data ?? []);
        // Preseleccionar "Himnos majestuosos" si no hay himnario seleccionado
        if (!hymnal) {
          const majestuosos = loadedHymnals.find(
            (h: { id: string; name: string }) => h.name.toLowerCase().includes('majestuosos'),
          );
          if (majestuosos) setHymnal(majestuosos.id);
        }
      })
      .catch((err) => console.error('Error al cargar filtros:', err))
      .finally(() => { if (!cancelled) setFiltersLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const hasSearchQuery = query.trim().length > 0 || hymnal !== '' || category !== '';
  const hasQuery = hasSearchQuery || showOnlySelected;
  const hasSelectedHymns = state.selectedHymns.length > 0;
  const hasActiveFilters = hymnal !== '' || category !== '' || audioFilters.size > 0;

  // Data para la tabla
  const selectedIdSet = useMemo(() => new Set(state.selectedHymns.map((h) => h.id)), [state.selectedHymns]);
  const tableData = useMemo(() => {
    if (showOnlySelected) {
      return hasSearchQuery
        ? filteredResults.filter((h) => selectedIdSet.has(h.id))
        : state.selectedHymns;
    }
    return filteredResults;
  }, [showOnlySelected, hasSearchQuery, filteredResults, selectedIdSet, state.selectedHymns]);

  const handleToggle = (hymn: HymnSearchResult) => {
    const isSelected = selectedIdSet.has(hymn.id);
    if (isSelected) {
      dispatch({ type: 'REMOVE_HYMN', hymnId: hymn.id });
    } else {
      dispatch({ type: 'ADD_HYMN', hymn });
    }
  };

  const clearFilters = () => {
    setHymnal('');
    setCategory('');
    for (const f of audioFilters) toggleAudioFilter(f);
  };

  // Columnas TanStack — estables, sin deps de selección
  const columns = useMemo<ColumnDef<HymnSearchResult>[]>(() => [
    {
      id: 'select',
      size: 40,
      enableSorting: false,
      header: () => null,
      cell: () => null, // Se renderiza manualmente en el TableBody
    },
    {
      accessorKey: 'hymn_number',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="h-8 -ml-3 text-xs cursor-pointer" onClick={() => column.toggleSorting()}>
          #
          {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> :
           column.getIsSorted() === 'desc' ? <ArrowDown className="ml-1 h-3 w-3" /> :
           <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />}
        </Button>
      ),
      cell: ({ getValue }) => {
        const v = getValue<number | null>();
        return <span className="font-mono text-slate-400 text-sm">{v !== null ? String(v).padStart(3, '0') : '—'}</span>;
      },
      size: 80,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="h-8 -ml-3 text-xs cursor-pointer" onClick={() => column.toggleSorting()}>
          Nombre
          {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> :
           column.getIsSorted() === 'desc' ? <ArrowDown className="ml-1 h-3 w-3" /> :
           <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />}
        </Button>
      ),
      cell: ({ getValue }) => <span className="font-medium text-slate-800">{getValue<string>()}</span>,
    },
    {
      id: 'hymnal',
      accessorFn: (row) => row.hymnal?.name ?? '',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="h-8 -ml-3 text-xs cursor-pointer hidden sm:flex" onClick={() => column.toggleSorting()}>
          Himnario
          {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> :
           column.getIsSorted() === 'desc' ? <ArrowDown className="ml-1 h-3 w-3" /> :
           <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />}
        </Button>
      ),
      cell: ({ getValue }) => <span className="text-sm text-slate-500 hidden sm:inline">{getValue<string>() || '—'}</span>,
      meta: { className: 'hidden sm:table-cell' },
    },
    {
      id: 'categories',
      enableSorting: false,
      header: () => <span className="hidden md:inline">Categorías</span>,
      cell: ({ row }) => (
        <div className="flex-wrap gap-1 hidden md:flex">
          {row.original.categories.slice(0, 2).map((cat) =>
            cat.hymn_categories_id ? (
              <Badge key={cat.hymn_categories_id.id} variant="secondary" className="text-[10px] font-normal">
                {cat.hymn_categories_id.name}
              </Badge>
            ) : null,
          )}
          {row.original.categories.length > 2 && (
            <Badge variant="outline" className="text-[10px]">+{row.original.categories.length - 2}</Badge>
          )}
        </div>
      ),
      meta: { className: 'hidden md:table-cell' },
    },
    {
      id: 'actions',
      size: 80,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          {row.original.hasAnyAudio && <Music className="h-4 w-4 text-primary flex-shrink-0" />}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setDetailHymn(row.original)}
            aria-label={`Ver detalles de ${row.original.name}`}
          >
            <Eye className="h-4 w-4 text-slate-400" />
          </Button>
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 30 } },
  });

  const mobileSelectedPanel = (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-slate-700">Mi Selección</h3>
        {hasSelectedHymns && <Badge variant="default" className="text-xs">{state.selectedHymns.length}</Badge>}
      </div>
      {hasSelectedHymns ? (
        <ScrollArea className="h-[50vh]" aria-label="Himnos seleccionados">
          <div className="space-y-0.5">
            {state.selectedHymns.map((hymn) => (
              <SelectedHymnChip key={hymn.id} hymn={hymn} onRemove={(hymnId) => dispatch({ type: 'REMOVE_HYMN', hymnId })} />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <p className="text-slate-400 text-sm py-4">Busca y selecciona himnos desde los resultados.</p>
      )}
    </div>
  );

  return (
    <div className="flex h-full overflow-hidden">
      <main className="flex-1 overflow-hidden flex flex-col">
        {detailHymn ? (
          <div className="flex-1 overflow-auto">
            <HymnDetailView
              hymn={detailHymn}
              onBack={() => setDetailHymn(null)}
              results={tableData.length > 0 ? tableData : filteredResults.length > 0 ? filteredResults : allResults}
              onNavigate={setDetailHymn}
              isSelected={selectedIdSet.has(detailHymn.id)}
              onToggleSelect={handleToggle}
              onSyncPage={() => {}}
            />
          </div>
        ) : (
          <div className={cn('flex-1 flex flex-col overflow-hidden px-4 pt-8', hasSelectedHymns && 'pb-[132px] lg:pb-0')}>
            <h2 className="text-2xl font-bold text-slate-800 mb-1 flex-shrink-0">Explorar Himnario</h2>
            <p className="text-slate-500 text-sm mb-6 flex-shrink-0">
              Busca por número, nombre o fragmento de letra. Sin importar acentos ni mayúsculas.
            </p>

            {/* Checkboxes de campos de busqueda */}
            <div className="flex items-center gap-4 mb-2 text-xs text-slate-500 flex-shrink-0">
              <span className="text-slate-400">Buscar en:</span>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <Checkbox checked={searchFields.has('name')} onCheckedChange={() => toggleSearchField('name')} className="h-3.5 w-3.5" />
                <Type className="h-3 w-3" /> Nombre
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <Checkbox checked={searchFields.has('number')} onCheckedChange={() => toggleSearchField('number')} className="h-3.5 w-3.5" />
                <Hash className="h-3 w-3" /> Número
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <Checkbox checked={searchFields.has('letter')} onCheckedChange={() => toggleSearchField('letter')} className="h-3.5 w-3.5" />
                <FileText className="h-3 w-3" /> Letra
              </label>
            </div>

            {/* Barra de busqueda */}
            <div className="flex gap-2 mb-3 flex-shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Busca por número, título o fragmento de letra..." value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar himnos" className="pl-10 h-11" />
              </div>
              <Button
                variant={showFilters || hasActiveFilters ? 'default' : 'outline'}
                size="icon" className="h-11 w-11 flex-shrink-0" onClick={() => setShowFilters(!showFilters)} aria-label="Filtros"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* Panel de filtros */}
            {showFilters && (
              <div className="mb-3 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-3 flex-shrink-0">
                <div className="flex flex-wrap items-center gap-3">
                  <Select value={hymnal || '__all__'} onValueChange={(v) => setHymnal(v === '__all__' ? '' : v)} disabled={filtersLoading}>
                    <SelectTrigger className="w-auto min-w-[180px] h-9 text-sm bg-white"><SelectValue placeholder={filtersLoading ? 'Cargando...' : 'Himnario'} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todos los himnarios</SelectItem>
                      {hymnals.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={category || '__all__'} onValueChange={(v) => setCategory(v === '__all__' ? '' : v)} disabled={filtersLoading}>
                    <SelectTrigger className="w-auto min-w-[180px] h-9 text-sm bg-white"><SelectValue placeholder={filtersLoading ? 'Cargando...' : 'Categoría'} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todas las categorías</SelectItem>
                      {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-xs cursor-pointer">
                      <X className="h-3 w-3 mr-1" /> Limpiar todo
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="text-slate-400">Audio:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <Checkbox checked={audioFilters.has('hasAudio')} onCheckedChange={() => toggleAudioFilter('hasAudio')} className="h-3.5 w-3.5" />
                    <Music className="h-3 w-3" /> Con pista
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <Checkbox checked={audioFilters.has('hasMidi')} onCheckedChange={() => toggleAudioFilter('hasMidi')} className="h-3.5 w-3.5" />
                    MIDI
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <Checkbox checked={audioFilters.has('hasVoices')} onCheckedChange={() => toggleAudioFilter('hasVoices')} className="h-3.5 w-3.5" />
                    <Mic className="h-3 w-3" /> Con voces
                  </label>
                  {hasSelectedHymns && (
                    <>
                      <span className="text-slate-300">|</span>
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <Checkbox checked={showOnlySelected} onCheckedChange={(v) => setShowOnlySelected(Boolean(v))} className="h-3.5 w-3.5" />
                        <ListFilter className="h-3 w-3" /> Solo seleccionados ({state.selectedHymns.length})
                      </label>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Tabla */}
            {isLoading ? (
              <div className="space-y-2 mt-4">
                {[1, 2, 3, 4, 5].map((i) => <div key={i} className="animate-pulse bg-slate-100 rounded h-12" />)}
              </div>
            ) : error ? (
              <p className="text-destructive text-sm mt-4">Error al buscar. Intenta de nuevo.</p>
            ) : !hasQuery ? (
              <div className="text-center py-16">
                <Search className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Escribe un número, nombre o fragmento de letra para buscar.</p>
              </div>
            ) : tableData.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-400 text-sm">
                  {showOnlySelected ? 'No hay himnos seleccionados.' : 'No se encontraron himnos. Intenta con otro término.'}
                </p>
              </div>
            ) : (
              <Card className="mt-2 mb-4 flex-1 flex flex-col overflow-hidden min-h-[40vh]">
                <div className="flex-1 overflow-auto min-h-0">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="hover:bg-transparent">
                          {headerGroup.headers.map((header) => {
                            // Renderizar select header manualmente
                            if (header.column.id === 'select') {
                              const pageRows = table.getRowModel().rows;
                              const allPageSelected = pageRows.length > 0 && pageRows.every((r) => selectedIdSet.has(r.original.id));
                              return (
                                <TableHead key={header.id} className="w-10">
                                  <Checkbox
                                    checked={allPageSelected}
                                    onCheckedChange={(checked) => {
                                      for (const row of pageRows) {
                                        const sel = selectedIdSet.has(row.original.id);
                                        if (checked && !sel) dispatch({ type: 'ADD_HYMN', hymn: row.original });
                                        else if (!checked && sel) dispatch({ type: 'REMOVE_HYMN', hymnId: row.original.id });
                                      }
                                    }}
                                    aria-label="Seleccionar todos de esta página"
                                  />
                                </TableHead>
                              );
                            }
                            return (
                              <TableHead
                                key={header.id}
                                className={cn(
                                  header.column.id === 'actions' && 'w-20',
                                  (header.column.columnDef.meta as any)?.className,
                                )}
                                style={header.column.getSize() !== 150 ? { width: header.column.getSize() } : undefined}
                              >
                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                              </TableHead>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows.map((row) => {
                        const isSelected = selectedIdSet.has(row.original.id);
                        return (
                          <TableRow key={row.id} className={cn('transition-colors', isSelected && 'bg-primary/5')} data-state={isSelected ? 'selected' : undefined}>
                            {row.getVisibleCells().map((cell) => {
                              // Checkbox — renderizado manualmente para evitar recrear columns
                              if (cell.column.id === 'select') {
                                return (
                                  <TableCell key={cell.id} className="w-10">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => handleToggle(row.original)}
                                      aria-label={`Seleccionar ${row.original.name}`}
                                    />
                                  </TableCell>
                                );
                              }
                              return (
                                <TableCell key={cell.id} className={cn((cell.column.columnDef.meta as any)?.className)}>
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination footer */}
                <div className="px-4 py-2.5 border-t bg-slate-50 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{tableData.length} himno{tableData.length !== 1 ? 's' : ''}</span>
                    <span className="text-slate-300">|</span>
                    <Select value={String(table.getState().pagination.pageSize)} onValueChange={(v) => table.setPageSize(Number(v))}>
                      <SelectTrigger className="h-7 w-auto min-w-[70px] text-xs bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[15, 30, 50, 100].map((size) => <SelectItem key={size} value={String(size)}>{size} por pág.</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {table.getPageCount() > 1 && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} aria-label="Página anterior">
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <span className="text-xs text-slate-500 px-2 tabular-nums">
                        {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} aria-label="Página siguiente">
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Drawer mobile */}
      <div className="lg:hidden">
        {hasSelectedHymns && !detailHymn && (
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" className="fixed bottom-[72px] left-0 right-0 h-12 z-40 flex items-center justify-center gap-2 rounded-none border-x-0 border-b-0">
                <span className="text-sm font-semibold text-slate-700">Mi Selección</span>
                <Badge variant="default">{state.selectedHymns.length}</Badge>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="p-4">
                <DrawerTitle className="mb-3">Mi Selección</DrawerTitle>
                {mobileSelectedPanel}
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </div>
    </div>
  );
}
