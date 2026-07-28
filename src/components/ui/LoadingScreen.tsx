export function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-100 to-brand-50/40">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
    </div>
  )
}
