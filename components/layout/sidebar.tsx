"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ContactRound,
  Building2,
  CalendarRange,
  FileText,
  Clock,
  FolderArchive,
  IdCard,
} from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"

// ── Definición de ítems ───────────────────────────────────────────────────────

interface NavItem {
  href:      string
  label:     string
  icon:      React.ElementType
  /** Si se define, solo se muestra cuando el usuario tiene alguno de estos roles */
  roles?:    string[]
  /** Marca el inicio de un grupo visual con separador */
  groupLabel?: string
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",                  label: "Dashboard",       icon: LayoutDashboard },
  { href: "/dashboard/estudiantes",      label: "Estudiantes",     icon: GraduationCap },
  { href: "/dashboard/acudientes",       label: "Acudientes",      icon: ContactRound },
  { href: "/dashboard/profesores",       label: "Profesores",      icon: Users },
  { href: "/dashboard/cursos",           label: "Cursos",          icon: BookOpen },
  { href: "/dashboard/matriculas",       label: "Matrículas",      icon: ClipboardList },
  // ── Solo admin ──────────────────────────────────────────────────────────────
  {
    href:  "/dashboard/administrativos",
    label: "Administrativos",
    icon:  Building2,
    roles: ["admin"],
  },
  {
    href:  "/dashboard/usuarios",
    label: "Usuarios",
    icon:  ShieldCheck,
    roles: ["admin"],
  },
  // ── Configuración del sistema (solo admin) ──────────────────────────────────
  {
    href:        "/dashboard/configuracion/periodos",
    label:       "Periodos",
    icon:        CalendarRange,
    roles:       ["admin"],
    groupLabel:  "Configuración",
  },
  {
    href:  "/dashboard/configuracion/procesos",
    label: "Inscripciones",
    icon:  FileText,
    roles: ["admin"],
  },
  {
    href:  "/dashboard/configuracion/jornadas",
    label: "Jornadas",
    icon:  Clock,
    roles: ["admin"],
  },
  {
    href:  "/dashboard/configuracion/tipos-archivo",
    label: "Tipos de Archivo",
    icon:  FolderArchive,
    roles: ["admin"],
  },
  {
    href:  "/dashboard/configuracion/tipos-documento",
    label: "Tipos Documento",
    icon:  IdCard,
    roles: ["admin"],
  },
]

// ── Props ─────────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean
  onToggle:  () => void
}

// ── Componente ────────────────────────────────────────────────────────────────

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname    = usePathname()
  const { hasRole } = useAuth()

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname === href || pathname.startsWith(href + "/")
  }

  // Filtra ítems según el rol del usuario actual
  const visibleItems = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.some(r => hasRole(r))
  )

  return (
    <aside
      className={`flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* ── Header / Logo ── */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-accent">
        {collapsed ? (
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary mx-auto">
            <GraduationCap className="w-4 h-4 text-primary-foreground" />
          </div>
        ) : (
          <Link href="/dashboard" className="flex items-center gap-2">
            <img
              src="/escudo_liceo.ico"
              alt="Logo IEAP"
              className="w-14 h-14 object-contain drop-shadow-lg brightness-100"
            />
            <span className="text-lg font-bold text-sidebar-accent-foreground">
              SIGAP
            </span>
          </Link>
        )}
      </div>

      {/* ── Navegación ── */}
      <nav
        className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto"
        role="navigation"
        aria-label="Menú principal"
      >
        {visibleItems.map((item) => {
          const active  = isActive(item.href)
          const Icon    = item.icon
          const isAdmin = item.roles?.includes("admin")

          return (
            <div key={item.href}>
              {/* Separador de grupo */}
              {item.groupLabel && (
                <div className={`mt-3 mb-1 ${collapsed ? "mx-auto w-8 border-t border-sidebar-accent" : "px-3"}`}>
                  {!collapsed && (
                    <span className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest">
                      {item.groupLabel}
                    </span>
                  )}
                  {collapsed && <div className="border-t border-sidebar-accent" />}
                </div>
              )}

              <Link
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors
                  ${collapsed ? "justify-center px-0" : "px-3"}
                  ${active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isAdmin && !active ? "text-red-400/70" : ""
                  }`}
                />
                {!collapsed && (
                  <span className="flex-1">{item.label}</span>
                )}
                {/* Indicador visual de sección admin */}
                {!collapsed && isAdmin && (
                  <span className="text-[10px] font-semibold text-red-400/60 uppercase tracking-wide">
                    admin
                  </span>
                )}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* ── Toggle collapse ── */}
      <div className="border-t border-sidebar-accent p-2">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-lg p-2 text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
          aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4" />
            : <ChevronLeft  className="w-4 h-4" />
          }
        </button>
      </div>
    </aside>
  )
}
