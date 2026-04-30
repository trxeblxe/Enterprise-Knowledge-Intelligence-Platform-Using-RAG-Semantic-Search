import axios from 'axios';

// Use same-origin requests by default so Vite proxy handles backend routing.
// This avoids CORS issues when frontend runs on localhost, 127.0.0.1, or LAN IP.
const API_BASE = import.meta.env.VITE_API_URL?.trim() || '';

const api = axios.create({
  baseURL: API_BASE,
  // 120 seconds – Gemini/OpenAI calls can take time on first request
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

// Global response interceptor to give meaningful error messages
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject(
        new Error('Request timed out. The AI model is taking too long — please try again.')
      );
    }
    if (!error.response) {
      return Promise.reject(
        new Error('Cannot connect to the backend. Make sure both frontend and backend servers are running.')
      );
    }
    // Surface the backend's detail message
    const detail = error.response?.data?.detail;
    if (detail) {
      return Promise.reject(new Error(detail));
    }
    return Promise.reject(error);
  }
);

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

/**
 * Upload a document file (PDF, DOCX, TXT) to the backend for ingestion.
 * Uses FormData so the server receives it as a multipart file upload.
 *
 * @param {File}     file           - The file object from an <input> or drop event.
 * @param {Function} onProgress     - Optional callback receiving upload percentage (0-100).
 * @returns {Promise<Object>}       - The backend's UploadResponse JSON.
 */
export async function uploadDocument(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post('/api/v1/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    // Axios progress tracking
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        const pct = Math.round((evt.loaded / evt.total) * 100);
        onProgress(pct);
      }
    },
  });
  return data;
}

export default api;
