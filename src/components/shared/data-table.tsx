"use client";

import { ColumnDef, flexRender, getCoreRowModel, useReactTable, getPaginationRowModel, type SortingState, getSortedRowModel, type ColumnFiltersState, getFilteredRowModel, type RowSelectionState } from "@tanstack/react-table";
import { useState, type ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  batchBar?: ReactNode;
}

export function DataTable<TData extends { id: string }, TValue>({ columns, data, searchKey, searchPlaceholder = "搜索...", selectable, selectedIds = [], onSelectionChange, batchBar }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data, columns, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting, getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters, getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
  });

  const allIds = table.getRowModel().rows.map(r => r.original.id);
  const allSelected = selectedIds.length > 0 && allIds.every(id => selectedIds.includes(id));

  const toggleAll = () => onSelectionChange?.(allSelected ? [] : allIds);
  const toggleOne = (id: string) => onSelectionChange?.(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        {searchKey && <div className="relative max-w-xs flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={searchPlaceholder} value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""} onChange={(e) => table.getColumn(searchKey)?.setFilterValue(e.target.value)} className="pl-9" /></div>}
        {selectable && selectedIds.length > 0 && batchBar && <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm"><span className="text-muted-foreground">已选 {selectedIds.length} 项</span>{batchBar}</div>}
      </div>
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
