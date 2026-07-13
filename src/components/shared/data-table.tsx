"use client";

import { ColumnDef, flexRender, getCoreRowModel, useReactTable, getPaginationRowModel, type SortingState, getSortedRowModel, type ColumnFiltersState, getFilteredRowModel, type VisibilityState } from "@tanstack/react-table";
import { useState, type ReactNode, useCallback, useEffect, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Search, Columns, GripVertical, ChevronUp, ChevronDown, Pin, PinOff, RotateCcw } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  batchBar?: ReactNode;
  filterBar?: ReactNode;
}

export function DataTable<TData extends { id: string }, TValue>({ columns, data, searchKey, searchPlaceholder = "搜索...", selectable, selectedIds = [], onSelectionChange, batchBar, filterBar }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [pinnedCols, setPinnedCols] = useState<Set<string>>(new Set());
  const [colPanelOpen, setColPanelOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setColPanelOpen(false);
    };
    if (colPanelOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [colPanelOpen]);

  const table = useReactTable({
    data, columns, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting, getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters, getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    state: { sorting, columnFilters, columnVisibility, columnOrder: columnOrder.length > 0 ? columnOrder : undefined },
  });

  const hideableCols = table.getAllLeafColumns().filter(c => c.getCanHide() && c.id !== "act" && c.id !== "sel");

  // Build ordered list: pinned first, then ordered non-pinned, then rest
  const orderedCols = useCallback(() => {
    const all = hideableCols.map(c => c.id);
    const order = columnOrder.length > 0 ? columnOrder.filter(id => all.includes(id)) : all;
    const pinned = order.filter(id => pinnedCols.has(id));
    const unpinned = order.filter(id => !pinnedCols.has(id));
    const remaining = all.filter(id => !order.includes(id));
    return [...pinned, ...unpinned, ...remaining].map(id => hideableCols.find(c => c.id === id)!).filter(Boolean);
  }, [hideableCols, columnOrder, pinnedCols]);

  const moveUp = (colId: string) => {
    const list = orderedCols().map(c => c.id);
    const idx = list.indexOf(colId);
    if (idx <= 0) return;
    [list[idx], list[idx - 1]] = [list[idx - 1]!, list[idx]!];
    setColumnOrder(list);
  };

  const moveDown = (colId: string) => {
    const list = orderedCols().map(c => c.id);
    const idx = list.indexOf(colId);
    if (idx < 0 || idx >= list.length - 1) return;
    [list[idx], list[idx + 1]] = [list[idx + 1]!, list[idx]!];
    setColumnOrder(list);
  };

  const togglePin = (colId: string) => {
    setPinnedCols(prev => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId); else next.add(colId);
      return next;
    });
    // Ensure columnOrder reflects current order before pinning
    if (columnOrder.length === 0) setColumnOrder(orderedCols().map(c => c.id));
  };

  const resetOrder = () => { setColumnOrder([]); setPinnedCols(new Set()); };

  // DnD handlers
  const onDragStart = (e: React.DragEvent, colId: string) => {
    setDragId(colId);
    e.dataTransfer.effectAllowed = "move";
    (e.currentTarget as HTMLElement).style.opacity = "0.4";
  };
  const onDragEnd = (e: React.DragEvent) => {
    setDragId(null);
    (e.currentTarget as HTMLElement).style.opacity = "1";
  };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const onDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) return;
    const list = orderedCols().map(c => c.id);
    const from = list.indexOf(dragId);
    const to = list.indexOf(targetId);
    if (from < 0 || to < 0) return;
    list.splice(from, 1);
    list.splice(to, 0, dragId);
    setColumnOrder(list);
    setDragId(null);
  };

  const allIds = table.getRowModel().rows.map(r => r.original.id);
  const allSelected = selectedIds.length > 0 && allIds.every(id => selectedIds.includes(id));
  const toggleAll = () => onSelectionChange?.(allSelected ? [] : allIds);
  const toggleOne = (id: string) => onSelectionChange?.(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);

  const colLabel = (col: typeof hideableCols[number]) =>
    typeof col.columnDef.header === "string" ? col.columnDef.header : col.id;

  const pinnedList = orderedCols().filter(c => pinnedCols.has(c.id));
  const unpinnedList = orderedCols().filter(c => !pinnedCols.has(c.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          {searchKey && <div className="relative max-w-xs flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={searchPlaceholder} value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""} onChange={(e) => table.getColumn(searchKey)?.setFilterValue(e.target.value)} className="pl-9" /></div>}
          {hideableCols.length > 0 && (
            <div className="relative" ref={panelRef}>
              <Button variant="outline" size="sm" onClick={() => setColPanelOpen(!colPanelOpen)} className="gap-1"><Columns className="h-3.5 w-3.5" />列设置</Button>
              {colPanelOpen && (
                <div className="absolute top-full mt-1 right-0 z-50 w-64 rounded-md border bg-popover shadow-md p-2">
                  {pinnedList.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-1 mb-1">已置顶</p>
                      {pinnedList.map(col => (
                        <ColumnRow key={col.id} col={col} label={colLabel(col)} isPinned onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver} onDrop={onDrop} onMoveUp={moveUp} onMoveDown={moveDown} onTogglePin={togglePin} />
                      ))}
                    </div>
                  )}
                  {unpinnedList.length > 0 && (
                    <div>
                      {pinnedList.length > 0 && <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-1 mb-1">拖拽排序</p>}
                      {unpinnedList.map(col => (
                        <ColumnRow key={col.id} col={col} label={colLabel(col)} isPinned={false} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver} onDrop={onDrop} onMoveUp={moveUp} onMoveDown={moveDown} onTogglePin={togglePin} />
                      ))}
                    </div>
                  )}
                  <div className="border-t mt-2 pt-2">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground" onClick={resetOrder}><RotateCcw className="h-3 w-3 mr-1" />重置为默认顺序</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {selectable && selectedIds.length > 0 && batchBar && <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm"><span className="text-muted-foreground">已选 {selectedIds.length} 项</span>{batchBar}</div>}
      </div>
      {filterBar && <div className="flex items-center">{filterBar}</div>}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {selectable && <TableHead className="w-10 h-10"><Checkbox checked={allSelected} onCheckedChange={toggleAll} /></TableHead>}
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="h-10 text-xs font-medium text-muted-foreground uppercase tracking-wider">{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="h-11 hover:bg-muted/50">
                {selectable && <TableCell className="w-10"><Checkbox checked={selectedIds.includes(row.original.id)} onCheckedChange={() => toggleOne(row.original.id)} /></TableCell>}
                {row.getVisibleCells().map((cell) => (<TableCell key={cell.id} className="text-sm">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}
              </TableRow>
            )) : (<TableRow><TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="h-24 text-center text-muted-foreground">暂无数据</TableCell></TableRow>)}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">共 {table.getFilteredRowModel().rows.length} 条</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm tabular-nums">{table.getState().pagination.pageIndex + 1} / {table.getPageCount()}</span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}

// Sub-component for each column row in the settings panel
function ColumnRow({
  col, label, isPinned,
  onDragStart, onDragEnd, onDragOver, onDrop,
  onMoveUp, onMoveDown, onTogglePin,
}: {
  col: { id: string; getIsVisible: () => boolean; toggleVisibility: () => void };
  label: string; isPinned: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onTogglePin: (id: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-1 px-1 py-0.5 text-sm rounded hover:bg-muted/50 cursor-default group"
      draggable
      onDragStart={e => onDragStart(e, col.id)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={e => onDrop(e, col.id)}
    >
      <GripVertical className="h-3 w-3 text-muted-foreground shrink-0 cursor-grab" />
      <span className="flex-1 truncate text-xs">{label}</span>
      <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100" onClick={() => onMoveUp(col.id)}><ChevronUp className="h-3 w-3" /></Button>
      <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100" onClick={() => onMoveDown(col.id)}><ChevronDown className="h-3 w-3" /></Button>
      <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => onTogglePin(col.id)} title={isPinned ? "取消置顶" : "置顶"}>
        {isPinned ? <PinOff className="h-3 w-3 text-accent" /> : <Pin className="h-3 w-3 text-muted-foreground" />}
      </Button>
      <Checkbox className="shrink-0" checked={col.getIsVisible()} onCheckedChange={() => col.toggleVisibility()} />
    </div>
  );
}
