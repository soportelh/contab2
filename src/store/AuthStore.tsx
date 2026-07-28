import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '@/lib/api'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { LoginPage } from '@/pages/LoginPage'

interface AuthValue {
  username: string
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

type Estado = 'verificando' | 'anonimo' | 'autenticado'

export function AuthGate({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>('verificando')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const verificarSesion = useCallback(() => {
    api
      .get<{ username: string }>('/auth/me')
      .then((u) => {
        setUsername(u.username)
        setEstado('autenticado')
      })
      .catch(() => setEstado('anonimo'))
  }, [])

  useEffect(() => {
    verificarSesion()
  }, [verificarSesion])

  useEffect(() => {
    function onUnauthorized() {
      setEstado('anonimo')
      setUsername('')
    }
    window.addEventListener('contab2:unauthorized', onUnauthorized)
    return () => window.removeEventListener('contab2:unauthorized', onUnauthorized)
  }, [])

  const login = useCallback(async (user: string, password: string) => {
    setEnviando(true)
    setError('')
    try {
      const res = await api.post<{ username: string }>('/auth/login', { username: user, password })
      setUsername(res.username)
      setEstado('autenticado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setEnviando(false)
    }
  }, [])

  const logout = useCallback(() => {
    api
      .post('/auth/logout', {})
      .catch(() => {})
      .finally(() => {
        setEstado('anonimo')
        setUsername('')
      })
  }, [])

  if (estado === 'verificando') return <LoadingScreen />
  if (estado === 'anonimo') return <LoginPage onLogin={login} error={error} loading={enviando} />

  return <AuthContext.Provider value={{ username, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthGate>')
  return ctx
}
