const roleConfig: Record<string, { label: string; classes: string }> = {
  admin:          { label: "Admin",          classes: "bg-red-500/15 text-red-600 dark:text-red-400 ring-red-500/25" },
  profesor:       { label: "Profesor",       classes: "bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-blue-500/25" },
  administrativo: { label: "Administrativo", classes: "bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-amber-500/25" },
  estudiante:     { label: "Estudiante",     classes: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-emerald-500/25" },
}

interface UsuarioRolBadgeProps {
  rol: string
}

export function UsuarioRolBadge({ rol }: UsuarioRolBadgeProps) {
  const config = roleConfig[rol] ?? {
    label: rol,
    classes: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 ring-zinc-500/25",
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${config.classes}`}
    >
      {config.label}
    </span>
  )
}
