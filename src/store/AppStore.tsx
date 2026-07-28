import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AsientoContable, Cuenta, Documento, Empresa, LineaAsiento } from '@/types'
import { api } from '@/lib/api'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

const EMPRESA_ACTIVA_KEY = 'contab2:empresaActivaId'

interface DatosEmpresa {
  cuentas: Cuenta[]
  documentos: Documento[]
  asientos: AsientoContable[]
}

const datosVacios: DatosEmpresa = { cuentas: [], documentos: [], asientos: [] }

interface AppStoreValue {
  empresa: Empresa
  empresas: Empresa[]
  cuentas: Cuenta[]
  documentos: Documento[]
  asientos: AsientoContable[]
  addCuenta: (cuenta: Omit<Cuenta, 'id'>) => void
  updateCuenta: (id: string, patch: Partial<Cuenta>) => void
  deleteCuenta: (id: string) => void
  addAsientoManual: (fecha: string, glosa: string, lineas: Omit<LineaAsiento, 'id'>[]) => void
  updateAsiento: (id: string, fecha: string, glosa: string, lineas: Omit<LineaAsiento, 'id'>[]) => void
  addDocumento: (doc: Omit<Documento, 'id' | 'neto' | 'iva' | 'total' | 'montoExento'>) => void
  updateDocumento: (id: string, patch: Omit<Documento, 'id' | 'neto' | 'iva' | 'total' | 'montoExento'>) => void
  updateDocumentoEstado: (id: string, estado: Documento['estado']) => void
  updateEmpresa: (id: string, patch: Partial<Empresa>) => void
  addEmpresa: (datos: Omit<Empresa, 'id'>) => void
  cambiarEmpresaActiva: (id: string) => void
  eliminarEmpresa: (id: string) => void
}

const AppStoreContext = createContext<AppStoreValue | null>(null)

function logError(err: unknown) {
  console.error('[contab2] Error de sincronización con el servidor:', err)
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empresaActivaId, setEmpresaActivaId] = useState('')
  const [datos, setDatos] = useState<DatosEmpresa>(datosVacios)

  const cargarDatosDe = useCallback(async (empresaId: string) => {
    const data = await api.get<DatosEmpresa>(`/empresas/${empresaId}/data`)
    setDatos(data)
  }, [])

  useEffect(() => {
    let cancelado = false
    async function iniciar() {
      const lista = await api.get<Empresa[]>('/empresas')
      if (cancelado) return
      setEmpresas(lista)
      const guardada = localStorage.getItem(EMPRESA_ACTIVA_KEY)
      const activaId = lista.some((e) => e.id === guardada) ? (guardada as string) : lista[0]?.id
      if (activaId) {
        setEmpresaActivaId(activaId)
        const data = await api.get<DatosEmpresa>(`/empresas/${activaId}/data`)
        if (cancelado) return
        setDatos(data)
      }
      setReady(true)
    }
    iniciar().catch((err) => {
      logError(err)
      setReady(true)
    })
    return () => {
      cancelado = true
    }
  }, [])

  const cambiarEmpresaActiva = useCallback(
    (id: string) => {
      setEmpresaActivaId(id)
      localStorage.setItem(EMPRESA_ACTIVA_KEY, id)
      cargarDatosDe(id).catch(logError)
    },
    [cargarDatosDe],
  )

  const addCuenta = useCallback(
    (cuenta: Omit<Cuenta, 'id'>) => {
      api
        .post(`/empresas/${empresaActivaId}/cuentas`, cuenta)
        .then(() => cargarDatosDe(empresaActivaId))
        .catch(logError)
    },
    [empresaActivaId, cargarDatosDe],
  )

  const updateCuenta = useCallback(
    (id: string, patch: Partial<Cuenta>) => {
      api
        .patch(`/cuentas/${id}`, patch)
        .then(() => cargarDatosDe(empresaActivaId))
        .catch(logError)
    },
    [empresaActivaId, cargarDatosDe],
  )

  const deleteCuenta = useCallback(
    (id: string) => {
      api
        .delete(`/cuentas/${id}`)
        .then(() => cargarDatosDe(empresaActivaId))
        .catch(logError)
    },
    [empresaActivaId, cargarDatosDe],
  )

  const addAsientoManual = useCallback(
    (fecha: string, glosa: string, lineas: Omit<LineaAsiento, 'id'>[]) => {
      api
        .post(`/empresas/${empresaActivaId}/asientos`, { fecha, glosa, lineas })
        .then(() => cargarDatosDe(empresaActivaId))
        .catch(logError)
    },
    [empresaActivaId, cargarDatosDe],
  )

  const updateAsiento = useCallback(
    (id: string, fecha: string, glosa: string, lineas: Omit<LineaAsiento, 'id'>[]) => {
      api
        .patch(`/asientos/${id}`, { fecha, glosa, lineas })
        .then(() => cargarDatosDe(empresaActivaId))
        .catch(logError)
    },
    [empresaActivaId, cargarDatosDe],
  )

  const addDocumento = useCallback(
    (doc: Omit<Documento, 'id' | 'neto' | 'iva' | 'total' | 'montoExento'>) => {
      api
        .post(`/empresas/${empresaActivaId}/documentos`, doc)
        .then(() => cargarDatosDe(empresaActivaId))
        .catch(logError)
    },
    [empresaActivaId, cargarDatosDe],
  )

  const updateDocumento = useCallback(
    (id: string, patch: Omit<Documento, 'id' | 'neto' | 'iva' | 'total' | 'montoExento'>) => {
      api
        .patch(`/documentos/${id}`, patch)
        .then(() => cargarDatosDe(empresaActivaId))
        .catch(logError)
    },
    [empresaActivaId, cargarDatosDe],
  )

  const updateDocumentoEstado = useCallback(
    (id: string, estado: Documento['estado']) => {
      api
        .patch(`/documentos/${id}/estado`, { estado })
        .then(() => cargarDatosDe(empresaActivaId))
        .catch(logError)
    },
    [empresaActivaId, cargarDatosDe],
  )

  const updateEmpresa = useCallback((id: string, patch: Partial<Empresa>) => {
    api
      .patch<Empresa>(`/empresas/${id}`, patch)
      .then((actualizada) => setEmpresas((prev) => prev.map((e) => (e.id === id ? actualizada : e))))
      .catch(logError)
  }, [])

  const addEmpresa = useCallback(
    (datosNuevos: Omit<Empresa, 'id'>) => {
      api
        .post<Empresa>('/empresas', datosNuevos)
        .then((nueva) => {
          setEmpresas((prev) => [...prev, nueva])
          cambiarEmpresaActiva(nueva.id)
        })
        .catch(logError)
    },
    [cambiarEmpresaActiva],
  )

  const eliminarEmpresa = useCallback(
    (id: string) => {
      api
        .delete(`/empresas/${id}`)
        .then(() => {
          const restantes = empresas.filter((e) => e.id !== id)
          setEmpresas(restantes)
          if (id === empresaActivaId && restantes[0]) {
            cambiarEmpresaActiva(restantes[0].id)
          }
        })
        .catch(logError)
    },
    [empresas, empresaActivaId, cambiarEmpresaActiva],
  )

  const empresaActiva = useMemo(() => empresas.find((e) => e.id === empresaActivaId) ?? empresas[0], [empresas, empresaActivaId])

  const value = useMemo<AppStoreValue | null>(() => {
    if (!empresaActiva) return null
    return {
      empresa: empresaActiva,
      empresas,
      cuentas: datos.cuentas,
      documentos: datos.documentos,
      asientos: datos.asientos,
      addCuenta,
      updateCuenta,
      deleteCuenta,
      addAsientoManual,
      updateAsiento,
      addDocumento,
      updateDocumento,
      updateDocumentoEstado,
      updateEmpresa,
      addEmpresa,
      cambiarEmpresaActiva,
      eliminarEmpresa,
    }
  }, [
    empresaActiva,
    empresas,
    datos,
    addCuenta,
    updateCuenta,
    deleteCuenta,
    addAsientoManual,
    updateAsiento,
    addDocumento,
    updateDocumento,
    updateDocumentoEstado,
    updateEmpresa,
    addEmpresa,
    cambiarEmpresaActiva,
    eliminarEmpresa,
  ])

  if (!ready || !value) {
    return <LoadingScreen />
  }

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error('useAppStore debe usarse dentro de <AppStoreProvider>')
  return ctx
}
