import type { LucideIcon } from 'lucide-react'

type AdminStatCardProps = {
  label: string
  value: string | number
  sub: string
  icon: LucideIcon
}

export default function AdminStatCard({ label, value, sub, icon: Icon }: AdminStatCardProps) {
  return (
    <div className="card-elevated p-5 md:p-6 hover:border-primary/35 transition-all duration-300 group relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center gap-3 mb-4">
        <div className="feature-icon-ring w-11 h-11 shrink-0">
          <Icon className="w-5 h-5 text-primary" strokeWidth={1.75} />
        </div>
        <span className="text-xs font-bold text-roma-subtle uppercase tracking-[0.15em]" style={{ fontFamily: 'var(--font-display)' }}>
          {label}
        </span>
      </div>
      <p className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
      <p className="text-xs text-roma-muted mt-2">{sub}</p>
    </div>
  )
}
