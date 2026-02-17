const statusStyles: Record<string, string> = {
  activo: "bg-success/10 text-success",
  activa: "bg-success/10 text-success",
  inactivo: "bg-muted text-muted-foreground",
  graduado: "bg-accent text-accent-foreground",
  suspendido: "bg-warning/10 text-warning",
  expulsado: "bg-destructive/10 text-destructive",
  finalizada: "bg-accent text-accent-foreground",
  retirada: "bg-destructive/10 text-destructive",
}

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status.toLowerCase()] ?? "bg-muted text-muted-foreground"
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}
    >
      {status}
    </span>
  )
}
