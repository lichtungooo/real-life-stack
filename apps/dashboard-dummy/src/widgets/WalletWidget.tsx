import { Wallet, ArrowUpRight, ArrowDownRight, Send, Download } from 'lucide-react'
import { Card } from '../components/Card'
import { TRANSACTIONS, PLAYER } from '../data/demo'

export function WalletWidget() {
  const income = TRANSACTIONS.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0)
  const expense = TRANSACTIONS.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0)

  return (
    <Card title="Wertschöpfung" icon={Wallet} iconColor="oklch(0.65 0.18 145)">
      <div>
        {/* Balance */}
        <div className="mb-4 p-4 rounded-lg" style={{ background: 'linear-gradient(135deg, oklch(0.65 0.18 145 / 0.08), oklch(0.63 0.16 55 / 0.08))' }}>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Aktueller Kontostand</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>{PLAYER.walletBalance.toLocaleString('de-DE')}</span>
            <span className="text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>{PLAYER.walletCurrency}</span>
          </div>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5" style={{ color: 'oklch(0.65 0.18 145)' }} />
              <span className="text-xs font-semibold" style={{ color: 'oklch(0.65 0.18 145)' }}>+{income}</span>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>erhalten</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowDownRight className="w-3.5 h-3.5" style={{ color: 'var(--destructive)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--destructive)' }}>-{expense}</span>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>gegeben</span>
            </div>
          </div>
        </div>

        {/* Recent transactions */}
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-foreground)' }}>Letzte Transaktionen</p>
        <div className="space-y-1 mb-4">
          {TRANSACTIONS.slice(0, 4).map(tx => (
            <div key={tx.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30 transition-colors">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: tx.type === 'in' ? 'oklch(0.65 0.18 145 / 0.15)' : 'oklch(0.54 0.19 27 / 0.15)',
                }}
              >
                {tx.type === 'in' ? (
                  <ArrowDownRight className="w-4 h-4" style={{ color: 'oklch(0.65 0.18 145)' }} />
                ) : (
                  <ArrowUpRight className="w-4 h-4" style={{ color: 'var(--destructive)' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{tx.text}</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{tx.from} · {tx.time}</p>
              </div>
              <span
                className="text-sm font-bold shrink-0"
                style={{ color: tx.type === 'in' ? 'oklch(0.65 0.18 145)' : 'var(--destructive)' }}
              >
                {tx.type === 'in' ? '+' : '-'}{tx.amount}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--primary)' }}
          >
            <Send className="w-3.5 h-3.5" />
            Senden
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border hover:bg-accent transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            <Download className="w-3.5 h-3.5" />
            Empfangen
          </button>
        </div>
      </div>
    </Card>
  )
}
