import type { ReactNode } from 'react'

export default function AdminFormCard({ children }: { children: ReactNode }) {
  return (
    <div className="card-elevated p-5 md:p-6 mb-6 border-primary/15 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      {children}
    </div>
  )
}
