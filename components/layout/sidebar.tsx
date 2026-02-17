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
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/estudiantes", label: "Estudiantes", icon: Users },
  { href: "/dashboard/profesores", label: "Profesores", icon: GraduationCap },
  { href: "/dashboard/cursos", label: "Cursos", icon: BookOpen },
  { href: "/dashboard/matriculas", label: "Matriculas", icon: ClipboardList },
  { href: "/dashboard/usuarios", label: "Usuarios", icon: UserCog },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={`flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-accent">
        {!collapsed && (
          <Link
            href="/dashboard"
            className="flex items-center gap-2"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-sidebar-accent-foreground">
              SIGAP
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary mx-auto">
            <GraduationCap className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2" role="navigation" aria-label="Menu principal">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              } ${collapsed ? "justify-center px-0" : ""}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Toggle */}
      <div className="border-t border-sidebar-accent p-2">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-lg p-2 text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
          aria-label={collapsed ? "Expandir menu" : "Contraer menu"}
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
