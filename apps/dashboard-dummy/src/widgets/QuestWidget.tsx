import { Sparkles, MapPin, Plus } from 'lucide-react'
import { Card } from '../components/Card'
import { QUESTS } from '../data/demo'

export function QuestWidget() {
  const nearby = QUESTS.filter(q => q.distance)
  const active = QUESTS.filter(q => q.progress !== null)

  return (
    <Card title="Quests" icon={Sparkles} iconColor="oklch(0.70 0.17 55)">
      <div className="space-y-4">
        {/* Nearby */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>In der Nähe</p>
            <button className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: 'var(--primary)' }}>
              <Plus className="w-3 h-3" />
              Neu
            </button>
          </div>
          <div className="space-y-2">
            {nearby.map(quest => (
              <button
                key={quest.id}
                className="w-full flex items-center gap-3 p-3 rounded-lg border hover:shadow-sm transition-all text-left group"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'oklch(0.70 0.17 55 / 0.15)' }}>
                  <Sparkles className="w-4 h-4" style={{ color: 'oklch(0.70 0.17 55)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors" style={{ color: 'var(--foreground)' }}>{quest.title}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} />
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{quest.distance} entfernt</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-md shrink-0" style={{ background: 'oklch(0.70 0.17 55 / 0.15)', color: 'oklch(0.55 0.18 55)' }}>
                  +{quest.xp} XP
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Active */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'var(--muted-foreground)' }}>Aktive Quests</p>
          <div className="space-y-2">
            {active.map(quest => (
              <div
                key={quest.id}
                className="p-3 rounded-lg border"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold flex-1 min-w-0 truncate" style={{ color: 'var(--foreground)' }}>{quest.title}</p>
                  <span className="text-xs font-bold ml-2" style={{ color: 'oklch(0.55 0.18 55)' }}>+{quest.xp} XP</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${quest.progress}%`,
                      background: 'linear-gradient(90deg, oklch(0.70 0.17 55), oklch(0.63 0.16 55))',
                    }}
                  />
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--muted-foreground)' }}>{quest.progress}% abgeschlossen</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
