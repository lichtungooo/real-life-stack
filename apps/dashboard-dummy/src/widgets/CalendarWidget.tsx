import { useState } from 'react'
import { Calendar, Download } from 'lucide-react'
import { Card } from '../components/Card'
import { CALENDAR_EVENTS, SUBSCRIBED_CALENDARS } from '../data/demo'
import { cn } from '../lib/cn'

export function CalendarWidget() {
  const [calendars, setCalendars] = useState(SUBSCRIBED_CALENDARS)

  const toggleCalendar = (id: string) => {
    setCalendars(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c))
  }

  const today = CALENDAR_EVENTS.filter(e => e.day === 'today')
  const tomorrow = CALENDAR_EVENTS.filter(e => e.day === 'tomorrow')

  return (
    <Card title="Kalender" icon={Calendar} iconColor="oklch(0.55 0.21 264)" noPadding>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-0">
        {/* Events */}
        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Heute · 9. April</p>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}>
                {today.length} Events
              </span>
            </div>
            <div className="space-y-2">
              {today.map(event => (
                <button
                  key={event.id}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border hover:shadow-sm transition-all text-left group"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="w-1 h-12 rounded-full shrink-0" style={{ background: event.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors" style={{ color: 'var(--foreground)' }}>{event.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      {event.time} · {event.duration} · {event.space}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'var(--muted-foreground)' }}>Morgen · 10. April</p>
            <div className="space-y-2">
              {tomorrow.map(event => (
                <button
                  key={event.id}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border hover:shadow-sm transition-all text-left group opacity-80 hover:opacity-100"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="w-1 h-12 rounded-full shrink-0" style={{ background: event.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors" style={{ color: 'var(--foreground)' }}>{event.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      {event.time} · {event.duration} · {event.space}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar subscriptions */}
        <div className="border-t lg:border-t-0 lg:border-l p-5" style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>Abonniert</p>
          <div className="space-y-1 mb-4">
            {calendars.map(cal => (
              <button
                key={cal.id}
                onClick={() => toggleCalendar(cal.id)}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-background transition-colors text-left"
              >
                <div
                  className={cn('w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center transition-all', cal.active ? '' : 'opacity-30')}
                  style={{
                    background: cal.active ? cal.color : 'transparent',
                    borderColor: cal.color,
                  }}
                >
                  {cal.active && (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span className={cn('text-xs', cal.active ? '' : 'opacity-50')} style={{ color: 'var(--foreground)' }}>{cal.name}</span>
              </button>
            ))}
          </div>
          <button className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium border hover:bg-background transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
            <Download className="w-3.5 h-3.5" />
            iCal exportieren
          </button>
        </div>
      </div>
    </Card>
  )
}
