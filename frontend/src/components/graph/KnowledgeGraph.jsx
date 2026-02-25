import { useEffect, useRef, useState } from 'react'
import CytoscapeComponent from 'react-cytoscapejs'
import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react'

const TYPE_COLORS = {
  recon: '#00d4ff',
  exploit: '#ff0040',
  'post-exploitation': '#ff6400',
  tool: '#64ff64',
  payload: '#c800ff',
  writeup: '#ffff00',
  poc: '#ff9600',
  'zero-day': '#ff4444',
  'case-study': '#00ffc8',
  'mitre-technique': '#9696ff',
  default: '#888888',
}

const EDGE_COLORS = {
  dependency: '#ff0040',
  related: '#00d4ff',
  mitre_chain: '#9696ff',
}

export default function KnowledgeGraph({ graphData, onNodeClick }) {
  const cyRef = useRef(null)
  const [selectedNode, setSelectedNode] = useState(null)

  const elements = buildElements(graphData)

  const stylesheet = [
    {
      selector: 'node',
      style: {
        'background-color': 'data(color)',
        'border-width': 2,
        'border-color': 'data(color)',
        'border-opacity': 0.6,
        label: 'data(label)',
        'font-family': 'JetBrains Mono, monospace',
        'font-size': 10,
        color: '#e2e8f0',
        'text-valign': 'bottom',
        'text-margin-y': 5,
        'text-max-width': 100,
        'text-wrap': 'ellipsis',
        width: 30,
        height: 30,
        'background-opacity': 0.8,
        'overlay-opacity': 0,
      },
    },
    {
      selector: 'node:selected',
      style: {
        'border-width': 3,
        'border-color': '#ff0040',
        'border-opacity': 1,
        'background-opacity': 1,
        'box-shadow': '0 0 20px rgba(255,0,64,0.8)',
      },
    },
    {
      selector: 'node[type = "mitre-technique"]',
      style: {
        shape: 'diamond',
        width: 20,
        height: 20,
      },
    },
    {
      selector: 'edge',
      style: {
        width: 1.5,
        'line-color': 'data(color)',
        'target-arrow-color': 'data(color)',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        opacity: 0.6,
        'arrow-scale': 0.8,
      },
    },
    {
      selector: 'edge:selected',
      style: {
        width: 2.5,
        opacity: 1,
      },
    },
  ]

  const layout = {
    name: 'cose',
    animate: true,
    animationDuration: 500,
    nodeRepulsion: 8000,
    idealEdgeLength: 100,
    edgeElasticity: 100,
    numIter: 1000,
    coolingFactor: 0.95,
    randomize: false,
    fit: true,
    padding: 30,
  }

  useEffect(() => {
    if (cyRef.current) {
      cyRef.current.on('tap', 'node', (evt) => {
        const node = evt.target
        setSelectedNode(node.data())
        if (onNodeClick) onNodeClick(node.data())
      })
    }
  }, [])

  const handleFit = () => cyRef.current?.fit()
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.3)
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.7)
  const handleReset = () => {
    cyRef.current?.reset()
    cyRef.current?.fit()
  }

  if (elements.length === 0) {
    return (
      <div className="panel flex items-center justify-center h-96">
        <div className="text-center font-mono text-sm text-terminal-gray">
          <div className="text-3xl mb-3 text-neon-red">⬡</div>
          <div>No graph data available</div>
          <div className="text-xs mt-1">Add knowledge entries to visualize relationships</div>
        </div>
      </div>
    )
  }

  return (
    <div className="panel relative overflow-hidden" style={{ height: '600px' }}>
      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        <button onClick={handleZoomIn} className="btn-ghost w-8 h-8 p-0 flex items-center justify-center">
          <ZoomIn size={14} />
        </button>
        <button onClick={handleZoomOut} className="btn-ghost w-8 h-8 p-0 flex items-center justify-center">
          <ZoomOut size={14} />
        </button>
        <button onClick={handleFit} className="btn-ghost w-8 h-8 p-0 flex items-center justify-center">
          <Maximize2 size={14} />
        </button>
        <button onClick={handleReset} className="btn-ghost w-8 h-8 p-0 flex items-center justify-center">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 panel p-3 space-y-1">
        <div className="font-mono text-xs text-terminal-gray mb-2">EDGE TYPES</div>
        {Object.entries(EDGE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2 font-mono text-xs">
            <div className="w-6 h-0.5 rounded" style={{ backgroundColor: color }} />
            <span className="text-terminal-gray">{type.replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      {/* Selected node info */}
      {selectedNode && (
        <div className="absolute top-3 left-3 z-10 panel p-3 max-w-xs">
          <div className="font-mono text-xs text-terminal-gray mb-1">SELECTED NODE</div>
          <div className="font-mono text-sm text-white">{selectedNode.label}</div>
          <div className={`badge-type type-${selectedNode.type} mt-1`}>{selectedNode.type}</div>
        </div>
      )}

      <CytoscapeComponent
        cy={(cy) => { cyRef.current = cy }}
        elements={elements}
        stylesheet={stylesheet}
        layout={layout}
        style={{ width: '100%', height: '100%', background: '#0a0a0f' }}
        zoomingEnabled
        userZoomingEnabled
        panningEnabled
        userPanningEnabled
        boxSelectionEnabled={false}
      />
    </div>
  )
}

function buildElements(graphData) {
  if (!graphData) return []

  const nodes = (graphData.nodes || []).map((node) => ({
    data: {
      id: node.id,
      label: node.label.length > 20 ? node.label.slice(0, 20) + '…' : node.label,
      fullLabel: node.label,
      type: node.knowledge_type,
      color: TYPE_COLORS[node.knowledge_type] || TYPE_COLORS.default,
      skillLevel: node.skill_level,
    },
  }))

  const nodeIds = new Set(nodes.map((n) => n.data.id))
  const edges = (graphData.edges || [])
    .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
    .map((edge) => ({
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        relationship: edge.relationship,
        color: EDGE_COLORS[edge.relationship] || '#888888',
      },
    }))

  return [...nodes, ...edges]
}
