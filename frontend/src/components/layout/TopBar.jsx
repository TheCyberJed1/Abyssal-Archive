import { useLocation, Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const routeTitles = {
  '/': 'DASHBOARD',
  '/knowledge': 'KNOWLEDGE BASE',
  '/graph': 'ATTACK GRAPH',
  '/archivist': 'THE ARCHIVIST',
  '/ingest': 'INGEST PIPELINE',
}

export default function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const title = Object.entries(routeTitles).find(([path]) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  )?.[1] ?? 'ABYSSAL ARCHIVE'

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/knowledge?search=${encodeURIComponent(search)}`)
    }
  }

  return (
    <header className="h-14 bg-abyss-surface border-b border-abyss-border flex items-center px-6 gap-4 shrink-0">
      {/* Title */}
      <div className="font-mono text-sm font-bold text-neon-red tracking-widest min-w-0">
        <span className="text-terminal-gray">// </span>
        {title}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-gray" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search archive..."
            className="input-field pl-9 w-64 h-8 text-xs"
          />
        </div>
      </form>

      {/* New Entry */}
      <Link to="/knowledge/new" className="btn-primary flex items-center gap-2 h-8 text-xs">
        <Plus size={14} />
        New Entry
      </Link>

      {/* Clock */}
      <div className="font-mono text-xs text-terminal-gray hidden md:block">
        <SystemClock />
      </div>
    </header>
  )
}

function SystemClock() {
  const [time, setTime] = useState(new Date().toISOString().slice(0, 19).replace('T', ' '))
  useState(() => {
    const interval = setInterval(() => {
      setTime(new Date().toISOString().slice(0, 19).replace('T', ' '))
    }, 1000)
    return () => clearInterval(interval)
  })
  return <span>{time}Z</span>
}
