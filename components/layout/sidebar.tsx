"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ContactRound,
  Building2,
  CalendarRange,
  FileText,
  Clock,
  FolderArchive,
  IdCard,
  Settings2,
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
]

// Ítems que van dentro del acordeón "Administración" (solo admin, uso ocasional)
const ADMIN_ACCORDION_ITEMS: NavItem[] = [
  { href: "/dashboard/configuracion/jornadas",       label: "Jornadas",         icon: Clock,        roles: ["admin"] },
  { href: "/dashboard/configuracion/tipos-archivo",  label: "Tipos de Archivo", icon: FolderArchive, roles: ["admin"] },
  { href: "/dashboard/configuracion/tipos-documento", label: "Tipos Documento", icon: IdCard,        roles: ["admin"] },
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
  const [adminOpen, setAdminOpen] = useState(false)

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname === href || pathname.startsWith(href + "/")
  }

  const isAdmin = hasRole("admin")

  // Si algún ítem del acordeón está activo, ábrelo automáticamente
  const adminAccordionActive = ADMIN_ACCORDION_ITEMS.some(i => isActive(i.href))

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
          const active      = isActive(item.href)
          const Icon        = item.icon
          const itemIsAdmin = item.roles?.includes("admin")

          return (
            <div key={item.href}>
              {/* Separador de grupo */}
              {item.groupLabel && (
                <div className={`mt-3 mb-1 ${collapsed ? "mx-auto w-8" : "px-3"}`}>
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
                    itemIsAdmin && !active ? "text-red-400/70" : ""
                  }`}
                />
                {!collapsed && (
                  <span className="flex-1">{item.label}</span>
                )}
                {!collapsed && itemIsAdmin && (
                  <span className="text-[10px] font-semibold text-red-400/60 uppercase tracking-wide">
                    admin
                  </span>
                )}
              </Link>
            </div>
          )
        })}

        {/* ── Acordeón "Administración" — solo admin ── */}
        {isAdmin && (
          <div className="mt-1">
            <button
              onClick={() => setAdminOpen(o => !o)}
              title={collapsed ? "Administración" : undefined}
              className={`w-full flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors
                ${collapsed ? "justify-center px-0" : "px-3"}
                ${adminAccordionActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                }`}
            >
              <Settings2 className={`w-5 h-5 shrink-0 text-red-400/70`} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Administración</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      adminOpen || adminAccordionActive ? "rotate-180" : ""
                    }`}
                  />
                </>
              )}
            </button>

            {/* Ítems del acordeón */}
            {(adminOpen || adminAccordionActive) && !collapsed && (
              <div className="mt-0.5 flex flex-col gap-0.5 pl-3 border-l border-sidebar-accent ml-4">
                {ADMIN_ACCORDION_ITEMS.map((item) => {
                  const active = isActive(item.href)
                  const Icon   = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg py-2 px-3 text-sm font-medium transition-colors
                        ${active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* En modo colapsado: tooltip-like con los ítems al hacer hover (solo icono) */}
            {collapsed && (adminOpen || adminAccordionActive) && (
              <div className="flex flex-col gap-0.5 mt-0.5">
                {ADMIN_ACCORDION_ITEMS.map((item) => {
                  const active = isActive(item.href)
                  const Icon   = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      className={`flex justify-center rounded-lg py-2 text-sm transition-colors
                        ${active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
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
