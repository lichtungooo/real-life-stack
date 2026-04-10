import { Rss, Heart, MessageCircle, Share2 } from 'lucide-react'
import { Card } from '../components/Card'
import { FEED_ITEMS } from '../data/demo'

export function FeedWidget() {
  return (
    <Card title="Feed" icon={Rss} iconColor="oklch(0.55 0.21 264)" noPadding>
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {FEED_ITEMS.map(item => (
          <article key={item.id} className="px-5 py-4 hover:bg-accent/30 transition-colors cursor-pointer" style={{ borderColor: 'var(--border)' }}>
            <div className="flex gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ background: 'var(--secondary)' }}
              >
                {item.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.author}</span>
                  <span style={{ color: 'var(--muted-foreground)' }}>·</span>
                  <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}>
                    {item.space}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{item.time}</span>
                </div>
                <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--foreground)' }}>{item.text}</p>
                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  <button className="flex items-center gap-1 hover:text-primary transition-colors">
                    <Heart className="w-3.5 h-3.5" />
                    <span>12</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-primary transition-colors">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>3</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-primary transition-colors">
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Card>
  )
}
