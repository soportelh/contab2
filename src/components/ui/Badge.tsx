import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type BadgeTone = 'neutral' | 'good' | 'warning' | 'serious' | 'critical' | 'brand'

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  good: 'bg-good-bg text-good',
  warning: 'bg-warning-bg text-warning',
  serious: 'bg-serious-bg text-serious',
  critical: 'bg-critical-bg text-critical',
  brand: 'bg-brand-50 text-brand-700',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  children: ReactNode
  dot?: boolean
}

export function Badge({ tone = 'neutral', children, className, dot, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', toneClasses[tone].split(' ')[1])} style={{ backgroundColor: 'currentColor' }} />}
      {children}
    </span>
  )
}
