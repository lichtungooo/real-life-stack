import { ShoppingBag, MapPin, Plus } from 'lucide-react'
import { Card } from '../components/Card'
import { MARKETPLACE_ITEMS } from '../data/demo'

export function MarketplaceWidget() {
  const offers = MARKETPLACE_ITEMS.filter(i => i.type === 'offer')
  const needs = MARKETPLACE_ITEMS.filter(i => i.type === 'need')

  return (
    <Card title="Marktplatz" icon={ShoppingBag} iconColor="oklch(0.65 0.20 0)">
      <div className="space-y-4">
        {/* Offers */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Neue Angebote</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'oklch(0.65 0.20 0 / 0.15)', color: 'oklch(0.55 0.20 0)' }}>
              {offers.length} neu
            </span>
          </div>
          <div className="space-y-2">
            {offers.map(item => (
              <button
                key={item.id}
                className="w-full flex items-center gap-3 p-3 rounded-lg border hover:shadow-sm transition-all text-left group"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'oklch(0.65 0.20 0 / 0.15)' }}>
                  <ShoppingBag className="w-4 h-4" style={{ color: 'oklch(0.55 0.20 0)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors" style={{ color: 'var(--foreground)' }}>{item.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{item.person}</span>
                    {item.distance && (
                      <>
                        <span style={{ color: 'var(--muted-foreground)' }}>·</span>
                        <div className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} />
                          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{item.distance}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* My needs */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Meine Bedarfe</p>
            <button className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: 'var(--primary)' }}>
              <Plus className="w-3 h-3" />
              Neu
            </button>
          </div>
          <div className="space-y-2">
            {needs.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--accent)' }}>
                  <Plus className="w-4 h-4" style={{ color: 'var(--accent-foreground)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{item.title}</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Aktiv · 0 Antworten</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
