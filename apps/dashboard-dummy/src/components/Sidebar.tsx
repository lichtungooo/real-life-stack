import { useState } from 'react'
import {
  LayoutDashboard, Calendar, ShoppingBag, TreePine, ScrollText,
  Wallet, Rss, MapPin, Users, Sparkles, Settings, ChevronDown,
  ChevronRight, FolderTree, Heart
} from 'lucide-react'
import { SPACES } from '../data/demo'
import { cn } from '../lib/cn'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const NAV_SECTIONS = [
  {
    label: 'Persönlich',
    items: [
      { id: 'dashboard',    label: 'Dashboard',         icon: LayoutDashboard, active: true },
      { id: 'profile',      label: 'Mein Profil',       icon: Heart },
      { id: 'calendar',     label: 'Kalender',          icon: Calendar },
      { id: 'log',          label: 'Mein Log',          icon: ScrollText },
      { id: 'wallet',       label: 'Wertschöpfung',     icon: Wallet },
    ],
  },
  {
    label: 'Aktivität',
    items: [
      { id: 'quests',       label: 'Quests',            icon: Sparkles },
      { id: 'marketplace',  label: 'Marktplatz',        icon: ShoppingBag },
      { id: 'skills',       label: 'Fähigkeitenbaum',   icon: TreePine },
      { id: 'feed',         label: 'Feed',              icon: Rss },
      { id: 'map',          label: 'Karte',             icon: MapPin },
    ],
  },
  {
    label: 'Netzwerk',
    items: [
      { id: 'contacts',     label: 'Kontakte',          icon: Users },
    ],
  },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  const [expandedSpace, setExpandedSpace] = useState<string | null>('adventure')

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed md:sticky top-0 left-0 z-40 h-dvh md:h-[calc(100dvh-3.5rem)] md:top-14',
          'w-64 shrink-0 border-r bg-sidebar transition-transform',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          'flex flex-col overflow-hidden'
        )}
        style={{
          borderColor: 'var(--sidebar-border)',
          background: 'var(--sidebar)',
        }}
      >
        {/* Header (mobile only - desktop has navbar) */}
        <div className="md:hidden h-14 border-b flex items-center px-4 shrink-0" style={{ borderColor: 'var(--sidebar-border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground" style={{ color: 'var(--sidebar-foreground)' }}>Real Life Stack</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Navigation */}
          {NAV_SECTIONS.map(section => (
            <div key={section.label} className="px-3 mb-6">
              <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                {section.label}
              </p>
              <nav className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors',
                        item.active
                          ? ''
                          : 'hover:bg-accent'
                      )}
                      style={item.active ? {
                        background: 'var(--sidebar-accent)',
                        color: 'var(--sidebar-accent-foreground)',
                      } : {
                        color: 'var(--sidebar-foreground)',
                      }}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          ))}

          {/* Spaces */}
          <div className="px-3 mb-6">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                Meine Spaces
              </p>
              <button className="p-1 rounded hover:bg-accent transition-colors" title="Space hinzufügen">
                <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
              </button>
            </div>
            <div className="space-y-0.5">
              {SPACES.map(space => (
                <div key={space.id}>
                  <button
                    onClick={() => setExpandedSpace(expandedSpace === space.id ? null : space.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors text-left"
                    style={{ color: 'var(--sidebar-foreground)' }}
                  >
                    {space.children.length > 0 ? (
                      <ChevronDown className={cn('w-3 h-3 shrink-0 transition-transform', expandedSpace === space.id ? '' : '-rotate-90')} style={{ color: 'var(--muted-foreground)' }} />
                    ) : (
                      <div className="w-3 shrink-0" />
                    )}
                    <span className="text-base">{space.icon}</span>
                    <span className="truncate">{space.name}</span>
                  </button>
                  {expandedSpace === space.id && space.children.length > 0 && (
                    <div className="ml-6 mt-0.5 space-y-0.5">
                      {space.children.map(child => (
                        <button
                          key={child.id}
                          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm hover:bg-accent transition-colors text-left"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          <FolderTree className="w-3 h-3 shrink-0" />
                          <span className="truncate">{child.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-3 shrink-0" style={{ borderColor: 'var(--sidebar-border)' }}>
          <button
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
            style={{ color: 'var(--sidebar-foreground)' }}
          >
            <Settings className="w-4 h-4" />
            <span>Einstellungen</span>
          </button>
        </div>
      </aside>
    </>
  )
}
