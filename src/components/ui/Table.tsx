import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Table({ children, className, ...props }: HTMLAttributes<HTMLTableElement> & { children: ReactNode }) {
  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl">
      <table className={cn('w-full border-collapse text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  )
}

export function Thead({ children }: { children: ReactNode }) {
  return <thead className="border-b border-slate-200">{children}</thead>
}

interface StickyProp {
  /** Pins this cell to the right edge of the scroll container — use on a trailing Acciones column. */
  sticky?: boolean
}

const stickyClasses = 'sticky right-0 z-10 bg-white shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.08)] group-hover:bg-slate-100'

export function Th({
  children,
  className,
  sticky,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & StickyProp & { children?: ReactNode }) {
  return (
    <th
      className={cn(
        'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400',
        sticky && stickyClasses,
        className,
      )}
      {...props}
    >
      {children}
    </th>
  )
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-200">{children}</tbody>
}

export function Tr({ children, className, ...props }: HTMLAttributes<HTMLTableRowElement> & { children: ReactNode }) {
  return (
    <tr className={cn('group transition-colors hover:bg-slate-100', className)} {...props}>
      {children}
    </tr>
  )
}

export function Td({
  children,
  className,
  sticky,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & StickyProp & { children?: ReactNode }) {
  return (
    <td className={cn('whitespace-nowrap px-4 py-3 text-slate-700', sticky && stickyClasses, className)} {...props}>
      {children}
    </td>
  )
}
