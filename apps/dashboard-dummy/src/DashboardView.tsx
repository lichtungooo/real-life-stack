/**
 * Dashboard Click-Dummy - Timos persoenliches Cockpit
 *
 * Widget-basiertes Dashboard mit:
 * - Ansichten-Tabs (Mein Tag, Gaming, Marktplatz)
 * - Konfigurierbaren Widgets (ein/aus, Groesse)
 * - HUD am unteren Rand (Level, XP, Quick-Access)
 * - Profil-Freigabe an jedem Widget
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Calendar, Swords, ShoppingBag, TreePine, User,
  ScrollText, Wallet, Rss, MapPin, FolderTree, Heart, Settings,
  ChevronDown, Share2, Eye, EyeOff, GripVertical, Plus,
  TrendingUp, TrendingDown, Trophy, Flame, Star, Shield,
  Bell, ArrowUp, ArrowDown, Filter, X, Maximize2, Minimize2,
  Sparkles
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

type ViewId = 'mein-tag' | 'gaming' | 'marktplatz'
type WidgetSize = 'small' | 'medium' | 'large'
type WidgetType =
  | 'pulse' | 'calendar' | 'quest' | 'skill-tree' | 'avatar'
  | 'log' | 'wallet' | 'marketplace' | 'feed' | 'map' | 'spaces'

interface WidgetConfig {
  type: WidgetType
  label: string
  icon: typeof LayoutDashboard
  size: WidgetSize
  visible: boolean
  color: string
}

interface DashboardViewConfig {
  id: ViewId
  label: string
  icon: typeof LayoutDashboard
  widgets: WidgetType[]
}

// ============================================================
// DEMO DATA
// ============================================================

const PLAYER_LEVEL = 7
const CURRENT_XP = 1240
const XP_TO_NEXT = 2100
const XP_PROGRESS = ((1240 - 1000) / (2100 - 1000)) * 100
const WALLET_BALANCE = 5133

const VIEWS: DashboardViewConfig[] = [
  {
    id: 'mein-tag',
    label: 'Mein Tag',
    icon: Calendar,
    widgets: ['pulse', 'calendar', 'log', 'wallet', 'feed'],
  },
  {
    id: 'gaming',
    label: 'Gaming',
    icon: Swords,
    widgets: ['avatar', 'skill-tree', 'quest', 'log'],
  },
  {
    id: 'marktplatz',
    label: 'Marktplatz',
    icon: ShoppingBag,
    widgets: ['marketplace', 'wallet', 'pulse', 'map'],
  },
]

const WIDGET_CONFIGS: Record<WidgetType, Omit<WidgetConfig, 'visible'>> = {
  pulse:        { type: 'pulse',       label: 'Puls',              icon: Heart,       size: 'medium', color: '#ef4444' },
  calendar:     { type: 'calendar',    label: 'Kalender',          icon: Calendar,    size: 'large',  color: '#3b82f6' },
  quest:        { type: 'quest',       label: 'Quests',            icon: Swords,      size: 'medium', color: '#f59e0b' },
  'skill-tree': { type: 'skill-tree',  label: 'Faehigkeitenbaum',  icon: TreePine,    size: 'large',  color: '#22c55e' },
  avatar:       { type: 'avatar',      label: 'Avatar',            icon: User,        size: 'medium', color: '#8b5cf6' },
  log:          { type: 'log',         label: 'Log',               icon: ScrollText,  size: 'medium', color: '#a855f7' },
  wallet:       { type: 'wallet',      label: 'Wertschoepfung',    icon: Wallet,      size: 'medium', color: '#f59e0b' },
  marketplace:  { type: 'marketplace', label: 'Marktplatz',        icon: ShoppingBag, size: 'medium', color: '#ec4899' },
  feed:         { type: 'feed',        label: 'Feed',              icon: Rss,         size: 'medium', color: '#6366f1' },
  map:          { type: 'map',         label: 'Karte',             icon: MapPin,      size: 'medium', color: '#14b8a6' },
  spaces:       { type: 'spaces',      label: 'Spaces',            icon: FolderTree,  size: 'small',  color: '#64748b' },
}

// Skill branches
const SKILLS = [
  { id: 'natur',        label: 'Naturverbundenheit',   icon: '\u{1F331}', color: '#48bb78', level: 3, max: 5 },
  { id: 'handwerk',     label: 'Handwerk & Koennen',   icon: '\u{1F528}', color: '#ed8936', level: 2, max: 5 },
  { id: 'wissen',       label: 'Wissen & Verstehen',   icon: '\u{1F4DA}', color: '#667eea', level: 4, max: 5 },
  { id: 'gemeinschaft', label: 'Gemeinschaft',         icon: '\u{1F91D}', color: '#9f7aea', level: 4, max: 5 },
  { id: 'kreativ',      label: 'Kreativitaet',         icon: '\u{1F3A8}', color: '#f687b3', level: 2, max: 5 },
  { id: 'achtsamkeit',  label: 'Achtsamkeit & Selbst', icon: '\u{1F9D8}', color: '#38b2ac', level: 1, max: 5 },
]

const LOG_ENTRIES = [
  { id: '1', type: 'quest',  label: 'Quest', text: 'Quest abgeschlossen: Gemeinschaftsgarten', time: 'vor 2h', xp: 120, color: '#fef3c7', textColor: '#92400e' },
  { id: '2', type: 'offer',  label: 'Angebot', text: 'Angebot eingestellt: Systemdenken-Workshop', time: 'vor 5h', xp: 30, color: '#d1fae5', textColor: '#065f46' },
  { id: '3', type: 'markt',  label: 'Markt', text: 'Tausch: Tomaten gegen Holz', time: 'gestern', tokens: 15, color: '#ffedd5', textColor: '#7c2d12' },
  { id: '4', type: 'trust',  label: 'Vertrauen', text: 'Anton hat dir vertraut', time: 'vor 3T', xp: 50, color: '#ede9fe', textColor: '#4c1d95' },
  { id: '5', type: 'quest',  label: 'Quest', text: 'Quest gestartet: Repair Cafe', time: 'vor 4T', color: '#fef3c7', textColor: '#92400e' },
]

const TRANSACTIONS = [
  { id: '1', type: 'in' as const,  text: 'Quest: Gemeinschaftsgarten', amount: 120, time: 'vor 2h' },
  { id: '2', type: 'in' as const,  text: 'Tausch: Tomaten gegen Holz', amount: 15,  time: 'gestern' },
  { id: '3', type: 'out' as const, text: 'Kauf: Saatgut-Paket',        amount: 30,  time: 'gestern' },
  { id: '4', type: 'in' as const,  text: 'Marktplatz: Kraeuterpaket',  amount: 8,   time: 'vor 1W' },
  { id: '5', type: 'out' as const, text: 'Leih: Werkzeugbox',          amount: 5,   time: 'vor 1W' },
]

const CALENDAR_EVENTS = [
  { id: '1', title: 'Wildkraeuterwanderung', time: '14:00', space: 'Gudensberg', color: '#3b82f6' },
  { id: '2', title: 'Repair Cafe', time: '18:00', space: 'Adventure DE', color: '#22c55e' },
  { id: '3', title: 'Gemeinschaftsgarten', time: '10:00', space: 'Gudensberg', color: '#f59e0b', tomorrow: true },
  { id: '4', title: 'Nachbarschaftscafe', time: '15:00', space: 'Adventure DE', color: '#ec4899', tomorrow: true },
]

const MARKETPLACE_ITEMS = [
  { id: '1', title: 'Fahrrad-Reparatur', person: 'Lena', distance: '2km', type: 'offer' as const },
  { id: '2', title: 'Bio-Tomaten', person: 'Carla', distance: '5km', type: 'offer' as const },
  { id: '3', title: 'Grafikdesign', person: 'Du', type: 'need' as const },
  { id: '4', title: 'Yoga-Kurs', person: 'Sarah', distance: '1km', type: 'offer' as const },
]

const QUESTS = [
  { id: '1', title: 'Gemeinschaftsgarten anlegen', xp: 120, distance: '2km', progress: null },
  { id: '2', title: 'Repair Cafe besuchen', xp: 80, distance: '3km', progress: null },
  { id: '3', title: 'Nachbarschaftscafe', xp: 200, progress: 60 },
  { id: '4', title: '30 Tage Meditation', xp: 500, progress: 80 },
]

const SPACES = [
  { id: '1', name: 'Adventure', children: [
    { id: '1a', name: 'Adventure Deutschland' },
    { id: '1b', name: 'Adventure Philippinen' },
    { id: '1c', name: 'Adventure Thailand' },
  ]},
  { id: '2', name: 'Gudensberg Gemeinschaft', children: [] },
  { id: '3', name: 'Wir sind wertvoll', children: [] },
]

// ============================================================
// WIDGET-WRAPPER
// ============================================================

function WidgetCard({
  title,
  icon: Icon,
  color,
  size,
  children,
  onShare,
  className = '',
}: {
  title: string
  icon: typeof LayoutDashboard
  color: string
  size: WidgetSize
  children: React.ReactNode
  onShare?: () => void
  className?: string
}) {
  const [shared, setShared] = useState(false)

  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-1 md:col-span-1',
    large: 'col-span-1 md:col-span-2',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`${sizeClasses[size]} bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] rounded-2xl overflow-hidden hover:bg-white/[0.1] transition-colors ${className}`}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <span className="text-sm font-semibold text-white/90">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShared(!shared)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors group"
            title={shared ? 'Aus Profil entfernen' : 'Im Profil sichtbar machen'}
          >
            <Share2 className={`w-3.5 h-3.5 transition-colors ${shared ? 'text-orange-400' : 'text-white/30 group-hover:text-white/60'}`} />
          </button>
        </div>
      </div>
      {/* Widget Content */}
      <div className="p-4">
        {children}
      </div>
    </motion.div>
  )
}

// ============================================================
// INDIVIDUAL WIDGETS
// ============================================================

function PulseWidget() {
  const pulseItems = [
    { icon: Calendar, text: '3 neue Events in deinen Spaces', color: '#3b82f6', count: 3 },
    { icon: Swords, text: '2 Quests in der Naehe', color: '#f59e0b', count: 2 },
    { icon: ShoppingBag, text: '1 neues Marktplatz-Angebot', color: '#ec4899', count: 1 },
    { icon: Wallet, text: 'Anton hat dir 50 Token geschickt', color: '#22c55e', count: null },
    { icon: User, text: '5 neue Mitglieder im Adventure-Space', color: '#8b5cf6', count: 5 },
  ]

  return (
    <WidgetCard title="Puls" icon={Heart} color="#ef4444" size="medium">
      <div className="space-y-2.5">
        {pulseItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.06] cursor-pointer transition-colors group"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${item.color}20` }}
            >
              <item.icon className="w-4 h-4" style={{ color: item.color }} />
            </div>
            <span className="text-xs text-white/70 group-hover:text-white/90 transition-colors flex-1">{item.text}</span>
            {item.count && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${item.color}20`, color: item.color }}
              >
                {item.count}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </WidgetCard>
  )
}

function CalendarWidget() {
  const [subscribedSpaces, setSubscribedSpaces] = useState(['Gudensberg', 'Adventure DE'])

  const toggleSpace = (space: string) => {
    setSubscribedSpaces(prev =>
      prev.includes(space) ? prev.filter(s => s !== space) : [...prev, space]
    )
  }

  const today = CALENDAR_EVENTS.filter(e => !e.tomorrow)
  const tomorrow = CALENDAR_EVENTS.filter(e => e.tomorrow)

  return (
    <WidgetCard title="Kalender" icon={Calendar} color="#3b82f6" size="large">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Events */}
        <div>
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Heute</p>
          <div className="space-y-2">
            {today.map(event => (
              <div key={event.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] cursor-pointer transition-colors">
                <div className="w-1 h-10 rounded-full" style={{ backgroundColor: event.color }} />
                <div className="flex-1">
                  <p className="text-sm text-white/90 font-medium">{event.title}</p>
                  <p className="text-xs text-white/50">{event.time} - {event.space}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 mt-4">Morgen</p>
          <div className="space-y-2">
            {tomorrow.map(event => (
              <div key={event.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] cursor-pointer transition-colors">
                <div className="w-1 h-10 rounded-full opacity-60" style={{ backgroundColor: event.color }} />
                <div className="flex-1">
                  <p className="text-sm text-white/70 font-medium">{event.title}</p>
                  <p className="text-xs text-white/40">{event.time} - {event.space}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Space Subscriptions */}
        <div>
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Abonnierte Kalender</p>
          <div className="space-y-2">
            {['Gudensberg', 'Adventure DE', 'Adventure PH', 'Wir sind wertvoll'].map(space => {
              const isActive = subscribedSpaces.includes(space)
              return (
                <button
                  key={space}
                  onClick={() => toggleSpace(space)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left hover:bg-white/[0.06]"
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${isActive ? 'bg-blue-500 border-blue-500' : 'border-white/30'}`}>
                    {isActive && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm ${isActive ? 'text-white/90' : 'text-white/40'}`}>{space}</span>
                </button>
              )
            })}
          </div>
          <button className="mt-3 w-full py-2 rounded-xl bg-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/30 transition-colors">
            In meinen Handy-Kalender exportieren
          </button>
        </div>
      </div>
    </WidgetCard>
  )
}

function QuestWidget() {
  return (
    <WidgetCard title="Quests" icon={Swords} color="#f59e0b" size="medium">
      <div>
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">In der Naehe</p>
        <div className="space-y-2 mb-4">
          {QUESTS.filter(q => q.distance).map(quest => (
            <div key={quest.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] cursor-pointer transition-colors">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Swords className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/90 font-medium truncate">{quest.title}</p>
                <p className="text-xs text-white/40">{quest.distance} entfernt</p>
              </div>
              <span className="text-xs font-bold text-amber-400 flex-shrink-0">+{quest.xp} XP</span>
            </div>
          ))}
        </div>
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Aktive Quests</p>
        <div className="space-y-2">
          {QUESTS.filter(q => q.progress).map(quest => (
            <div key={quest.id} className="p-2.5 rounded-xl bg-white/[0.05]">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm text-white/80 font-medium">{quest.title}</p>
                <span className="text-xs text-amber-400 font-bold">+{quest.xp} XP</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                  style={{ width: `${quest.progress}%` }}
                />
              </div>
              <p className="text-xs text-white/40 mt-1">{quest.progress}% abgeschlossen</p>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  )
}

function SkillTreeWidget() {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)

  const subSkills: Record<string, { label: string; level: number; max: number; unlocked: boolean }[]> = {
    natur: [
      { label: 'Gartenarbeit', level: 3, max: 5, unlocked: true },
      { label: 'Permakultur', level: 1, max: 5, unlocked: true },
      { label: 'Tierpflege', level: 2, max: 5, unlocked: true },
      { label: 'Ernte & Konservierung', level: 0, max: 5, unlocked: false },
    ],
    handwerk: [
      { label: 'Holzbearbeitung', level: 2, max: 5, unlocked: true },
      { label: 'Reparieren', level: 3, max: 5, unlocked: true },
      { label: 'Naehen & Textil', level: 0, max: 5, unlocked: false },
      { label: 'Bauen & Konstruieren', level: 1, max: 5, unlocked: true },
    ],
    wissen: [
      { label: 'Systemdenken', level: 4, max: 5, unlocked: true },
      { label: 'Strategie', level: 3, max: 5, unlocked: true },
      { label: 'Recherche', level: 2, max: 5, unlocked: true },
      { label: 'Lehren & Teilen', level: 3, max: 5, unlocked: true },
    ],
    gemeinschaft: [
      { label: 'Moderation', level: 2, max: 5, unlocked: true },
      { label: 'Konfliktloesung', level: 1, max: 5, unlocked: true },
      { label: 'Vernetzung', level: 4, max: 5, unlocked: true },
      { label: 'Fuehrung', level: 2, max: 5, unlocked: true },
    ],
    kreativ: [
      { label: 'Design', level: 2, max: 5, unlocked: true },
      { label: 'Musik', level: 0, max: 5, unlocked: false },
      { label: 'Schreiben', level: 3, max: 5, unlocked: true },
      { label: 'Fotografie', level: 1, max: 5, unlocked: true },
    ],
    achtsamkeit: [
      { label: 'Meditation', level: 1, max: 5, unlocked: true },
      { label: 'Gesundheit', level: 2, max: 5, unlocked: true },
      { label: 'Reflexion', level: 1, max: 5, unlocked: true },
      { label: 'Grenzen setzen', level: 0, max: 5, unlocked: false },
    ],
  }

  const branch = selectedBranch ? SKILLS.find(s => s.id === selectedBranch) : null

  return (
    <WidgetCard title="Faehigkeitenbaum" icon={TreePine} color="#22c55e" size="large">
      <AnimatePresence mode="wait">
        {!branch ? (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SKILLS.map(skill => (
              <button
                key={skill.id}
                onClick={() => setSelectedBranch(skill.id)}
                className="flex flex-col items-start p-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] transition-all text-left border border-white/[0.06] hover:border-white/[0.12]"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-xl">{skill.icon}</span>
                  <span className="text-xs font-bold" style={{ color: skill.color }}>Lv.{skill.level}</span>
                </div>
                <p className="text-xs font-medium text-white/70 leading-tight mb-2">{skill.label}</p>
                <div className="flex gap-1">
                  {Array.from({ length: skill.max }).map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full border transition-all"
                      style={{
                        backgroundColor: i < skill.level ? skill.color : 'transparent',
                        borderColor: i < skill.level ? skill.color : 'rgba(255,255,255,0.15)',
                      }}
                    />
                  ))}
                </div>
              </button>
            ))}
          </motion.div>
        ) : (
          <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button
              onClick={() => setSelectedBranch(null)}
              className="text-xs text-white/40 hover:text-white/70 mb-3 flex items-center gap-1 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Alle Faehigkeiten
            </button>
            <div
              className="flex items-center gap-3 p-3 rounded-xl mb-3"
              style={{ background: `linear-gradient(135deg, ${branch.color}15, ${branch.color}05)` }}
            >
              <span className="text-2xl">{branch.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white/90">{branch.label}</p>
                <div className="flex gap-1 mt-1">
                  {Array.from({ length: branch.max }).map((_, i) => (
                    <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: i < branch.level ? branch.color : 'rgba(255,255,255,0.1)' }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-1">
              {subSkills[branch.id]?.map(skill => (
                <div key={skill.label} className="px-3 py-2.5 rounded-lg" style={{ opacity: skill.unlocked ? 1 : 0.35 }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white/80">{skill.label}</span>
                    <span className="text-xs text-white/40">{skill.unlocked ? `Lv.${skill.level}` : 'Gesperrt'}</span>
                  </div>
                  {skill.unlocked && (
                    <div className="flex gap-1">
                      {Array.from({ length: skill.max }).map((_, i) => (
                        <div key={i} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: i < skill.level ? branch.color : 'rgba(255,255,255,0.1)' }} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </WidgetCard>
  )
}

function AvatarWidget() {
  const levelLabel = PLAYER_LEVEL <= 10 ? 'Einsteiger' : PLAYER_LEVEL <= 25 ? 'Entdecker' : 'Spezialist'

  return (
    <WidgetCard title="Avatar" icon={User} color="#8b5cf6" size="medium">
      <div className="text-center">
        {/* Avatar */}
        <div className="relative inline-block mb-3">
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto border-3 border-purple-500/50 shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">T</span>
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-slate-900 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        </div>

        <p className="text-base font-bold text-white/95">Timo</p>
        <p className="text-xs text-white/40 mt-0.5">Berlin, Prenzlauer Berg</p>

        {/* Level Badge */}
        <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500 text-white">
          Level {PLAYER_LEVEL} · {levelLabel}
        </div>

        {/* XP Bar */}
        <div className="mt-4 px-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-white/50">Erfahrungspunkte</span>
            <span className="text-xs text-white/40">{CURRENT_XP} / {XP_TO_NEXT} XP</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
              style={{ width: `${XP_PROGRESS}%` }}
            />
          </div>
          <p className="text-xs text-white/30 mt-1">{XP_TO_NEXT - CURRENT_XP} XP bis Level {PLAYER_LEVEL + 1}</p>
        </div>

        {/* Trust Score */}
        <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-purple-500/10">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-purple-300">Vertrauensstufe</span>
          </div>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: i <= 3 ? '#8b5cf6' : 'rgba(255,255,255,0.1)' }} />
            ))}
          </div>
        </div>

        {/* Streak */}
        <div className="mt-3 flex items-center justify-center gap-2 p-2 rounded-xl bg-orange-500/10">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-medium text-orange-300">7 Tage Streak</span>
          <Flame className="w-4 h-4 text-orange-400" />
        </div>
      </div>
    </WidgetCard>
  )
}

function LogWidget() {
  const [filter, setFilter] = useState('alle')
  const filters = ['alle', 'quest', 'offer', 'markt', 'trust']
  const filteredEntries = filter === 'alle' ? LOG_ENTRIES : LOG_ENTRIES.filter(e => e.type === filter)

  return (
    <WidgetCard title="Log" icon={ScrollText} color="#a855f7" size="medium">
      {/* Filters */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              filter === f
                ? 'bg-white/20 text-white'
                : 'bg-white/[0.05] text-white/40 hover:text-white/60'
            }`}
          >
            {f === 'alle' ? 'Alle' : f === 'quest' ? 'Quests' : f === 'offer' ? 'Angebote' : f === 'markt' ? 'Markt' : 'Vertrauen'}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {filteredEntries.map(entry => (
          <div key={entry.id} className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors">
            <span
              className="px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 mt-0.5"
              style={{ backgroundColor: entry.color, color: entry.textColor }}
            >
              {entry.label}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/70 leading-snug">{entry.text}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-white/30">{entry.time}</span>
                {entry.xp && <span className="text-xs font-semibold text-purple-400">+{entry.xp} XP</span>}
                {entry.tokens && <span className="text-xs font-semibold text-amber-400">+{entry.tokens} Token</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  )
}

function WalletWidget() {
  const income = TRANSACTIONS.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0)
  const expense = TRANSACTIONS.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0)

  return (
    <WidgetCard title="Wertschoepfung" icon={Wallet} color="#f59e0b" size="medium">
      {/* Balance */}
      <div className="mb-4">
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-white/95">{WALLET_BALANCE.toLocaleString('de')}</span>
          <span className="text-sm text-white/40 mb-0.5">Token</span>
        </div>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="text-xs font-medium text-green-400">+{income}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="w-3 h-3 text-red-400" />
            <span className="text-xs font-medium text-red-400">-{expense}</span>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="space-y-1.5 mb-4">
        {TRANSACTIONS.slice(0, 4).map(tx => (
          <div key={tx.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: tx.type === 'in' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }}
            >
              {tx.type === 'in' ? (
                <ArrowUp className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-red-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/70 truncate">{tx.text}</p>
              <p className="text-xs text-white/30">{tx.time}</p>
            </div>
            <span className={`text-xs font-semibold ${tx.type === 'in' ? 'text-green-400' : 'text-red-400'}`}>
              {tx.type === 'in' ? '+' : '-'}{tx.amount}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button className="flex-1 py-2 rounded-xl bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-colors">
          Senden
        </button>
        <button className="flex-1 py-2 rounded-xl bg-white/[0.06] text-white/60 text-xs font-medium hover:bg-white/[0.1] transition-colors">
          Empfangen
        </button>
      </div>
    </WidgetCard>
  )
}

function MarketplaceWidget() {
  return (
    <WidgetCard title="Marktplatz" icon={ShoppingBag} color="#ec4899" size="medium">
      <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Neue Angebote in deinen Spaces</p>
      <div className="space-y-2 mb-4">
        {MARKETPLACE_ITEMS.filter(i => i.type === 'offer').map(item => (
          <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-4 h-4 text-pink-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-white/85 font-medium">{item.title}</p>
              <p className="text-xs text-white/40">{item.person}{item.distance ? ` · ${item.distance}` : ''}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Meine Bedarfe</p>
      <div className="space-y-2 mb-4">
        {MARKETPLACE_ITEMS.filter(i => i.type === 'need').map(item => (
          <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-dashed border-white/10">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-white/70 font-medium">{item.title}</p>
              <p className="text-xs text-white/30">Offen</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button className="flex-1 py-2 rounded-xl bg-pink-500/20 text-pink-400 text-xs font-medium hover:bg-pink-500/30 transition-colors">
          Neues Angebot
        </button>
        <button className="flex-1 py-2 rounded-xl bg-white/[0.06] text-white/60 text-xs font-medium hover:bg-white/[0.1] transition-colors">
          Neuer Bedarf
        </button>
      </div>
    </WidgetCard>
  )
}

function FeedWidget() {
  const feedItems = [
    { id: '1', space: 'Adventure DE', text: 'Neues Repair Cafe in Kassel eroeffnet! Kommt vorbei...', time: '2h', avatar: 'A' },
    { id: '2', space: 'Gudensberg', text: 'Markttag am Samstag - Staende anmelden bis Donnerstag', time: '5h', avatar: 'G' },
    { id: '3', space: 'Adventure DE', text: 'Anton hat Quest erstellt: "Waldputz-Aktion"', time: '1T', avatar: 'A' },
  ]

  return (
    <WidgetCard title="Feed" icon={Rss} color="#6366f1" size="medium">
      <div className="space-y-3">
        {feedItems.map(item => (
          <div key={item.id} className="flex gap-3 p-2 rounded-xl hover:bg-white/[0.04] cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-400">
              {item.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-indigo-400">{item.space}</span>
                <span className="text-xs text-white/30">{item.time}</span>
              </div>
              <p className="text-xs text-white/60 leading-snug">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  )
}

function MapWidget() {
  return (
    <WidgetCard title="Karte" icon={MapPin} color="#14b8a6" size="medium">
      {/* Map Placeholder */}
      <div className="rounded-xl bg-white/[0.05] border border-white/[0.08] h-40 flex items-center justify-center mb-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 to-blue-900/20" />
        <div className="relative text-center">
          <MapPin className="w-8 h-8 text-teal-400/60 mx-auto mb-1" />
          <p className="text-xs text-white/40">Interaktive Karte</p>
          <p className="text-xs text-white/20">Leaflet Integration</p>
        </div>
        {/* Fake pins */}
        <div className="absolute top-6 left-8 w-3 h-3 rounded-full bg-amber-400/60 animate-pulse" title="Quest" />
        <div className="absolute top-14 right-12 w-3 h-3 rounded-full bg-blue-400/60 animate-pulse" title="Event" />
        <div className="absolute bottom-10 left-16 w-3 h-3 rounded-full bg-pink-400/60 animate-pulse" title="Angebot" />
      </div>
      <div className="flex items-center justify-between text-xs text-white/50 px-1">
        <span>2km Radius</span>
        <div className="flex gap-3">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400" /> 1 Quest</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400" /> 2 Events</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-pink-400" /> 3 Angebote</span>
        </div>
      </div>
    </WidgetCard>
  )
}

function SpacesWidget() {
  const [expandedSpace, setExpandedSpace] = useState<string | null>('1')

  return (
    <WidgetCard title="Spaces" icon={FolderTree} color="#64748b" size="small">
      <div className="space-y-1">
        {SPACES.map(space => (
          <div key={space.id}>
            <button
              onClick={() => setExpandedSpace(expandedSpace === space.id ? null : space.id)}
              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-left"
            >
              {space.children.length > 0 && (
                <ChevronDown className={`w-3 h-3 text-white/30 transition-transform ${expandedSpace === space.id ? '' : '-rotate-90'}`} />
              )}
              {space.children.length === 0 && <div className="w-3" />}
              <FolderTree className="w-3.5 h-3.5 text-white/40" />
              <span className="text-xs text-white/70 font-medium">{space.name}</span>
            </button>
            <AnimatePresence>
              {expandedSpace === space.id && space.children.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden ml-7"
                >
                  {space.children.map(child => (
                    <button
                      key={child.id}
                      className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-left"
                    >
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                      <span className="text-xs text-white/50">{child.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </WidgetCard>
  )
}

// ============================================================
// WIDGET RENDERER
// ============================================================

function renderWidget(type: WidgetType) {
  switch (type) {
    case 'pulse': return <PulseWidget key="pulse" />
    case 'calendar': return <CalendarWidget key="calendar" />
    case 'quest': return <QuestWidget key="quest" />
    case 'skill-tree': return <SkillTreeWidget key="skill-tree" />
    case 'avatar': return <AvatarWidget key="avatar" />
    case 'log': return <LogWidget key="log" />
    case 'wallet': return <WalletWidget key="wallet" />
    case 'marketplace': return <MarketplaceWidget key="marketplace" />
    case 'feed': return <FeedWidget key="feed" />
    case 'map': return <MapWidget key="map" />
    case 'spaces': return <SpacesWidget key="spaces" />
    default: return null
  }
}

// ============================================================
// HUD (Heads-Up Display)
// ============================================================

function HUD() {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
    >
      <div className="flex justify-center pb-4 px-4">
        <div className="pointer-events-auto bg-black/60 backdrop-blur-2xl border border-white/[0.12] rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-2xl shadow-black/40">
          {/* XP Bar */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[10px] font-semibold text-purple-400">XP</span>
                <span className="text-[10px] text-white/40">{CURRENT_XP}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden w-16">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                  style={{ width: `${XP_PROGRESS}%` }}
                />
              </div>
            </div>
            <div className="px-1.5 py-0.5 rounded-md bg-purple-500 text-white font-bold text-[10px]">
              Lv.{PLAYER_LEVEL}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-white/10" />

          {/* Quick Access Buttons */}
          {[
            { icon: Wallet, label: 'Wallet', color: '#f59e0b' },
            { icon: TreePine, label: 'Skills', color: '#22c55e' },
            { icon: User, label: 'Avatar', color: '#8b5cf6' },
            { icon: ScrollText, label: 'Log', color: '#a855f7' },
          ].map(btn => (
            <button
              key={btn.label}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all border-2 border-white/10 hover:border-white/30 text-white/40 hover:text-white/80"
              title={btn.label}
            >
              <btn.icon className="w-4 h-4" />
            </button>
          ))}

          {/* Divider */}
          <div className="w-px h-8 bg-white/10" />

          {/* Wallet Balance */}
          <div className="flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-white/80">{WALLET_BALANCE.toLocaleString('de')}</span>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-1 ml-1">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[10px] font-bold text-orange-400">7</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================
// MAIN DASHBOARD VIEW
// ============================================================

export default function DashboardView() {
  const [activeView, setActiveView] = useState<ViewId>('mein-tag')
  const [showSettings, setShowSettings] = useState(false)

  const currentView = VIEWS.find(v => v.id === activeView)!
  const widgets = currentView.widgets

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* Top Bar */}
      <div className="flex-shrink-0 px-4 md:px-6 py-3 border-b border-white/[0.08] bg-white/[0.03] backdrop-blur-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white/95">Dashboard</h1>
              <p className="text-xs text-white/40">Dein persoenliches Cockpit</p>
            </div>
          </div>

          {/* Notifications + Settings */}
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-xl hover:bg-white/[0.06] transition-colors">
              <Bell className="w-5 h-5 text-white/50" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-xl hover:bg-white/[0.06] transition-colors"
            >
              <Settings className="w-5 h-5 text-white/50" />
            </button>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex-shrink-0 px-4 md:px-6 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-1 max-w-7xl mx-auto">
          {VIEWS.map(view => {
            const isActive = activeView === view.id
            const Icon = view.icon
            return (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/[0.12] text-white shadow-sm'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.05]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {view.label}
              </button>
            )
          })}
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-all ml-1">
            <Plus className="w-3.5 h-3.5" />
            Neue Ansicht
          </button>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {widgets.map(widgetType => renderWidget(widgetType))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* HUD */}
      <div className="hidden md:block">
        <HUD />
      </div>
    </div>
  )
}
