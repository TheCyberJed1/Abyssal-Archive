import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  Share2,
  Bot,
  Download,
  ChevronRight,
  Skull,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/knowledge', icon: BookOpen, label: 'Knowledge Base' },
  { to: '/graph', icon: Share2, label: 'Attack Graph' },
  { to: '/archivist', icon: Bot, label: 'The Archivist' },
  { to: '/ingest', icon: Download, label: 'Ingest' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-abyss-surface border-r border-abyss-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-abyss-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center border border-neon-red rounded bg-neon-redGlow">
            <Skull size={16} className="text-neon-red" />
          </div>
          <div>
            <div className="font-mono text-sm font-bold text-white tracking-widest">
              ABYSSAL
            </div>
            <div className="font-mono text-xs text-neon-red tracking-widest">
              ARCHIVE
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-xs text-terminal-gray">
          <span className="text-neon-red">// </span>CLASSIFIED RED TEAM OPS
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded font-mono text-sm transition-all duration-200 group
               ${isActive
                 ? 'bg-neon-redGlow text-neon-red border border-neon-redDim'
                 : 'text-terminal-gray hover:text-white hover:bg-abyss-border'
               }`
            }
          >
            <Icon size={16} />
            <span className="flex-1">{label}</span>
            <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Status Bar */}
      <div className="p-4 border-t border-abyss-border">
        <div className="font-mono text-xs text-terminal-gray space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse" />
            <span>SYSTEM ONLINE</span>
          </div>
          <div className="text-terminal-dimgray">
            v1.0.0 // LOCAL ONLY
          </div>
        </div>
      </div>
    </aside>
  )
}
