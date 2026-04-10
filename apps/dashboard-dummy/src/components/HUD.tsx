import { Wallet, TreePine, ScrollText, User, Flame } from 'lucide-react'
import { PLAYER } from '../data/demo'

export function HUD() {
  const xpProgress = ((PLAYER.currentXP - PLAYER.xpForCurrentLevel) / (PLAYER.xpForNextLevel - PLAYER.xpForCurrentLevel)) * 100

  const buttons = [
    { icon: Wallet,     label: 'Wallet',  color: 'oklch(0.65 0.18 145)' },
    { icon: TreePine,   label: 'Skills',  color: 'oklch(0.63 0.16 55)' },
    { icon: User,       label: 'Avatar',  color: 'oklch(0.55 0.21 264)' },
    { icon: ScrollText, label: 'Log',     color: 'oklch(0.65 0.20 0)' },
  ]

  return (
    <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      <div
        className="pointer-events-auto rounded-full border px-3 py-2 flex items-center gap-2"
        style={{
          background: 'var(--card)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* XP + Level */}
        <div className="flex items-center gap-2.5 pl-2">
          <div className="flex flex-col items-end leading-none">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] font-bold" style={{ color: 'var(--primary)' }}>XP</span>
              <span className="text-[10px] font-medium" style={{ color: 'var(--muted-foreground)' }}>{PLAYER.currentXP}</span>
            </div>
            <div className="h-1.5 w-20 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${xpProgress}%`,
                  background: 'linear-gradient(90deg, var(--primary), oklch(0.55 0.21 264))',
                }}
              />
            </div>
          </div>
          <div
            className="px-2 py-1 rounded-md text-[10px] font-bold text-white"
            style={{ background: 'var(--primary)' }}
          >
            Lv.{PLAYER.level}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8" style={{ background: 'var(--border)' }} />

        {/* Quick access buttons */}
        <div className="flex items-center gap-1">
          {buttons.map(btn => {
            const Icon = btn.icon
            return (
              <button
                key={btn.label}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: `${btn.color}15` }}
                title={btn.label}
              >
                <Icon className="w-4 h-4" style={{ color: btn.color }} />
              </button>
            )
          })}
        </div>

        {/* Divider */}
        <div className="w-px h-8" style={{ background: 'var(--border)' }} />

        {/* Wallet balance */}
        <div className="flex items-center gap-1.5 px-2">
          <Wallet className="w-3.5 h-3.5" style={{ color: 'oklch(0.65 0.18 145)' }} />
          <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{PLAYER.walletBalance.toLocaleString('de-DE')}</span>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-1 pr-2">
          <Flame className="w-3.5 h-3.5" style={{ color: 'oklch(0.65 0.20 0)' }} />
          <span className="text-xs font-bold" style={{ color: 'oklch(0.65 0.20 0)' }}>{PLAYER.streak}</span>
        </div>
      </div>
    </div>
  )
}
