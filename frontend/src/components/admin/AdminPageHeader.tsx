import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type AdminPageHeaderProps = {
  title: string
  subtitle?: string
  action?: ReactNode
  icon?: LucideIcon
}

export default function AdminPageHeader({ title, subtitle, action, icon: Icon }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div className="flex items-start gap-4 min-w-0">
        {Icon && (
          <div className="feature-icon-ring w-12 h-12 shrink-0 hidden sm:flex">
            <Icon className="w-5 h-5 text-primary" strokeWidth={1.75} />
          </div>
        )}
        <div className="min-w-0">
          <div className="accent-line mb-3" />
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase" style={{ fontFamily: 'var(--font-display)' }}>
            {title}
          </h1>
          {subtitle && <p className="text-sm text-roma-muted mt-1.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
