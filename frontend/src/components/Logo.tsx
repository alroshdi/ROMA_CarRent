import { Link } from 'react-router-dom'

interface LogoProps {
  className?: string
  height?: number
  to?: string | false
}

export default function Logo({ className = '', height = 40, to = '/' }: LogoProps) {
  const img = (
    <img
      src="/logo/logo.png"
      alt="ROMA CAR"
      height={height}
      className={`object-contain ${className}`}
      style={{ height }}
    />
  )

  if (to !== false) {
    return (
      <Link to={to || '/'} className="inline-flex items-center shrink-0">
        {img}
      </Link>
    )
  }

  return <span className="inline-flex items-center shrink-0">{img}</span>
}
