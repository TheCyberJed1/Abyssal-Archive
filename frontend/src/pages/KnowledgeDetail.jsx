import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Edit2, Trash2, ArrowLeft, Shield, Tag, Calendar,
  Star, User, Globe, Share2, ExternalLink,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api } from '../api/client'
import KnowledgeEditor from '../components/knowledge/KnowledgeEditor'

export default function KnowledgeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.knowledge.get(id)
      .then(setEntry)
      .catch(() => setError('Entry not found'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Delete this entry? This cannot be undone.')) return
    setDeleting(true)
    try {
      await api.knowledge.delete(id)
      navigate('/knowledge')
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  const handleSave = async (payload) => {
    const updated = await api.knowledge.update(id, payload)
    setEntry(updated)
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="panel p-8 text-center font-mono text-sm text-terminal-gray animate-pulse">
        Loading entry...
      </div>
    )
  }

  if (error || !entry) {
    return (
      <div className="panel p-8 text-center">
        <div className="font-mono text-sm text-neon-red">{error || 'Entry not found'}</div>
        <Link to="/knowledge" className="btn-ghost mt-4 inline-flex items-center gap-2 text-sm">
          <ArrowLeft size={14} /> Back to Knowledge Base
        </Link>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(false)} className="btn-ghost flex items-center gap-2 text-sm">
            <ArrowLeft size={14} /> Cancel Edit
          </button>
          <h1 className="font-mono text-xl font-bold text-white">
            <span className="text-neon-red">$</span> EDIT ENTRY
          </h1>
        </div>
        <KnowledgeEditor initial={entry} onSave={handleSave} isEdit />
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link to="/knowledge" className="btn-ghost flex items-center gap-2 text-sm">
          <ArrowLeft size={14} /> Knowledge Base
        </Link>
        <div className="flex items-center gap-2">
          <Link to={`/graph?focus=${id}`} className="btn-ghost flex items-center gap-2 text-sm">
            <Share2 size={14} /> Graph View
          </Link>
          <button onClick={() => setEditing(true)} className="btn-ghost flex items-center gap-2 text-sm">
            <Edit2 size={14} /> Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-ghost flex items-center gap-2 text-sm text-neon-red border-neon-redDim hover:bg-neon-redGlow disabled:opacity-50"
          >
            <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Entry Header */}
      <div className="panel p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h1 className="font-mono text-xl font-bold text-white">{entry.title}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={`badge-type type-${entry.knowledge_type}`}>
                {entry.knowledge_type}
              </span>
              <SkillStars level={entry.skill_level} />
              <span className="font-mono text-xs text-terminal-gray">
                Confidence: <span className="text-terminal-cyan">{entry.confidence_rating?.toFixed(1)}/5.0</span>
              </span>
            </div>
          </div>
        </div>

        {entry.summary && (
          <p className="text-sm text-terminal-gray leading-relaxed border-l-2 border-neon-redDim pl-4">
            {entry.summary}
          </p>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-abyss-border">
          {entry.phase && (
            <MetaItem icon={<Globe size={12} />} label="Phase" value={entry.phase} />
          )}
          {entry.author && (
            <MetaItem icon={<User size={12} />} label="Author" value={entry.author} />
          )}
          <MetaItem
            icon={<Calendar size={12} />}
            label="Created"
            value={new Date(entry.created_at).toLocaleDateString()}
          />
          <MetaItem
            icon={<Calendar size={12} />}
            label="Updated"
            value={new Date(entry.updated_at).toLocaleDateString()}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content */}
        <div className="lg:col-span-2 space-y-4">
          <div className="panel">
            <div className="panel-header">CONTENT</div>
            <div className="p-6">
              <article className="prose prose-invert prose-sm max-w-none
                prose-headings:font-mono prose-headings:text-white
                prose-code:text-terminal-green prose-code:bg-abyss-bg prose-code:px-1 prose-code:rounded
                prose-pre:bg-abyss-bg prose-pre:border prose-pre:border-abyss-border
                prose-a:text-terminal-cyan prose-a:no-underline hover:prose-a:text-neon-red
                prose-blockquote:border-l-neon-redDim prose-blockquote:text-terminal-gray">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {entry.content}
                </ReactMarkdown>
              </article>
            </div>
          </div>
        </div>

        {/* Metadata sidebar */}
        <div className="space-y-4">
          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="panel">
              <div className="panel-header">
                <Tag size={12} className="inline mr-2" />TAGS
              </div>
              <div className="p-3 flex flex-wrap gap-1.5">
                {entry.tags.map((t) => <span key={t} className="tag">{t}</span>)}
              </div>
            </div>
          )}

          {/* MITRE */}
          {entry.mitre_techniques && entry.mitre_techniques.length > 0 && (
            <div className="panel">
              <div className="panel-header">
                <Shield size={12} className="inline mr-2" />MITRE ATT&CK
              </div>
              <div className="p-3 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {entry.mitre_techniques.map((t) => (
                    <a
                      key={t}
                      href={`https://attack.mitre.org/techniques/${t}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tag-red flex items-center gap-1 tag hover:text-white transition-colors"
                    >
                      {t} <ExternalLink size={9} />
                    </a>
                  ))}
                </div>
                {entry.mitre_tactics && entry.mitre_tactics.length > 0 && (
                  <div className="font-mono text-xs text-terminal-gray">
                    Tactics: {entry.mitre_tactics.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* References */}
          {entry.references && entry.references.length > 0 && (
            <div className="panel">
              <div className="panel-header">REFERENCES</div>
              <div className="p-3 space-y-1">
                {entry.references.map((ref, i) => (
                  <a
                    key={i}
                    href={ref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-mono text-xs text-terminal-cyan hover:text-neon-red transition-colors break-all"
                  >
                    <ExternalLink size={10} className="shrink-0" />
                    {ref}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {entry.dependencies && entry.dependencies.length > 0 && (
            <div className="panel">
              <div className="panel-header">DEPENDENCIES</div>
              <div className="p-3 font-mono text-xs text-terminal-gray space-y-1">
                {entry.dependencies.map((dep) => (
                  <Link key={dep} to={`/knowledge/${dep}`} className="block hover:text-neon-red transition-colors truncate">
                    → {dep}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetaItem({ icon, label, value }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1 font-mono text-xs text-terminal-gray">
        {icon} {label}
      </div>
      <div className="font-mono text-xs text-white">{value}</div>
    </div>
  )
}

function SkillStars({ level }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={11} className={i <= level ? 'text-neon-red fill-neon-red' : 'text-terminal-dimgray'} />
      ))}
    </div>
  )
}
