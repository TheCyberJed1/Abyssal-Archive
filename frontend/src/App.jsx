import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import KnowledgePage from './pages/KnowledgePage'
import KnowledgeDetail from './pages/KnowledgeDetail'
import KnowledgeNew from './pages/KnowledgeNew'
import GraphPage from './pages/GraphPage'
import ArchivistPage from './pages/ArchivistPage'
import IngestPage from './pages/IngestPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="scanline-overlay" />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="knowledge" element={<KnowledgePage />} />
          <Route path="knowledge/new" element={<KnowledgeNew />} />
          <Route path="knowledge/:id" element={<KnowledgeDetail />} />
          <Route path="graph" element={<GraphPage />} />
          <Route path="archivist" element={<ArchivistPage />} />
          <Route path="ingest" element={<IngestPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
