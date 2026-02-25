import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Download, Globe, FileText, Loader2, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'
import { api } from '../api/client'

export default function IngestPage() {
  const [form, setForm] = useState({ source_url: '', source_text: '', knowledge_type: '' })
  const [jobs, setJobs] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [inputMode, setInputMode] = useState('url') // 'url' | 'text'

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchJobs = async () => {
    try {
      const data = await api.ingest.listJobs()
      setJobs(data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const payload = { knowledge_type: form.knowledge_type || undefined }
      if (inputMode === 'url') payload.source_url = form.source_url
      else payload.source_text = form.source_text

      const job = await api.ingest.submit(payload)
      setSuccess(`Job ${job.id} submitted. Processing in background.`)
      setForm({ source_url: '', source_text: '', knowledge_type: '' })
      fetchJobs()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const KNOWLEDGE_TYPES = [
    'recon', 'exploit', 'post-exploitation', 'tool', 'payload',
    'writeup', 'poc', 'zero-day', 'case-study', 'mitre-technique',
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-xl font-bold text-white">
          <span className="text-neon-red">$</span> INGEST PIPELINE
        </h1>
        <p className="font-mono text-xs text-terminal-gray mt-1">
          Automated content ingestion with AI summarization, tagging, and MITRE mapping
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingest Form */}
        <div className="panel">
          <div className="panel-header">
            <Download size={12} className="inline mr-2" />
            SUBMIT CONTENT
          </div>
          <div className="p-4 space-y-4">
            {error && (
              <div className="bg-red-950/20 border border-neon-redDim rounded p-3 font-mono text-xs text-neon-red">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-950/20 border border-green-800 rounded p-3 font-mono text-xs text-terminal-green">
                {success}
              </div>
            )}

            {/* Mode Toggle */}
            <div className="flex items-center gap-1 bg-abyss-bg border border-abyss-border rounded p-1">
              <button
                onClick={() => setInputMode('url')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded font-mono text-xs transition-all
                  ${inputMode === 'url' ? 'bg-neon-redGlow text-neon-red border border-neon-redDim' : 'text-terminal-gray'}`}
              >
                <Globe size={12} /> URL
              </button>
              <button
                onClick={() => setInputMode('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded font-mono text-xs transition-all
                  ${inputMode === 'text' ? 'bg-neon-redGlow text-neon-red border border-neon-redDim' : 'text-terminal-gray'}`}
              >
                <FileText size={12} /> Raw Text
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {inputMode === 'url' ? (
                <div className="space-y-1.5">
                  <label className="font-mono text-xs text-terminal-gray uppercase tracking-wider">Source URL</label>
                  <input
                    type="url"
                    required
                    value={form.source_url}
                    onChange={(e) => setForm((f) => ({ ...f, source_url: e.target.value }))}
                    placeholder="https://example.com/technique..."
                    className="input-field"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="font-mono text-xs text-terminal-gray uppercase tracking-wider">Raw Content</label>
                  <textarea
                    required
                    value={form.source_text}
                    onChange={(e) => setForm((f) => ({ ...f, source_text: e.target.value }))}
                    placeholder="Paste raw text, notes, or technical content here..."
                    rows={8}
                    className="input-field font-mono text-xs"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-mono text-xs text-terminal-gray uppercase tracking-wider">
                  Knowledge Type <span className="text-terminal-dimgray">(optional, AI will detect)</span>
                </label>
                <select
                  value={form.knowledge_type}
                  onChange={(e) => setForm((f) => ({ ...f, knowledge_type: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Auto-detect</option>
                  {KNOWLEDGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {submitting ? 'Submitting...' : 'Submit for Ingestion'}
              </button>
            </form>

            <div className="font-mono text-xs text-terminal-gray space-y-1 border-t border-abyss-border pt-3">
              <div className="text-white mb-1">PIPELINE STAGES:</div>
              {['Fetch & Clean Content', 'AI Summarization', 'Tag Extraction', 'MITRE Mapping', 'Vector Embedding', 'DB Insertion'].map((stage, i) => (
                <div key={stage} className="flex items-center gap-2">
                  <span className="text-neon-red">{i + 1}.</span>
                  <span>{stage}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="panel">
          <div className="panel-header flex items-center justify-between">
            <span>INGEST JOBS</span>
            <button onClick={fetchJobs} className="text-terminal-gray hover:text-neon-red transition-colors">
              <RefreshCw size={12} />
            </button>
          </div>
          <div className="divide-y divide-abyss-border max-h-[600px] overflow-y-auto">
            {jobs.length === 0 ? (
              <div className="p-8 text-center font-mono text-sm text-terminal-gray">
                No jobs yet
              </div>
            ) : (
              jobs.map((job) => <JobRow key={job.id} job={job} />)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function JobRow({ job }) {
  const statusConfig = {
    pending: { icon: <Clock size={14} />, color: 'text-terminal-gray' },
    processing: { icon: <Loader2 size={14} className="animate-spin" />, color: 'text-terminal-cyan' },
    completed: { icon: <CheckCircle size={14} />, color: 'text-terminal-green' },
    failed: { icon: <XCircle size={14} />, color: 'text-neon-red' },
  }

  const config = statusConfig[job.status] || statusConfig.pending

  return (
    <div className="px-4 py-3 space-y-1">
      <div className="flex items-center gap-2">
        <span className={config.color}>{config.icon}</span>
        <span className={`font-mono text-xs font-medium uppercase ${config.color}`}>{job.status}</span>
        <span className="font-mono text-xs text-terminal-dimgray ml-auto">
          {new Date(job.created_at).toLocaleString()}
        </span>
      </div>
      {job.source_url && (
        <div className="font-mono text-xs text-terminal-gray truncate pl-5">{job.source_url}</div>
      )}
      {job.error && (
        <div className="font-mono text-xs text-neon-red pl-5">{job.error}</div>
      )}
      {job.result_entry_id && (
        <div className="pl-5">
          <Link
            to={`/knowledge/${job.result_entry_id}`}
            className="font-mono text-xs text-terminal-cyan hover:text-neon-red transition-colors"
          >
            → View Entry
          </Link>
        </div>
      )}
    </div>
  )
}
