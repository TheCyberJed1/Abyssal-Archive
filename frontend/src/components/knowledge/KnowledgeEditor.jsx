import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, X, Wand2, Plus, Trash2 } from 'lucide-react'
import { api } from '../../api/client'

const KNOWLEDGE_TYPES = [
  'recon', 'exploit', 'post-exploitation', 'tool', 'payload',
  'writeup', 'poc', 'zero-day', 'case-study', 'mitre-technique',
]

const DEFAULT_FORM = {
  title: '',
  content: '',
  summary: '',
  knowledge_type: 'writeup',
  phase: '',
  skill_level: 1,
  confidence_rating: 1.0,
  author: '',
  tags: [],
  references: [],
  mitre_techniques: [],
  mitre_tactics: [],
}

export default function KnowledgeEditor({ initial = {}, onSave, isEdit = false }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ ...DEFAULT_FORM, ...initial })
  const [tagInput, setTagInput] = useState('')
  const [mitreInput, setMitreInput] = useState('')
  const [refInput, setRefInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [autoTagging, setAutoTagging] = useState(false)
  const [error, setError] = useState(null)

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      set('tags', [...form.tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const addMitre = () => {
    const t = mitreInput.trim().toUpperCase()
    if (t && !form.mitre_techniques.includes(t)) {
      set('mitre_techniques', [...form.mitre_techniques, t])
      setMitreInput('')
    }
  }

  const addRef = () => {
    if (refInput.trim() && !form.references.includes(refInput.trim())) {
      set('references', [...form.references, refInput.trim()])
      setRefInput('')
    }
  }

  const handleAutoTag = async () => {
    if (!form.content) return
    setAutoTagging(true)
    try {
      const result = await api.archivist.autoTag(form.content)
      set('tags', [...new Set([...form.tags, ...result.tags])])
      set('mitre_techniques', [...new Set([...form.mitre_techniques, ...result.mitre_techniques])])
      set('mitre_tactics', result.mitre_tactics || form.mitre_tactics)
      if (!form.summary && result.summary) set('summary', result.summary)
      if (result.knowledge_type && !isEdit) set('knowledge_type', result.knowledge_type)
    } catch (err) {
      setError('Auto-tag failed: ' + err.message)
    } finally {
      setAutoTagging(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...form,
        skill_level: parseInt(form.skill_level),
        confidence_rating: parseFloat(form.confidence_rating),
      }
      if (onSave) {
        await onSave(payload)
      } else {
        await api.knowledge.create(payload)
        navigate('/knowledge')
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="panel border-neon-red bg-red-950/20 p-3 font-mono text-sm text-neon-red">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <label className="font-mono text-xs text-terminal-gray uppercase tracking-wider">Title *</label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Entry title..."
          className="input-field"
        />
      </div>

      {/* Type + Phase row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="font-mono text-xs text-terminal-gray uppercase tracking-wider">Type *</label>
          <select
            required
            value={form.knowledge_type}
            onChange={(e) => set('knowledge_type', e.target.value)}
            className="input-field"
          >
            {KNOWLEDGE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="font-mono text-xs text-terminal-gray uppercase tracking-wider">Phase</label>
          <input
            type="text"
            value={form.phase}
            onChange={(e) => set('phase', e.target.value)}
            placeholder="e.g. Initial Access"
            className="input-field"
          />
        </div>
      </div>

      {/* Skill + Confidence row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="font-mono text-xs text-terminal-gray uppercase tracking-wider">
            Skill Level: <span className="text-neon-red">{form.skill_level}/5</span>
          </label>
          <input
            type="range" min="1" max="5" step="1"
            value={form.skill_level}
            onChange={(e) => set('skill_level', e.target.value)}
            className="w-full accent-red-500"
          />
        </div>
        <div className="space-y-1.5">
          <label className="font-mono text-xs text-terminal-gray uppercase tracking-wider">
            Confidence: <span className="text-neon-red">{parseFloat(form.confidence_rating).toFixed(1)}/5.0</span>
          </label>
          <input
            type="range" min="0" max="5" step="0.1"
            value={form.confidence_rating}
            onChange={(e) => set('confidence_rating', e.target.value)}
            className="w-full accent-red-500"
          />
        </div>
      </div>

      {/* Author */}
      <div className="space-y-1.5">
        <label className="font-mono text-xs text-terminal-gray uppercase tracking-wider">Author</label>
        <input
          type="text"
          value={form.author}
          onChange={(e) => set('author', e.target.value)}
          placeholder="Handle or name..."
          className="input-field"
        />
      </div>

      {/* Content */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="font-mono text-xs text-terminal-gray uppercase tracking-wider">Content * (Markdown)</label>
          <button
            type="button"
            onClick={handleAutoTag}
            disabled={autoTagging || !form.content}
            className="btn-ghost h-7 px-3 text-xs flex items-center gap-1.5 disabled:opacity-40"
          >
            <Wand2 size={12} />
            {autoTagging ? 'Analyzing...' : 'Auto-Tag via AI'}
          </button>
        </div>
        <textarea
          required
          value={form.content}
          onChange={(e) => set('content', e.target.value)}
          placeholder="Write in Markdown... # Title\n\n## Description\n\n```bash\ncommand here\n```"
          rows={12}
          className="input-field font-mono text-xs leading-relaxed"
        />
      </div>

      {/* Summary */}
      <div className="space-y-1.5">
        <label className="font-mono text-xs text-terminal-gray uppercase tracking-wider">Summary</label>
        <textarea
          value={form.summary}
          onChange={(e) => set('summary', e.target.value)}
          placeholder="Brief technical summary..."
          rows={3}
          className="input-field text-sm"
        />
      </div>

      {/* Tags */}
      <ArrayField
        label="Tags"
        items={form.tags}
        onRemove={(i) => set('tags', form.tags.filter((_, idx) => idx !== i))}
        input={tagInput}
        onInputChange={setTagInput}
        onAdd={addTag}
        placeholder="Add tag..."
        inputKey="Enter"
      />

      {/* MITRE Techniques */}
      <ArrayField
        label="MITRE ATT&CK Techniques"
        items={form.mitre_techniques}
        onRemove={(i) => set('mitre_techniques', form.mitre_techniques.filter((_, idx) => idx !== i))}
        input={mitreInput}
        onInputChange={setMitreInput}
        onAdd={addMitre}
        placeholder="e.g. T1003"
        tagClass="tag-red"
      />

      {/* References */}
      <ArrayField
        label="References"
        items={form.references}
        onRemove={(i) => set('references', form.references.filter((_, idx) => idx !== i))}
        input={refInput}
        onInputChange={setRefInput}
        onAdd={addRef}
        placeholder="https://..."
      />

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-abyss-border">
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
          <Save size={14} />
          {saving ? 'Saving...' : (isEdit ? 'Update Entry' : 'Create Entry')}
        </button>
        <button type="button" onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2">
          <X size={14} />
          Cancel
        </button>
      </div>
    </form>
  )
}

function ArrayField({ label, items, onRemove, input, onInputChange, onAdd, placeholder, tagClass = 'tag' }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onAdd()
    }
  }

  return (
    <div className="space-y-2">
      <label className="font-mono text-xs text-terminal-gray uppercase tracking-wider">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="input-field flex-1 h-8 text-xs"
        />
        <button type="button" onClick={onAdd} className="btn-ghost h-8 px-3">
          <Plus size={14} />
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <span key={i} className={`${tagClass} flex items-center gap-1`}>
              {item}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="hover:text-neon-red transition-colors"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
