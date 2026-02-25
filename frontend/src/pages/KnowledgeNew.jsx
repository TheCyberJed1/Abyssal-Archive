import KnowledgeEditor from '../components/knowledge/KnowledgeEditor'

export default function KnowledgeNew() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-mono text-xl font-bold text-white">
          <span className="text-neon-red">$</span> NEW ENTRY
        </h1>
        <p className="font-mono text-xs text-terminal-gray mt-1">
          Create a new knowledge entry. Use the AI auto-tagger for automatic classification.
        </p>
      </div>

      <KnowledgeEditor />
    </div>
  )
}
