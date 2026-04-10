import { useState } from 'react'
import { ScrollText, Filter } from 'lucide-react'
import { Card } from '../components/Card'
import { LOG_ENTRIES } from '../data/demo'
import { cn } from '../lib/cn'

const LOG_STYLES: Record<string, { bg: string; text: string }> = {
  quest: { bg: 'oklch(0.95 0.05 80)',  text: 'oklch(0.45 0.15 65)' },
  offer: { bg: 'oklch(0.95 0.05 145)', text: 'oklch(0.40 0.15 145)' },
  markt: { bg: 'oklch(0.95 0.05 30)',  text: 'oklch(0.45 0.18 30)' },
  trust: { bg: 'oklch(0.95 0.04 280)', text: 'oklch(0.45 0.18 280)' },
}

const FILTERS = [
  { id: 'alle',  label: 'Alle' },
  { id: 'quest', label: 'Quests' },
  { id: 'offer', label: 'Angebote' },
  { id: 'markt', label: 'Markt' },
  { id: 'trust', label: 'Vertrauen' },
]

export function LogWidget() {
  const [filter, setFilter] = useState('alle')
  const filtered = filter === 'alle' ? LOG_ENTRIES : LOG_ENTRIES.filter(e => e.type === filter)

  return (
    <Card title="Aktivitäts-Log" icon={ScrollText} iconColor="oklch(0.55 0.21 264)" noPadding>
      {/* Filter pills */}
      <div className="px-5 py-3 border-b flex items-center gap-2 overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        <Filter className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--muted-foreground)' }} />
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap',
            )}
            style={
              filter === f.id
                ? { background: 'var(--primary)', color: 'var(--primary-foreground)' }
                : { background: 'var(--muted)', color: 'var(--muted-foreground)' }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="divide-y max-h-80 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
        {filtered.map(entry => {
          const style = LOG_STYLES[entry.type]
          return (
            <div
              key={entry.id}
              className="flex items-start gap-3 px-5 py-3 hover:bg-accent/30 transition-colors"
              style={{ borderColor: 'var(--border)' }}
            >
              <span
                className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide shrink-0 mt-0.5"
                style={{ background: style.bg, color: style.text }}
              >
                {entry.label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug" style={{ color: 'var(--foreground)' }}>{entry.text}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{entry.time}</span>
                  {entry.xp && <span className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>+{entry.xp} XP</span>}
                  {entry.tokens && <span className="text-xs font-semibold" style={{ color: 'oklch(0.65 0.18 145)' }}>+{entry.tokens} Token</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
