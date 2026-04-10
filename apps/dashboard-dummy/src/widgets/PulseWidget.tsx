import { Heart, Calendar, Sparkles, ShoppingBag, Wallet, Users, ArrowRight } from 'lucide-react'
import { Card } from '../components/Card'
import { PULSE_ITEMS } from '../data/demo'

const ICON_MAP: Record<string, any> = {
  Calendar, Swords: Sparkles, ShoppingBag, Wallet, Users,
}

const ACCENT_COLORS: Record<string, string> = {
  primary:   'oklch(0.63 0.16 55)',
  secondary: 'oklch(0.55 0.21 264)',
  warning:   'oklch(0.70 0.17 55)',
  pink:      'oklch(0.65 0.20 0)',
}

export function PulseWidget() {
  return (
    <Card title="Puls" icon={Heart} iconColor="oklch(0.65 0.20 0)" noPadding>
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {PULSE_ITEMS.map(item => {
          const Icon = ICON_MAP[item.icon] || Sparkles
          const color = ACCENT_COLORS[item.accent]
          return (
            <button
              key={item.id}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-accent/30 transition-colors text-left group"
              style={{ borderColor: 'var(--border)' }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${color}15` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{item.text}</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{item.space}</p>
              </div>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--muted-foreground)' }} />
            </button>
          )
        })}
      </div>
    </Card>
  )
}
