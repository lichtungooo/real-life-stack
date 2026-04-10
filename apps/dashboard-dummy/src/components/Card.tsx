import { ReactNode } from 'react'
import { MoreHorizontal, Maximize2, Share2 } from 'lucide-react'
import { cn } from '../lib/cn'

interface CardProps {
  title: string
  icon?: any
  iconColor?: string
  children: ReactNode
  action?: ReactNode
  className?: string
  noPadding?: boolean
}

export function Card({ title, icon: Icon, iconColor, children, action, className, noPadding }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card flex flex-col overflow-hidden transition-shadow hover:shadow-md',
        className
      )}
      style={{
        borderColor: 'var(--border)',
        background: 'var(--card)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: iconColor ? `${iconColor}15` : 'var(--accent)' }}
            >
              <Icon className="w-4 h-4" style={{ color: iconColor || 'var(--accent-foreground)' }} />
            </div>
          )}
          <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{title}</h3>
        </div>
        <div className="flex items-center gap-0.5">
          {action}
          <button className="p-1.5 rounded hover:bg-accent transition-colors" title="Im Profil teilen">
            <Share2 className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
          </button>
          <button className="p-1.5 rounded hover:bg-accent transition-colors" title="Vergrößern">
            <Maximize2 className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
          </button>
          <button className="p-1.5 rounded hover:bg-accent transition-colors" title="Mehr">
            <MoreHorizontal className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>
      </div>
      {/* Content */}
      <div className={cn('flex-1 overflow-hidden', !noPadding && 'p-5')}>
        {children}
      </div>
    </div>
  )
}
