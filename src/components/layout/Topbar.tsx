import { useEffect, useRef, useState } from 'react'
import { Bell, LogOut, Search } from 'lucide-react'
import { useAppStore } from '@/store/AppStore'
import { useAuth } from '@/store/AuthStore'

interface TopbarProps {
  title: string
  description?: string
}

export function Topbar({ title, description }: TopbarProps) {
  const { empresa } = useAppStore()
  const { username, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-300 bg-white/80 px-8 py-5 backdrop-blur-sm">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-400 md:flex">
          <Search size={15} />
          <span className="text-xs">Buscar documentos, cuentas…</span>
        </div>
        <button className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-critical" />
        </button>
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-200"
            title={username}
          >
            {empresa.nombreFantasia.slice(0, 2).toUpperCase()}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-soft-xl">
              <div className="border-b border-slate-100 px-3.5 py-2.5">
                <p className="truncate text-xs font-semibold text-slate-800">{username}</p>
                <p className="text-[11px] text-slate-400">Sesión activa</p>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  logout()
                }}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs font-medium text-critical hover:bg-critical-bg"
              >
                <LogOut size={13} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
