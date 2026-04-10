import { useState } from 'react'
import { LayoutDashboard, Plus, Settings2, RefreshCw, ChevronDown, Pencil } from 'lucide-react'
import { StatCards } from '../widgets/StatCards'
import { PulseWidget } from '../widgets/PulseWidget'
import { CalendarWidget } from '../widgets/CalendarWidget'
import { QuestWidget } from '../widgets/QuestWidget'
import { SkillTreeWidget } from '../widgets/SkillTreeWidget'
import { WalletWidget } from '../widgets/WalletWidget'
import { LogWidget } from '../widgets/LogWidget'
import { MarketplaceWidget } from '../widgets/MarketplaceWidget'
import { AvatarWidget } from '../widgets/AvatarWidget'
import { FeedWidget } from '../widgets/FeedWidget'
import { VIEWS } from '../data/demo'
import { cn } from '../lib/cn'

const WIDGET_MAP: Record<string, React.ComponentType> = {
  pulse: PulseWidget,
  calendar: CalendarWidget,
  quest: QuestWidget,
  'skill-tree': SkillTreeWidget,
  avatar: AvatarWidget,
  log: LogWidget,
  wallet: WalletWidget,
  marketplace: MarketplaceWidget,
  feed: FeedWidget,
}

// Layout configuration per view (which widgets get more space)
const LAYOUT_CONFIG: Record<string, Record<string, string>> = {
  'mein-tag': {
    pulse:    'lg:col-span-1 lg:row-span-1',
    calendar: 'lg:col-span-2 lg:row-span-1',
    quest:    'lg:col-span-1',
    wallet:   'lg:col-span-1',
    log:      'lg:col-span-1',
  },
  'gaming': {
    avatar:      'lg:col-span-1',
    'skill-tree':'lg:col-span-2',
    quest:       'lg:col-span-2',
    log:         'lg:col-span-1',
  },
  'marktplatz': {
    marketplace: 'lg:col-span-2',
    wallet:      'lg:col-span-1',
    pulse:       'lg:col-span-1',
    log:         'lg:col-span-2',
  },
  'community': {
    feed:     'lg:col-span-2 lg:row-span-2',
    pulse:    'lg:col-span-1',
    spaces:   'lg:col-span-1',
    calendar: 'lg:col-span-3',
  },
}

export function Dashboard() {
  const [activeView, setActiveView] = useState('mein-tag')
  const [editMode, setEditMode] = useState(false)

  const view = VIEWS.find(v => v.id === activeView)!
  const layout = LAYOUT_CONFIG[activeView] || {}

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      {/* Page Header */}
      <header className="px-6 lg:px-8 py-5 border-b shrink-0 bg-card" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                Dashboard
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Dein persönliches Cockpit · {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="hidden md:flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border hover:bg-accent transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Aktualisieren
              </button>
              <button
                className="hidden md:flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border hover:bg-accent transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              >
                Letzte 7 Tage
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setEditMode(!editMode)}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium transition-colors"
                style={
                  editMode
                    ? { background: 'var(--primary)', color: 'var(--primary-foreground)' }
                    : { background: 'var(--accent)', color: 'var(--accent-foreground)' }
                }
              >
                <Pencil className="w-3.5 h-3.5" />
                {editMode ? 'Fertig' : 'Layout bearbeiten'}
              </button>
              <button
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity"
                style={{ background: 'var(--primary)' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Widget hinzufügen
              </button>
            </div>
          </div>

          {/* View tabs */}
          <div className="flex items-center gap-1 -mb-1">
            <div className="flex items-center gap-0.5 p-1 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
              {VIEWS.map(v => (
                <button
                  key={v.id}
                  onClick={() => setActiveView(v.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  )}
                  style={
                    activeView === v.id
                      ? { background: 'var(--card)', color: 'var(--foreground)', boxShadow: 'var(--shadow-sm)' }
                      : { color: 'var(--muted-foreground)' }
                  }
                >
                  {v.label}
                </button>
              ))}
              <button
                className="px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-card"
                style={{ color: 'var(--muted-foreground)' }}
                title="Neue Ansicht erstellen"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="flex-1 px-6 lg:px-8 py-6">
        <div className="max-w-screen-2xl mx-auto space-y-6">
          {/* Stat Cards - always visible */}
          <StatCards />

          {/* Widget Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
            {view.widgets.map(widgetId => {
              const Widget = WIDGET_MAP[widgetId]
              if (!Widget) return null
              const colSpan = layout[widgetId] || ''
              return (
                <div key={widgetId} className={cn(colSpan)}>
                  <Widget />
                </div>
              )
            })}
          </div>

          {/* Add widget call-to-action */}
          <button
            className="w-full py-6 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-colors hover:bg-accent/30"
            style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Widget zu dieser Ansicht hinzufügen</span>
          </button>
        </div>
      </main>
    </div>
  )
}
