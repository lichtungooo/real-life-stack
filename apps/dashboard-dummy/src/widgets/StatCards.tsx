import { TrendingUp, TrendingDown, Wallet, Trophy, Flame, Target } from 'lucide-react'
import { PLAYER } from '../data/demo'

const STATS = [
  {
    id: 'level',
    label: 'Level',
    value: PLAYER.level,
    sub: PLAYER.levelLabel,
    icon: Trophy,
    color: 'oklch(0.63 0.16 55)',
    trend: { dir: 'up', value: '+1 diese Woche' },
  },
  {
    id: 'xp',
    label: 'Erfahrung',
    value: PLAYER.currentXP.toLocaleString('de-DE'),
    sub: `${PLAYER.xpForNextLevel - PLAYER.currentXP} bis Lv.${PLAYER.level + 1}`,
    icon: Target,
    color: 'oklch(0.55 0.21 264)',
    trend: { dir: 'up', value: '+340 diese Woche' },
  },
  {
    id: 'wallet',
    label: 'Wertschöpfung',
    value: PLAYER.walletBalance.toLocaleString('de-DE'),
    sub: `${PLAYER.walletCurrency}`,
    icon: Wallet,
    color: 'oklch(0.65 0.18 145)',
    trend: { dir: 'up', value: '+168 diese Woche' },
  },
  {
    id: 'streak',
    label: 'Streak',
    value: PLAYER.streak,
    sub: 'Tage in Folge',
    icon: Flame,
    color: 'oklch(0.65 0.20 0)',
    trend: { dir: 'up', value: 'Persönlicher Rekord!' },
  },
]

export function StatCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS.map(stat => {
        const Icon = stat.icon
        const TrendIcon = stat.trend.dir === 'up' ? TrendingUp : TrendingDown
        return (
          <div
            key={stat.id}
            className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--card)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: `${stat.color}15` }}
              >
                <Icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div className="flex items-center gap-1 text-xs" style={{ color: stat.color }}>
                <TrendIcon className="w-3 h-3" />
              </div>
            </div>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>{stat.label}</p>
            <p className="text-2xl font-bold leading-none mb-1" style={{ color: 'var(--foreground)' }}>{stat.value}</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{stat.sub}</p>
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs" style={{ color: stat.color }}>{stat.trend.value}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
