import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  ListTree,
  Receipt,
  ShoppingCart,
  FileBarChart,
  Building2,
  Landmark,
  ChevronsUpDown,
  Check,
  Settings2,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAppStore } from '@/store/AppStore'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/plan-de-cuentas', label: 'Plan de Cuentas', icon: ListTree },
  { to: '/libro-diario', label: 'Libro Diario', icon: BookOpen },
  { to: '/ventas', label: 'Ventas', icon: Receipt },
  { to: '/compras', label: 'Compras', icon: ShoppingCart },
  { to: '/reportes', label: 'Reportes', icon: FileBarChart },
]

export function Sidebar() {
  const { empresa, empresas, cambiarEmpresaActiva } = useAppStore()
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <aside className="relative flex h-full w-64 shrink-0 flex-col overflow-visible bg-slate-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-brand-600/25 to-transparent" />

      <div className="relative flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-soft-md ring-1 ring-white/10">
          <Landmark size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-white">Contab</p>
          <p className="text-[11px] leading-tight text-slate-400">Contabilidad Chile</p>
        </div>
      </div>

      <nav className="relative flex-1 space-y-0.5 px-3">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-brand-500 text-white shadow-soft-sm' : 'text-slate-400 hover:bg-white/5 hover:text-white',
              )
            }
          >
            <item.icon size={17} strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div ref={switcherRef} className="relative border-t border-white/15 p-3">
        {switcherOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-soft-xl">
            <div className="max-h-56 overflow-y-auto scrollbar-thin py-1.5">
              {empresas.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    cambiarEmpresaActiva(e.id)
                    setSwitcherOpen(false)
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Building2 size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-800">{e.nombreFantasia}</p>
                    <p className="truncate text-[11px] text-slate-400">{e.rut}</p>
                  </div>
                  {e.id === empresa.id && <Check size={14} className="shrink-0 text-brand-600" />}
                </button>
              ))}
            </div>
            <NavLink
              to="/empresa"
              onClick={() => setSwitcherOpen(false)}
              className="flex items-center gap-2 border-t border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            >
              <Settings2 size={13} /> Gestionar empresas
            </NavLink>
          </div>
        )}

        <button
          onClick={() => setSwitcherOpen((o) => !o)}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors',
            switcherOpen ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10',
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/20 text-brand-300">
            <Building2 size={15} />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-xs font-semibold text-white">{empresa.nombreFantasia}</p>
            <p className="truncate text-[11px] text-slate-400">{empresa.rut}</p>
          </div>
          <ChevronsUpDown size={14} className="shrink-0 text-slate-400" />
        </button>
      </div>
    </aside>
  )
}
