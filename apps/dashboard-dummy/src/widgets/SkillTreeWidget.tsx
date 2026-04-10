import { useState } from 'react'
import { TreePine, ChevronLeft } from 'lucide-react'
import { Card } from '../components/Card'
import { SKILL_BRANCHES } from '../data/demo'

const SUB_SKILLS: Record<string, { label: string; level: number; max: number; unlocked: boolean }[]> = {
  natur: [
    { label: 'Gartenarbeit',           level: 3, max: 5, unlocked: true },
    { label: 'Permakultur',            level: 1, max: 5, unlocked: true },
    { label: 'Tierpflege',             level: 2, max: 5, unlocked: true },
    { label: 'Ernte & Konservierung',  level: 0, max: 5, unlocked: false },
  ],
  handwerk: [
    { label: 'Holzbearbeitung',        level: 2, max: 5, unlocked: true },
    { label: 'Reparieren',             level: 3, max: 5, unlocked: true },
    { label: 'Nähen & Textil',         level: 0, max: 5, unlocked: false },
    { label: 'Bauen & Konstruieren',   level: 1, max: 5, unlocked: true },
  ],
  wissen: [
    { label: 'Systemdenken',           level: 4, max: 5, unlocked: true },
    { label: 'Strategie',              level: 3, max: 5, unlocked: true },
    { label: 'Recherche',              level: 2, max: 5, unlocked: true },
    { label: 'Lehren & Teilen',        level: 3, max: 5, unlocked: true },
  ],
  gemeinschaft: [
    { label: 'Moderation',             level: 2, max: 5, unlocked: true },
    { label: 'Konfliktlösung',         level: 1, max: 5, unlocked: true },
    { label: 'Vernetzung',             level: 4, max: 5, unlocked: true },
    { label: 'Führung',                level: 2, max: 5, unlocked: true },
  ],
  kreativ: [
    { label: 'Design',                 level: 2, max: 5, unlocked: true },
    { label: 'Musik',                  level: 0, max: 5, unlocked: false },
    { label: 'Schreiben',              level: 3, max: 5, unlocked: true },
    { label: 'Fotografie',             level: 1, max: 5, unlocked: true },
  ],
  achtsamkeit: [
    { label: 'Meditation',             level: 1, max: 5, unlocked: true },
    { label: 'Gesundheit',             level: 2, max: 5, unlocked: true },
    { label: 'Reflexion',              level: 1, max: 5, unlocked: true },
    { label: 'Grenzen setzen',         level: 0, max: 5, unlocked: false },
  ],
}

export function SkillTreeWidget() {
  const [selected, setSelected] = useState<string | null>(null)
  const branch = selected ? SKILL_BRANCHES.find(b => b.id === selected) : null

  return (
    <Card title="Fähigkeitenbaum" icon={TreePine} iconColor="oklch(0.65 0.18 145)">
      {!branch ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
          {SKILL_BRANCHES.map(skill => (
            <button
              key={skill.id}
              onClick={() => setSelected(skill.id)}
              className="p-3 rounded-lg border hover:shadow-sm transition-all text-left"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{skill.icon}</span>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: `${skill.color}20`, color: skill.color }}>
                  Lv.{skill.level}
                </span>
              </div>
              <p className="text-xs font-semibold leading-tight mb-2" style={{ color: 'var(--foreground)' }}>{skill.label}</p>
              <div className="flex gap-1">
                {Array.from({ length: skill.max }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-1.5 rounded-full transition-all"
                    style={{
                      background: i < skill.level ? skill.color : 'var(--border)',
                    }}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1 text-xs font-medium mb-3 hover:underline"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <ChevronLeft className="w-3 h-3" />
            Alle Fähigkeiten
          </button>
          <div
            className="flex items-center gap-3 p-3 rounded-lg mb-3"
            style={{ background: `${branch.color}10` }}
          >
            <span className="text-2xl">{branch.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{branch.label}</p>
              <p className="text-xs" style={{ color: branch.color }}>Level {branch.level} von {branch.max}</p>
            </div>
          </div>
          <div className="space-y-2">
            {SUB_SKILLS[branch.id]?.map(sub => (
              <div
                key={sub.label}
                className="p-2.5 rounded-lg border"
                style={{
                  borderColor: 'var(--border)',
                  opacity: sub.unlocked ? 1 : 0.4,
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{sub.label}</span>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {sub.unlocked ? `Lv.${sub.level}` : 'Gesperrt'}
                  </span>
                </div>
                {sub.unlocked && (
                  <div className="flex gap-1">
                    {Array.from({ length: sub.max }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 h-1 rounded-full"
                        style={{ background: i < sub.level ? branch.color : 'var(--border)' }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
