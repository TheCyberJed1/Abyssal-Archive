import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen, Share2, Bot, Download, TrendingUp,
  Shield, Terminal, Database, Plus, Activity,
} from 'lucide-react'
import { api } from '../api/client'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentEntries, setRecentEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.knowledge.list({ page: 1, page_size: 5 }),
    ]).then(([knowledgeData]) => {
      setStats({ total: knowledgeData.total })
      setRecentEntries(knowledgeData.items)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-mono text-2xl font-bold text-white">
          <span className="text-neon-red">$</span> ABYSSAL ARCHIVE
        </h1>
        <p className="font-mono text-sm text-terminal-gray mt-1">
          Offensive Security Knowledge Operating System // CLASSIFIED
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen size={20} />}
          label="Knowledge Entries"
          value={stats?.total ?? '—'}
          color="text-terminal-cyan"
        />
        <StatCard
          icon={<Shield size={20} />}
          label="MITRE Techniques"
          value="—"
          color="text-neon-red"
        />
        <StatCard
          icon={<Database size={20} />}
          label="Vector Embeddings"
          value={stats?.total ?? '—'}
          color="text-terminal-green"
        />
        <StatCard
          icon={<Activity size={20} />}
          label="System Status"
          value="ONLINE"
          color="text-terminal-green"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Entries */}
        <div className="lg:col-span-2 panel">
          <div className="panel-header flex items-center justify-between">
            <span>RECENT ENTRIES</span>
            <Link to="/knowledge" className="text-terminal-gray hover:text-neon-red font-mono text-xs transition-colors">
              VIEW ALL →
            </Link>
          </div>
          <div className="divide-y divide-abyss-border">
            {loading ? (
              <div className="p-4 text-center font-mono text-sm text-terminal-gray animate-pulse">
                Loading archive...
              </div>
            ) : recentEntries.length === 0 ? (
              <div className="p-8 text-center">
                <div className="font-mono text-sm text-terminal-gray space-y-2">
                  <div className="text-neon-red text-3xl mb-3">∅</div>
                  <p className="text-white">Archive is empty</p>
                  <p className="text-xs">Begin by creating your first entry</p>
                  <Link to="/knowledge/new" className="btn-primary inline-flex items-center gap-2 mt-3 text-xs">
                    <Plus size={12} />
                    Create Entry
                  </Link>
                </div>
              </div>
            ) : (
              recentEntries.map((entry) => (
                <RecentEntryRow key={entry.id} entry={entry} />
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="panel">
            <div className="panel-header">QUICK ACTIONS</div>
            <div className="p-4 space-y-2">
              <QuickLink to="/knowledge/new" icon={<Plus size={14} />} label="New Knowledge Entry" />
              <QuickLink to="/graph" icon={<Share2 size={14} />} label="View Attack Graph" />
              <QuickLink to="/archivist" icon={<Bot size={14} />} label="Query The Archivist" />
              <QuickLink to="/ingest" icon={<Download size={14} />} label="Ingest Content" />
              <button
                onClick={() => api.export.ndjson()}
                className="w-full flex items-center gap-2 px-3 py-2 rounded border border-abyss-border
                           font-mono text-xs text-terminal-gray hover:border-neon-redDim hover:text-neon-red
                           transition-all duration-200"
              >
                <TrendingUp size={14} />
                Export Archive (NDJSON)
              </button>
            </div>
          </div>

          {/* System Info */}
          <div className="panel">
            <div className="panel-header">SYSTEM INFO</div>
            <div className="p-4 space-y-2 font-mono text-xs text-terminal-gray">
              <InfoRow label="Backend" value="FastAPI" />
              <InfoRow label="Database" value="PostgreSQL + Qdrant" />
              <InfoRow label="LLM Runtime" value="Ollama (local)" />
              <InfoRow label="Graph Engine" value="Cytoscape.js" />
              <InfoRow label="Auth" value={<span className="text-terminal-green">NONE (LOCAL)</span>} />
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Banner */}
      <div className="panel p-4 font-mono text-xs text-terminal-green">
        <div className="text-terminal-gray mb-1">// SYSTEM MESSAGE</div>
        <div>
          <span className="text-neon-red">WARNING:</span> This system is for authorized use only.
          All knowledge is stored locally. Zero telemetry. Zero cloud. Total operational security.
        </div>
        <div className="mt-1 text-terminal-dimgray">
          &gt; abyssal_archive --mode=classified --auth=none --deployment=local
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="panel p-4 space-y-2">
      <div className={`${color}`}>{icon}</div>
      <div className={`font-mono text-2xl font-bold ${color}`}>{value}</div>
      <div className="font-mono text-xs text-terminal-gray">{label}</div>
    </div>
  )
}

function RecentEntryRow({ entry }) {
  return (
    <Link to={`/knowledge/${entry.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-abyss-border transition-colors group">
      <div className={`badge-type type-${entry.knowledge_type} shrink-0`}>
        {entry.knowledge_type}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-sm text-white group-hover:text-neon-red transition-colors truncate">
          {entry.title}
        </div>
        <div className="font-mono text-xs text-terminal-gray">
          {new Date(entry.created_at).toLocaleDateString()}
        </div>
      </div>
    </Link>
  )
}

function QuickLink({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-3 py-2 rounded border border-abyss-border
                 font-mono text-xs text-terminal-gray hover:border-neon-redDim hover:text-neon-red
                 transition-all duration-200"
    >
      {icon}
      {label}
    </Link>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-terminal-dimgray">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  )
}
