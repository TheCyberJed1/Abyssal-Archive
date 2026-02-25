import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Share2, Filter } from 'lucide-react'
import KnowledgeGraph from '../components/graph/KnowledgeGraph'
import { api } from '../api/client'

const GRAPH_MODES = [
  { id: 'full', label: 'Full Graph' },
  { id: 'mitre', label: 'MITRE Coverage' },
]

const KNOWLEDGE_TYPES = [
  'recon', 'exploit', 'post-exploitation', 'tool', 'payload',
  'writeup', 'poc', 'zero-day', 'case-study', 'mitre-technique',
]

export default function GraphPage() {
  const [searchParams] = useSearchParams()
  const [graphData, setGraphData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('full')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedNode, setSelectedNode] = useState(null)

  const focusId = searchParams.get('focus')

  useEffect(() => {
    fetchGraph()
  }, [mode, typeFilter])

  const fetchGraph = async () => {
    setLoading(true)
    try {
      let data
      if (mode === 'mitre') {
        data = await api.graph.mitre()
      } else {
        data = await api.graph.full(typeFilter ? { knowledge_type: typeFilter } : {})
      }
      setGraphData(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-xl font-bold text-white">
          <span className="text-neon-red">$</span> ATTACK GRAPH
        </h1>
        <p className="font-mono text-xs text-terminal-gray mt-1">
          Visualize knowledge relationships, attack chains, and MITRE ATT&CK coverage
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-abyss-surface border border-abyss-border rounded p-1">
          {GRAPH_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-3 py-1 rounded font-mono text-xs transition-all duration-200
                ${mode === m.id
                  ? 'bg-neon-redGlow text-neon-red border border-neon-redDim'
                  : 'text-terminal-gray hover:text-white'
                }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === 'full' && (
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-terminal-gray" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field w-48 h-8 text-xs"
            >
              <option value="">All Types</option>
              {KNOWLEDGE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}

        <div className="font-mono text-xs text-terminal-gray ml-auto">
          {graphData && (
            <>
              <span className="text-neon-red">{graphData.nodes?.length ?? 0}</span> nodes •{' '}
              <span className="text-terminal-cyan">{graphData.edges?.length ?? 0}</span> edges
            </>
          )}
        </div>
      </div>

      {/* Graph */}
      {loading ? (
        <div className="panel flex items-center justify-center h-96">
          <div className="font-mono text-sm text-terminal-gray animate-pulse">
            Rendering graph...
          </div>
        </div>
      ) : (
        <KnowledgeGraph graphData={graphData} onNodeClick={setSelectedNode} />
      )}

      {/* Selected node detail */}
      {selectedNode && (
        <div className="panel p-4">
          <div className="panel-header mb-3">SELECTED NODE</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
            <div>
              <div className="text-terminal-gray mb-0.5">ID</div>
              <div className="text-white truncate">{selectedNode.id}</div>
            </div>
            <div>
              <div className="text-terminal-gray mb-0.5">Label</div>
              <div className="text-white">{selectedNode.fullLabel || selectedNode.label}</div>
            </div>
            <div>
              <div className="text-terminal-gray mb-0.5">Type</div>
              <span className={`badge-type type-${selectedNode.type}`}>{selectedNode.type}</span>
            </div>
            <div>
              <div className="text-terminal-gray mb-0.5">Skill Level</div>
              <div className="text-neon-red">{selectedNode.skillLevel}/5</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
