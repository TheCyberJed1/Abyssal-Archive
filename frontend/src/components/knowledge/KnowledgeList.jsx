import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Filter, SortDesc } from 'lucide-react'
import KnowledgeCard from './KnowledgeCard'
import { api } from '../../api/client'

const KNOWLEDGE_TYPES = [
  'recon', 'exploit', 'post-exploitation', 'tool', 'payload',
  'writeup', 'poc', 'zero-day', 'case-study', 'mitre-technique',
]

export default function KnowledgeList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [entries, setEntries] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    fetchEntries()
  }, [page, typeFilter, searchParams])

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const params = { page, page_size: 20 }
      if (typeFilter) params.knowledge_type = typeFilter
      const q = searchParams.get('search')
      if (q) params.search = q

      const data = await api.knowledge.list(params)
      setEntries(data.items)
      setTotal(data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    setSearchParams(search ? { search } : {})
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-64">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-gray" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entries..."
              className="input-field pl-9"
            />
          </div>
          <button type="submit" className="btn-primary h-9">Search</button>
        </form>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-terminal-gray" />
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
            className="input-field w-48 h-9"
          >
            <option value="">All Types</option>
            {KNOWLEDGE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="font-mono text-xs text-terminal-gray ml-auto">
          <span className="text-neon-red">{total}</span> entries
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingSkeleton />
      ) : entries.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {entries.map((entry) => (
            <KnowledgeCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 font-mono text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-ghost h-8 px-3 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-terminal-gray">
            <span className="text-white">{page}</span> / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-ghost h-8 px-3 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="panel p-4 space-y-3 animate-pulse">
          <div className="h-4 bg-abyss-border rounded w-3/4" />
          <div className="h-3 bg-abyss-border rounded w-1/2" />
          <div className="h-3 bg-abyss-border rounded w-full" />
          <div className="h-3 bg-abyss-border rounded w-5/6" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="panel p-12 text-center">
      <div className="font-mono text-sm text-terminal-gray space-y-2">
        <div className="text-neon-red text-2xl mb-4">∅</div>
        <div className="text-white">No entries found</div>
        <div className="text-xs">The archive is empty. Begin ingesting knowledge.</div>
      </div>
    </div>
  )
}
