"use client"

import { Loader2 } from "lucide-react"

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading: boolean
  emptyMessage?: string
  onRowClick?: (item: T) => void
  actions?: (item: T) => React.ReactNode
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading,
  emptyMessage = "No hay datos disponibles",
  onRowClick,
  actions,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-3 font-medium text-muted-foreground whitespace-nowrap"
              >
                {col.header}
              </th>
            ))}
            {actions && (
              <th className="px-6 py-3 font-medium text-muted-foreground text-right">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={index}
              onClick={() => onRowClick?.(item)}
              className={`border-b border-border last:border-b-0 ${
                onRowClick ? "cursor-pointer hover:bg-muted/50" : ""
              }`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-6 py-3 text-foreground whitespace-nowrap"
                >
                  {col.render
                    ? col.render(item)
                    : (item[col.key] as React.ReactNode) ?? "—"}
                </td>
              ))}
              {actions && (
                <td className="px-6 py-3 text-right">{actions(item)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
