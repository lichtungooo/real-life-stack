import { Heart, Shield, Flame, Trophy } from 'lucide-react'
import { Card } from '../components/Card'
import { PLAYER, SKILL_BRANCHES } from '../data/demo'

export function AvatarWidget() {
  const xpProgress = ((PLAYER.currentXP - PLAYER.xpForCurrentLevel) / (PLAYER.xpForNextLevel - PLAYER.xpForCurrentLevel)) * 100
  const topSkills = [...SKILL_BRANCHES].sort((a, b) => b.level - a.level).slice(0, 3)

  return (
    <Card title="Avatar" icon={Heart} iconColor="oklch(0.55 0.21 264)">
      <div>
        {/* Avatar header */}
        <div className="flex flex-col items-center text-center pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-md"
              style={{ background: 'linear-gradient(135deg, var(--primary), oklch(0.55 0.21 264))' }}
            >
              {PLAYER.name[0]}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border-2 flex items-center justify-center" style={{ borderColor: 'var(--card)' }}>
              <Trophy className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
            </div>
          </div>
          <p className="text-base font-bold mt-3" style={{ color: 'var(--foreground)' }}>{PLAYER.name}</p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{PLAYER.location}</p>
          <div
            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ background: 'var(--primary)' }}
          >
            <Trophy className="w-3 h-3" />
            Level {PLAYER.level} · {PLAYER.levelLabel}
          </div>
        </div>

        {/* XP Bar */}
        <div className="py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Erfahrung</span>
            <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{PLAYER.currentXP} / {PLAYER.xpForNextLevel}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${xpProgress}%`,
                background: 'linear-gradient(90deg, var(--primary), oklch(0.55 0.21 264))',
              }}
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
            {PLAYER.xpForNextLevel - PLAYER.currentXP} XP bis Level {PLAYER.level + 1}
          </p>
        </div>

        {/* Top Skills */}
        <div className="py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-foreground)' }}>Top Fähigkeiten</p>
          <div className="space-y-2">
            {topSkills.map(skill => (
              <div key={skill.id} className="flex items-center gap-2">
                <span className="text-base w-6 text-center">{skill.icon}</span>
                <span className="text-xs flex-1" style={{ color: 'var(--foreground)' }}>{skill.label}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: skill.max }).map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{ background: i < skill.level ? skill.color : 'var(--border)' }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust + Streak */}
        <div className="grid grid-cols-2 gap-2 pt-4">
          <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: 'oklch(0.55 0.21 264 / 0.08)' }}>
            <Shield className="w-4 h-4 shrink-0" style={{ color: 'oklch(0.55 0.21 264)' }} />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase" style={{ color: 'oklch(0.55 0.21 264)' }}>Vertrauen</p>
              <div className="flex gap-0.5 mt-0.5">
                {[1,2,3,4,5].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: i <= PLAYER.trustLevel ? 'oklch(0.55 0.21 264)' : 'var(--border)' }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: 'oklch(0.65 0.20 0 / 0.08)' }}>
            <Flame className="w-4 h-4 shrink-0" style={{ color: 'oklch(0.65 0.20 0)' }} />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase" style={{ color: 'oklch(0.65 0.20 0)' }}>Streak</p>
              <p className="text-sm font-bold leading-none mt-0.5" style={{ color: 'var(--foreground)' }}>{PLAYER.streak} Tage</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
