import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import KnowledgeList from '../components/knowledge/KnowledgeList'

export default function KnowledgePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-xl font-bold text-white">
            <span className="text-neon-red">$</span> KNOWLEDGE BASE
          </h1>
          <p className="font-mono text-xs text-terminal-gray mt-1">
            Browse, search, and manage all archived knowledge entries
          </p>
        </div>
        <Link to="/knowledge/new" className="btn-primary flex items-center gap-2">
          <Plus size={14} />
          New Entry
        </Link>
      </div>

      <KnowledgeList />
    </div>
  )
}
