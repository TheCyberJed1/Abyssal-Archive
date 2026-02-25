import ArchivistPanel from '../components/archivist/ArchivistPanel'
import { useState } from 'react'
import { api } from '../api/client'
import { Loader2 } from 'lucide-react'

export default function ArchivistPage() {
  const [gapInput, setGapInput] = useState('')
  const [gapResult, setGapResult] = useState(null)
  const [gapLoading, setGapLoading] = useState(false)

  const handleSkillGap = async (e) => {
    e.preventDefault()
    const techniques = gapInput.split(/[\s,]+/).filter(Boolean).map((t) => t.toUpperCase())
    if (!techniques.length) return
    setGapLoading(true)
    try {
      const result = await api.archivist.skillGap(techniques)
      setGapResult(result)
    } catch (err) {
      console.error(err)
    } finally {
      setGapLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-xl font-bold text-white">
          <span className="text-neon-red">$</span> THE ARCHIVIST
        </h1>
        <p className="font-mono text-xs text-terminal-gray mt-1">
          AI-powered intelligence layer. Context-aware. Fully local. Powered by Ollama.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Panel */}
        <div className="lg:col-span-2" style={{ height: '600px' }}>
          <ArchivistPanel />
        </div>

        {/* Skill Gap Analysis */}
        <div className="space-y-4">
          <div className="panel">
            <div className="panel-header">SKILL GAP ANALYSIS</div>
            <div className="p-4 space-y-3">
              <p className="font-mono text-xs text-terminal-gray">
                Enter target MITRE ATT&CK techniques (comma or space separated) to identify coverage gaps.
              </p>
              <form onSubmit={handleSkillGap} className="space-y-2">
                <textarea
                  value={gapInput}
                  onChange={(e) => setGapInput(e.target.value)}
                  placeholder="T1003, T1078, T1566..."
                  rows={4}
                  className="input-field text-xs font-mono"
                />
                <button
                  type="submit"
                  disabled={gapLoading || !gapInput.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {gapLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                  Analyze Gaps
                </button>
              </form>
            </div>
          </div>

          {gapResult && (
            <div className="panel">
              <div className="panel-header">GAP ANALYSIS RESULT</div>
              <div className="p-4 space-y-4 font-mono text-xs">
                <div>
                  <div className="text-terminal-green mb-1.5">✓ COVERED ({gapResult.covered.length})</div>
                  <div className="flex flex-wrap gap-1">
                    {gapResult.covered.map((t) => (
                      <span key={t} className="tag" style={{ color: '#64ff64', borderColor: 'rgba(100,255,100,0.3)' }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-neon-red mb-1.5">✗ GAPS ({gapResult.gaps.length})</div>
                  <div className="flex flex-wrap gap-1">
                    {gapResult.gaps.map((t) => (
                      <span key={t} className="tag-red tag">{t}</span>
                    ))}
                  </div>
                </div>
                {gapResult.recommendations.length > 0 && (
                  <div>
                    <div className="text-terminal-cyan mb-1.5">→ RECOMMENDATIONS</div>
                    <ul className="space-y-1 text-terminal-gray">
                      {gapResult.recommendations.map((rec, i) => (
                        <li key={i} className="leading-relaxed">
                          <span className="text-neon-red">{i + 1}.</span> {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
