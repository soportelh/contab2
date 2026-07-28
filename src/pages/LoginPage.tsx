import { useState } from 'react'
import { Landmark, Lock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field, Label, Input } from '@/components/ui/Input'

interface LoginPageProps {
  onLogin: (username: string, password: string) => void
  error: string
  loading: boolean
}

export function LoginPage({ onLogin, error, loading }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password) return
    onLogin(username.trim(), password)
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-100 to-brand-50/40 px-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft-md">
            <Landmark size={20} />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Contab</h1>
          <p className="mt-0.5 text-sm text-slate-500">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <Label>Usuario</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              placeholder="admin"
              required
            />
          </Field>
          <Field>
            <Label>Contraseña</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </Field>

          {error && <p className="text-xs font-medium text-critical">{error}</p>}

          <Button type="submit" className="w-full justify-center" disabled={loading}>
            <Lock size={15} /> {loading ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
