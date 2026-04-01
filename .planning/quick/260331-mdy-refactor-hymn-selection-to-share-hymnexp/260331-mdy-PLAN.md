---
phase: quick
plan: 260331-mdy
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/HymnExplorer.tsx
  - app/hooks/useHymnSearch.ts
  - app/empaquetador/components/StepSeleccion.tsx
  - app/empaquetador/hooks/useHymnSearch.ts
  - app/visualizador/components/PlaylistColumn.tsx
  - app/visualizador/page.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "Empaquetador hymn search/filter/table works identically to before the refactor"
    - "Visualizador can open a dialog to search and add hymns using the same explorer UI"
    - "Both consumers manage their own selection state independently"
  artifacts:
    - path: "app/components/HymnExplorer.tsx"
      provides: "Shared hymn search/filter/table component"
      min_lines: 200
    - path: "app/hooks/useHymnSearch.ts"
      provides: "Shared search hook (moved from empaquetador)"
  key_links:
    - from: "app/empaquetador/components/StepSeleccion.tsx"
      to: "app/components/HymnExplorer.tsx"
      via: "import and render with selectedIds + onToggle"
      pattern: "HymnExplorer"
    - from: "app/visualizador/components/PlaylistColumn.tsx"
      to: "app/components/HymnExplorer.tsx"
      via: "Dialog containing HymnExplorer"
      pattern: "HymnExplorer"
---

<objective>
Extract the hymn search/filter/table UI from StepSeleccion.tsx into a shared HymnExplorer component that both empaquetador and visualizador can reuse.

Purpose: Eliminate duplicated search UI, give visualizador a full-featured hymn browser instead of a narrow dropdown.
Output: Shared HymnExplorer component, updated StepSeleccion, updated PlaylistColumn with dialog-based explorer.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/empaquetador/components/StepSeleccion.tsx
@app/empaquetador/components/HymnDetailModal.tsx
@app/empaquetador/hooks/useHymnSearch.ts
@app/visualizador/components/PlaylistColumn.tsx
@app/visualizador/page.tsx
@app/interfaces/Hymn.interface.ts

<interfaces>
<!-- Key contracts for the executor -->

From app/interfaces/Hymn.interface.ts:
```typescript
export interface HymnSearchResult {
  id: string;
  name: string;
  hymn_number: number | null;
  hymnal: { id: string; name: string } | null;
  categories: Array<{ hymn_categories_id: { id: number; name: string } | null }>;
  audioFiles: HymnAudioFiles;
  hasAnyAudio: boolean;
}
```

From app/empaquetador/hooks/useHymnSearch.ts:
```typescript
export interface UseHymnSearchReturn {
  query: string; setQuery: (q: string) => void;
  hymnal: string; setHymnal: (h: string) => void;
  category: string; setCategory: (c: string) => void;
  searchFields: Set<HymnSearchField>; toggleSearchField: (field: HymnSearchField) => void;
  audioFilters: Set<AudioFilter>; toggleAudioFilter: (filter: AudioFilter) => void;
  allResults: HymnSearchResult[]; filteredResults: HymnSearchResult[];
  pageResults: HymnSearchResult[];
  isLoading: boolean; error: string | null;
  page: number; setPage: (p: number) => void;
  pageSize: PageSize; setPageSize: (s: PageSize) => void;
  totalPages: number; totalFiltered: number;
}
```

HymnExplorer generic props contract (to be created):
```typescript
interface HymnExplorerProps {
  selectedIds: Set<string>;
  onToggle: (hymn: HymnSearchResult) => void;
  /** Optional: show "Solo seleccionados" filter. Requires selectedHymns for filtering. */
  selectedHymns?: HymnSearchResult[];
  /** Optional: show detail view with nav. Default true. */
  showDetailView?: boolean;
  /** Optional: custom empty state or header. */
  className?: string;
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Move useHymnSearch to shared location and create HymnExplorer component</name>
  <files>app/hooks/useHymnSearch.ts, app/components/HymnExplorer.tsx, app/empaquetador/hooks/useHymnSearch.ts</files>
  <action>
1. **Move useHymnSearch**: Copy `app/empaquetador/hooks/useHymnSearch.ts` to `app/hooks/useHymnSearch.ts` (identical content). Then replace the empaquetador file with a re-export: `export { useHymnSearch, type AudioFilter, type UseHymnSearchReturn, PAGE_SIZE_OPTIONS, type PageSize } from '@/app/hooks/useHymnSearch';` — this preserves existing imports.

2. **Create `app/components/HymnExplorer.tsx`** — a `'use client'` component extracting the search/filter/table UI from StepSeleccion.tsx (lines 53-466 approximately). Props:
   ```typescript
   interface HymnExplorerProps {
     selectedIds: Set<string>;
     onToggle: (hymn: HymnSearchResult) => void;
     /** Pass selected hymns array to enable "Solo seleccionados" filter */
     selectedHymns?: HymnSearchResult[];
     /** Show HymnDetailView when clicking eye icon. Default true. */
     showDetailView?: boolean;
     className?: string;
   }
   ```

   The component owns internally:
   - `useHymnSearch()` (from new shared location `@/app/hooks/useHymnSearch`)
   - Filter state: `hymnals`, `categories`, `filtersLoading`, `showFilters`, `showOnlySelected`
   - `detailHymn` state (for HymnDetailView integration)
   - TanStack table with sorting, pagination
   - The hymnal/category fetch useEffect (lines 64-86)
   - Column definitions (lines 120-209)
   - All the JSX: search field checkboxes, search bar, filter panel, table, pagination footer
   - When `detailHymn` is set and `showDetailView` is true, render `HymnDetailView` (import from `@/app/empaquetador/components/HymnDetailModal`)

   Key differences from StepSeleccion:
   - No wizard state/dispatch — uses `selectedIds` (Set) and `onToggle` callback
   - `handleToggle` calls `props.onToggle(hymn)` directly
   - The `showOnlySelected` filter only appears when `selectedHymns` prop is provided. When active, it filters `tableData` by checking `selectedIds` and falls back to `selectedHymns` for the full list.
   - The select-all checkbox in the table header calls `onToggle` for each row
   - No "Mi Seleccion" sidebar or mobile drawer (those stay in StepSeleccion)
   - The header text "Explorar Himnario" and subtitle stay in the component
   - Remove the outer `pb-[132px] lg:pb-0` padding (that was empaquetador-specific for the sticky bottom bar)

   Do NOT include the mobile drawer, the SelectedHymnChip sidebar, or any wizard-specific logic. Those remain in StepSeleccion.
  </action>
  <verify>
    <automated>cd /Volumes/Samsung_SSD_990_EVO_Plus_4TB_Media/Documents/Church/Projects/Alabanza/ibc-tools && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - app/hooks/useHymnSearch.ts exists with full hook code
    - app/empaquetador/hooks/useHymnSearch.ts re-exports from shared location
    - app/components/HymnExplorer.tsx exists with generic props (selectedIds, onToggle)
    - TypeScript compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Refactor StepSeleccion to use HymnExplorer and update PlaylistColumn with Dialog</name>
  <files>app/empaquetador/components/StepSeleccion.tsx, app/visualizador/components/PlaylistColumn.tsx</files>
  <action>
1. **Refactor StepSeleccion.tsx**: Replace the inline search/filter/table UI with the new HymnExplorer component.
   - Keep: WizardState/dispatch props, `selectedIdSet` memo, `handleToggle` (dispatching ADD_HYMN/REMOVE_HYMN), the mobile drawer with SelectedHymnChip sidebar, the outer layout `<div className="flex h-full overflow-hidden">`
   - Replace: Everything between `<main>` tags (the search bar, filters, table, detail view) with:
     ```tsx
     <main className="flex-1 overflow-hidden flex flex-col">
       <HymnExplorer
         selectedIds={selectedIdSet}
         onToggle={handleToggle}
         selectedHymns={state.selectedHymns}
         className={cn('flex-1 flex flex-col overflow-hidden px-4 pt-8', hasSelectedHymns && 'pb-[132px] lg:pb-0')}
       />
     </main>
     ```
   - Remove all the now-unused imports: `useHymnSearch` direct usage, TanStack table imports, filter-related lucide icons (Search, SlidersHorizontal, Hash, Type, FileText, Music, Mic, ChevronLeft, ChevronRight, ListFilter, ArrowUpDown, ArrowUp, ArrowDown, Eye), Input, Card, Table/TableHeader/TableHead/TableBody/TableRow/TableCell, Checkbox, Select/SelectContent/SelectItem/SelectTrigger/SelectValue. Keep Badge, Button, ScrollArea, Drawer/DrawerContent/DrawerTrigger/DrawerTitle.
   - Remove: `useState` for `hymnals`, `categories`, `filtersLoading`, `showFilters`, `showOnlySelected`, `detailHymn`, `sorting`. Remove `useEffect` for fetching hymnals/categories. Remove `columns` memo. Remove `table` instance. Remove the table JSX.
   - The component should shrink to ~80-100 lines (layout shell + mobile drawer + HymnExplorer).
   - `hasSelectedHymns` is still needed for the mobile drawer visibility.

2. **Update PlaylistColumn.tsx**: Replace the inline dropdown search with a Dialog button that opens HymnExplorer.
   - Add imports: `Dialog, DialogContent, DialogTrigger, DialogTitle` from `@/lib/shadcn/ui`, `HymnExplorer` from `@/app/components/HymnExplorer`, `Plus` from lucide-react.
   - Remove: the `searchContainerRef`, `showResults` state, the click-outside useEffect, the inline `<Input>` search bar, the dropdown results list, the direct `useHymnSearch` usage, and the `handleAddResult` function.
   - Add a `dialogOpen` state (`useState(false)`).
   - Compute `playlistIds` as `useMemo(() => new Set(playlist.map(h => h.id)), [playlist])`.
   - Create `handleExplorerToggle` that calls `onAddHymn(hymn)` (the parent already handles dedup and fetch). Do NOT close the dialog on toggle — let the user add multiple hymns.
   - Replace the search section (the `<div ref={searchContainerRef}>` block) with:
     ```tsx
     <div className="p-3 border-b border-border">
       <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
         <DialogTrigger asChild>
           <Button variant="outline" className="w-full h-8 text-sm gap-1.5">
             <Plus className="h-3.5 w-3.5" />
             Agregar himno
           </Button>
         </DialogTrigger>
         <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
           <DialogTitle className="sr-only">Buscar himnos</DialogTitle>
           <HymnExplorer
             selectedIds={playlistIds}
             onToggle={handleExplorerToggle}
             showDetailView={false}
             className="flex-1 flex flex-col overflow-hidden px-4 pt-6"
           />
         </DialogContent>
       </Dialog>
     </div>
     ```
   - Remove unused imports: `Search`, `Input`, `useHymnSearch`, `useState` (if no longer needed), `useRef` (if searchContainerRef was the only usage), `useEffect` (if click-outside was the only usage). Keep: `Music`, `useRef` (if still used), `useEffect` (if still used).
   - The drag-and-drop playlist section below stays completely unchanged.
  </action>
  <verify>
    <automated>cd /Volumes/Samsung_SSD_990_EVO_Plus_4TB_Media/Documents/Church/Projects/Alabanza/ibc-tools && npx tsc --noEmit 2>&1 | head -30 && npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>
    - StepSeleccion renders HymnExplorer and the empaquetador selection flow works as before
    - PlaylistColumn shows an "Agregar himno" button that opens a Dialog with HymnExplorer
    - No TypeScript errors, build succeeds
    - useHymnSearch is no longer directly imported in either StepSeleccion or PlaylistColumn
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with zero errors
2. `npm run build` completes successfully
3. No remaining direct imports of `useHymnSearch` in StepSeleccion.tsx or PlaylistColumn.tsx (both use HymnExplorer)
4. `app/empaquetador/hooks/useHymnSearch.ts` is a re-export only
</verification>

<success_criteria>
- HymnExplorer is a standalone shared component at app/components/HymnExplorer.tsx
- useHymnSearch lives at app/hooks/useHymnSearch.ts with backward-compatible re-export
- StepSeleccion uses HymnExplorer, keeping only its layout shell and mobile drawer
- PlaylistColumn uses a Dialog with HymnExplorer instead of a dropdown search
- TypeScript compiles and build succeeds
</success_criteria>

<output>
After completion, create `.planning/quick/260331-mdy-refactor-hymn-selection-to-share-hymnexp/260331-mdy-SUMMARY.md`
</output>
