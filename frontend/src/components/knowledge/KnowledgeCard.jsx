import { Link } from 'react-router-dom'
import { Shield, ChevronRight, Star, Calendar, Tag } from 'lucide-react'

const TYPE_COLORS = {
  recon: 'type-recon',
  exploit: 'type-exploit',
  'post-exploitation': 'type-post-exploitation',
  tool: 'type-tool',
  payload: 'type-payload',
  writeup: 'type-writeup',
  poc: 'type-poc',
  'zero-day': 'type-zero-day',
  'case-study': 'type-case-study',
  'mitre-technique': 'type-mitre-technique',
}

export default function KnowledgeCard({ entry }) {
  const typeClass = TYPE_COLORS[entry.knowledge_type] || 'type-writeup'
  const date = new Date(entry.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  return (
    <Link
      to={`/knowledge/${entry.id}`}
      className="panel block hover:border-neon-redDim transition-all duration-200 group neon-border"
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-mono text-sm font-semibold text-white group-hover:text-neon-red transition-colors line-clamp-2 flex-1">
            {entry.title}
          </h3>
          <ChevronRight size={14} className="text-terminal-gray group-hover:text-neon-red shrink-0 mt-0.5 transition-colors" />
        </div>

        {/* Type + Skill */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge-type ${typeClass}`}>
            {entry.knowledge_type}
          </span>
          <SkillStars level={entry.skill_level} />
        </div>

        {/* Summary */}
        {entry.summary && (
          <p className="text-xs text-terminal-gray line-clamp-2 leading-relaxed">
            {entry.summary}
          </p>
        )}

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Tag size={10} className="text-terminal-dimgray shrink-0" />
            {entry.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="tag text-xs">{tag}</span>
            ))}
            {entry.tags.length > 4 && (
              <span className="text-xs text-terminal-dimgray">+{entry.tags.length - 4}</span>
            )}
          </div>
        )}

        {/* MITRE */}
        {entry.mitre_techniques && entry.mitre_techniques.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Shield size={10} className="text-terminal-dimgray shrink-0" />
            {entry.mitre_techniques.slice(0, 3).map((t) => (
              <span key={t} className="tag tag-red text-xs">{t}</span>
            ))}
            {entry.mitre_techniques.length > 3 && (
              <span className="text-xs text-neon-redDim">+{entry.mitre_techniques.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 text-xs text-terminal-dimgray font-mono pt-1 border-t border-abyss-border">
          <Calendar size={10} />
          <span>{date}</span>
          {entry.author && (
            <>
              <span className="text-abyss-border">|</span>
              <span>{entry.author}</span>
            </>
          )}
          <span className="ml-auto flex items-center gap-1">
            <Shield size={10} className="text-terminal-cyan" />
            <span className="text-terminal-cyan">{entry.confidence_rating?.toFixed(1)}</span>
          </span>
        </div>
      </div>
    </Link>
  )
}

function SkillStars({ level }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={10}
          className={i <= level ? 'text-neon-red fill-neon-red' : 'text-terminal-dimgray'}
        />
      ))}
    </div>
  )
}
