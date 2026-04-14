import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

export async function submitQuery(question, topK = 5) {
  const { data } = await api.post('/api/v1/query/', {
    question,
    top_k: topK,
  });

  const sources = (data.sources || []).map((s, i) => ({
    id: i,
    text: s.excerpt || '',
    score: s.relevance_score ?? 0,
    document: s.filename || 'Unknown',
    chunkIndex: s.chunk_index ?? 0,
    page: s.page_number ?? null,
    docId: s.doc_id || '',
  }));

  const avgScore = sources.length
    ? sources.reduce((sum, s) => sum + s.score, 0) / sources.length
    : 0;

  return {
    answer: data.answer || '',
    confidence: Math.min(avgScore, 100),
    sources,
    processingTime: data.processing_time_ms || 0,
    modelUsed: data.model_used || '',
    question: data.question || question,
  };
}

export async function getDocuments() {
  const { data } = await api.get('/api/v1/documents/');
  return data;
}

export async function getHealth() {
  const { data } = await api.get('/api/v1/query/health');
  return data;
}

export default api;
