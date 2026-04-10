import { useState } from 'react'
import { Menu, Search, Bell, MessageCircle, ChevronDown, Sparkles, Check } from 'lucide-react'
import { NOTIFICATIONS, PLAYER } from '../data/demo'
import { cn } from '../lib/cn'

interface NavbarProps {
  onToggleSidebar: () => void
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const unreadCount = NOTIFICATIONS.filter(n => !n.read).length

  return (
    <nav
      className="glass-navbar sticky top-0 z-50 h-14 border-b flex items-center px-4 gap-4"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Left: Burger + Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-md hover:bg-accent transition-colors md:hidden"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
            <Sparkles className="w-4 h-4" style={{ color: 'var(--primary-foreground)' }} />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-semibold text-sm">Real Life Stack</span>
            <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>Dashboard</span>
          </div>
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-xl mx-auto hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            placeholder="Quests, Spaces, Menschen suchen..."
            className="w-full h-9 pl-10 pr-4 rounded-lg text-sm border bg-muted/50 transition-colors focus:outline-none focus:ring-2"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--muted)',
            }}
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 ml-auto">
        {/* Messages */}
        <button className="relative p-2 rounded-md hover:bg-accent transition-colors">
          <MessageCircle className="w-5 h-5" style={{ color: 'var(--muted-foreground)' }} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: 'var(--secondary)' }} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}
            className="relative p-2 rounded-md hover:bg-accent transition-colors"
          >
            <Bell className="w-5 h-5" style={{ color: 'var(--muted-foreground)' }} />
            {unreadCount > 0 && (
              <span
                className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                style={{ background: 'var(--destructive)' }}
              >
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-80 rounded-xl border shadow-lg overflow-hidden bg-popover"
              style={{ borderColor: 'var(--border)', background: 'var(--popover)' }}
            >
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm font-semibold">Benachrichtigungen</p>
                <button className="text-xs hover:underline" style={{ color: 'var(--primary)' }}>
                  Alle lesen
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {NOTIFICATIONS.map(notif => (
                  <button
                    key={notif.id}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 hover:bg-accent transition-colors text-left border-b last:border-b-0',
                    )}
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--primary)' }} />
                    )}
                    {notif.read && <div className="w-2 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{notif.text}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{notif.time}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 mx-1" style={{ background: 'var(--border)' }} />

        {/* Profile */}
        <button
          onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}
          className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-accent transition-colors"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'var(--primary)' }}>
            T
          </div>
          <div className="hidden md:flex flex-col items-start leading-none">
            <span className="text-sm font-semibold">{PLAYER.name}</span>
            <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>Level {PLAYER.level} · {PLAYER.levelLabel}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 hidden md:block" style={{ color: 'var(--muted-foreground)' }} />
        </button>
      </div>
    </nav>
  )
}
