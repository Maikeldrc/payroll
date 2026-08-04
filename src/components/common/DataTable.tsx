import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Search,
  Filter,
  Columns,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor?: (item: T) => any;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
  hideable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  searchableKeys?: (keyof T | string)[];
  onRowClick?: (item: T) => void;
  actions?: React.ReactNode;
  batchActions?: (selectedItems: T[]) => React.ReactNode;
  pageSize?: number;
}

export function DataTable<T extends { id?: string }>({
  data,
  columns,
  title,
  description,
  searchPlaceholder = "Buscar en la tabla...",
  searchableKeys = [],
  onRowClick,
  actions,
  batchActions,
  pageSize = 15,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<Set<string>>(new Set());
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Filter Data
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((item: any) => {
      if (searchableKeys.length > 0) {
        return searchableKeys.some((k) => String(item[k] || "").toLowerCase().includes(term));
      }
      return Object.values(item).some((v) => String(v || "").toLowerCase().includes(term));
    });
  }, [data, searchTerm, searchableKeys]);

  // Sort Data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    const col = columns.find((c) => c.key === sortKey);
    return [...filteredData].sort((a: any, b: any) => {
      const valA = col?.accessor ? col.accessor(a) : a[sortKey];
      const valB = col?.accessor ? col.accessor(b) : b[sortKey];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      return sortDirection === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredData, sortKey, sortDirection, columns]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedData.length) {
      setSelectedIds(new Set());
    } else {
      const ids = new Set(paginatedData.map((d) => d.id || JSON.stringify(d)));
      setSelectedIds(ids);
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const visibleColumns = columns.filter((c) => !hiddenColumnKeys.has(c.key));

  const selectedItems = useMemo(() => {
    return data.filter((d) => selectedIds.has(d.id || JSON.stringify(d)));
  }, [data, selectedIds]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col my-4">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div>
          {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>

        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-56 transition-all"
            />
          </div>

          {/* Columns Selector */}
          <div className="relative">
            <button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="p-1.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Mostrar/Ocultar columnas"
            >
              <Columns className="w-3.5 h-3.5 text-slate-500" />
              <span>Columnas</span>
            </button>

            {showColumnSelector && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-30 text-xs">
                <div className="font-semibold text-slate-700 pb-1 mb-1 border-b border-slate-100">
                  Visibilidad de Columnas
                </div>
                {columns.map((col) => (
                  <label key={col.key} className="flex items-center gap-2 px-1 py-1 hover:bg-slate-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!hiddenColumnKeys.has(col.key)}
                      onChange={() => {
                        const next = new Set(hiddenColumnKeys);
                        if (next.has(col.key)) next.delete(col.key);
                        else next.add(col.key);
                        setHiddenColumnKeys(next);
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-700 truncate">{col.header}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {actions}
        </div>
      </div>

      {/* Batch Actions Bar */}
      {selectedIds.size > 0 && batchActions && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 flex items-center justify-between text-xs text-indigo-900">
          <span className="font-medium">
            {selectedIds.size} registro(s) seleccionado(s)
          </span>
          <div>{batchActions(selectedItems)}</div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto min-h-[220px]">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px] sticky top-0 z-10">
            <tr>
              {batchActions && (
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && selectedIds.size === paginatedData.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
              )}
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={`py-2.5 px-3 select-none ${col.sortable !== false ? "cursor-pointer hover:bg-slate-200/70" : ""} ${
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                  }`}
                  style={{ width: col.width }}
                >
                  <div className={`flex items-center gap-1.5 ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : "justify-start"}`}>
                    <span>{col.header}</span>
                    {col.sortable !== false && (
                      <ArrowUpDown className={`w-3 h-3 ${sortKey === col.key ? "text-indigo-600" : "text-slate-400"}`} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + (batchActions ? 1 : 0)} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Filter className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No se encontraron registros</p>
                    <p className="text-xs text-slate-400">Pruebe ajustando sus criterios de búsqueda o filtros.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item: any, idx) => {
                const itemId = item.id || `ROW-${idx}`;
                const isSelected = selectedIds.has(itemId);

                return (
                  <tr
                    key={itemId}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`hover:bg-slate-50/80 transition-colors ${onRowClick ? "cursor-pointer" : ""} ${
                      isSelected ? "bg-indigo-50/40" : ""
                    }`}
                  >
                    {batchActions && (
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelectOne(itemId, e as any)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                    )}
                    {visibleColumns.map((col) => {
                      const val = col.accessor ? col.accessor(item) : item[col.key];
                      return (
                        <td
                          key={col.key}
                          className={`py-2.5 px-3 text-slate-800 ${
                            col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                          }`}
                        >
                          {col.render ? col.render(item) : val !== undefined && val !== null ? String(val) : "-"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Pagination */}
      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
        <div>
          Mostrando <span className="font-semibold">{sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> a{" "}
          <span className="font-semibold">{Math.min(currentPage * pageSize, sortedData.length)}</span> de{" "}
          <span className="font-semibold">{sortedData.length}</span> registros
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed bg-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed bg-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
