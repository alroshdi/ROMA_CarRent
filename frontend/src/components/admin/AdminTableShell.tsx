import type { ReactNode } from 'react'

export default function AdminTableShell({ children }: { children: ReactNode }) {
  return (
    <div className="card-elevated overflow-hidden border-primary/10 relative">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}
