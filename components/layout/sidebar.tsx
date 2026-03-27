"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  UserCog,
  ChevronLeft,
  ChevronRight,
  ContactRound,
} from "lucide-react"

// ── Ítems de navegación ───────────────────────────────────────────────────────
/**
 * Para agregar una nueva sección basta con añadir un objeto aquí.
 * El resto (estilos, collapse, active state) se genera automáticamente.
 */
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/estudiantes", label: "Estudiantes", icon: GraduationCap },
  { href: "/dashboard/acudientes", label: "Acudientes", icon: ContactRound },
  { href: "/dashboard/profesores", label: "Profesores", icon: Users },
  { href: "/dashboard/cursos", label: "Cursos", icon: BookOpen },
  { href: "/dashboard/matriculas", label: "Matrículas", icon: ClipboardList },
  { href: "/dashboard/usuarios", label: "Usuarios", icon: UserCog },
] as const

// ── Props ─────────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

// ── Componente ────────────────────────────────────────────────────────────────

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    // El dashboard raíz solo es activo en la ruta exacta
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <aside
      className={`flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ${collapsed ? "w-16" : "w-64"
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
              {/*<GraduationCap className="w-4 h-4 text-primary-foreground" />*/}
  
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
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors
                ${collapsed ? "justify-center px-0" : "px-3"}
                ${active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
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
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  )
}