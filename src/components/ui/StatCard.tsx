import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card } from './Card'
import { cn } from '@/lib/cn'

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  delta?: number
  deltaLabel?: string
  invertDelta?: boolean
  accent?: 'brand' | 'good' | 'warning' | 'critical'
}

const accentClasses = {
  brand: 'bg-brand-50 text-brand-600',
  good: 'bg-good-bg text-good',
  warning: 'bg-warning-bg text-warning',
  critical: 'bg-critical-bg text-critical',
}

export function StatCard({ label, value, icon: Icon, delta, deltaLabel, invertDelta, accent = 'brand' }: StatCardProps) {
  const isPositive = delta !== undefined ? (invertDelta ? delta <= 0 : delta >= 0) : undefined

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">{value}</p>
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', accentClasses[accent])}>
          <Icon size={18} />
        </div>
      </div>
      {delta !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span className={cn('flex items-center gap-0.5 font-medium', isPositive ? 'text-good' : 'text-critical')}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(delta * 100).toFixed(1)}%
          </span>
          <span className="text-slate-400">{deltaLabel ?? 'vs. mes anterior'}</span>
        </div>
      )}
    </Card>
  )
}
