// Paleta de colores — se elige de forma determinística según el nombre
const AVATAR_COLORS = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-600",
  "bg-teal-500",
  "bg-cyan-600",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-pink-500",
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

function getInitials(nombres: string, apellido?: string): string {
  const first = nombres?.trim().charAt(0) ?? ""
  const last  = apellido?.trim().charAt(0) ?? ""
  return (first + last).toUpperCase()
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
}

interface UsuarioAvatarProps {
  nombres: string
  apellidoPaterno?: string
  size?: keyof typeof sizeClasses
}

export function UsuarioAvatar({ nombres, apellidoPaterno, size = "md" }: UsuarioAvatarProps) {
  const initials    = getInitials(nombres, apellidoPaterno)
  const colorClass  = AVATAR_COLORS[hashString(nombres + (apellidoPaterno ?? "")) % AVATAR_COLORS.length]

  return (
    <div
      className={`${sizeClasses[size]} ${colorClass} flex items-center justify-center rounded-full text-white font-bold shrink-0 select-none`}
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}
