import { useState, useRef, useEffect } from 'react'
import { Bot, Send, X, Wand2, BarChart3, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api } from '../../api/client'

export default function ArchivistPanel({ contextEntryId }) {
  const [messages, setMessages] = useState([
    {
      role: 'archivist',
      content: 'ARCHIVIST ONLINE. I am the intelligence layer of this archive. Ask me anything about offensive techniques, MITRE mappings, or how to fill your skill gaps. I also accept raw notes for structuring.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scroll = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

  useEffect(scroll, [messages])

  const sendMessage = async (e) => {
    e?.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = { role: 'user', content: input }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)

    try {
      const data = await api.archivist.chat({
        message: input,
        context_entry_id: contextEntryId || undefined,
      })
      setMessages((m) => [...m, { role: 'archivist', content: data.reply }])
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: 'error',
          content: `Connection failed: ${err.message}. Ensure Ollama is running locally.`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => setMessages([{
    role: 'archivist',
    content: 'ARCHIVIST RESET. Memory cleared. How can I assist your operations?',
  }])

  return (
    <div className="panel flex flex-col h-full" style={{ minHeight: '500px' }}>
      {/* Header */}
      <div className="panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={14} className="text-neon-red" />
          THE ARCHIVIST // AI ASSISTANT
          <span className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse" />
        </div>
        <button onClick={clearChat} className="text-terminal-gray hover:text-neon-red transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 p-3 border-b border-abyss-border flex-wrap">
        <QuickAction
          icon={<Wand2 size={12} />}
          label="Suggest attack chain"
          onClick={() => setInput('Suggest a typical attack chain for initial access to domain admin in a Windows environment')}
        />
        <QuickAction
          icon={<BarChart3 size={12} />}
          label="MITRE coverage review"
          onClick={() => setInput('What are the most critical MITRE ATT&CK techniques I should document for red team operations?')}
        />
        <QuickAction
          icon={<FileText size={12} />}
          label="Structure my notes"
          onClick={() => setInput('I have some raw notes I need to structure into a knowledge entry. Ready to paste them.')}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {loading && (
          <div className="flex items-center gap-2 font-mono text-xs text-terminal-gray">
            <Bot size={14} className="text-neon-red animate-pulse" />
            <span>PROCESSING</span>
            <span className="animate-pulse">...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 border-t border-abyss-border flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Query the Archivist..."
          disabled={loading}
          className="input-field flex-1 text-sm disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary h-9 w-9 flex items-center justify-center p-0 disabled:opacity-40"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  )
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const isError = message.role === 'error'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 mt-0.5
          ${isError ? 'bg-red-900' : 'bg-neon-redGlow border border-neon-redDim'}`}>
          <Bot size={14} className={isError ? 'text-red-400' : 'text-neon-red'} />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded p-3 font-mono text-xs leading-relaxed
          ${isUser
            ? 'bg-abyss-border text-white ml-auto'
            : isError
              ? 'bg-red-950/30 border border-red-800 text-red-400'
              : 'bg-abyss-surface border border-abyss-border text-gray-300'
          }`}
      >
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: ({ inline, children }) =>
                inline ? (
                  <code className="bg-abyss-bg px-1 py-0.5 rounded text-terminal-green">
                    {children}
                  </code>
                ) : (
                  <pre className="bg-abyss-bg p-2 rounded overflow-x-auto mt-2 mb-2">
                    <code className="text-terminal-green">{children}</code>
                  </pre>
                ),
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}

function QuickAction({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-abyss-border
                 font-mono text-xs text-terminal-gray hover:border-neon-redDim hover:text-neon-red
                 transition-all duration-200"
    >
      {icon}
      {label}
    </button>
  )
}
