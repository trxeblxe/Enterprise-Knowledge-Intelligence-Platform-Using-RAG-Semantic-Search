/**
 * DocumentUpload.jsx — Drag-and-drop file upload component.
 *
 * Allows users to upload PDF, DOCX, or TXT files to the backend
 * for ingestion into the vector store. Supports both drag-and-drop
 * and click-to-browse interactions.
 *
 * Design decisions:
 * - Uses FormData + Axios (not fetch) to match the existing API client pattern.
 * - Shows upload progress via Axios onUploadProgress callback.
 * - Accepts only the file types the backend supports (.pdf, .docx, .txt).
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';
import { uploadDocument } from '../api/client';

const ACCEPTED_TYPES = '.pdf,.docx,.doc,.txt';

export default function DocumentUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null); // { success, message }
  const fileRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;

    // Validate extension on the client side for fast feedback
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'doc', 'txt'].includes(ext)) {
      setResult({ success: false, message: `Unsupported file type: .${ext}` });
      return;
    }

    setUploading(true);
    setProgress(0);
    setResult(null);

    try {
      const data = await uploadDocument(file, (pct) => setProgress(pct));
      setResult({
        success: true,
        message: `${data.filename} uploaded — ${data.chunks_created} chunks indexed.`,
      });
    } catch (err) {
      setResult({
        success: false,
        message: err.message || 'Upload failed. Please try again.',
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, []);

  // ── Drag event handlers ──────────────────────────────────────────
  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      {/* Drop zone */}
      <div
        id="document-upload-dropzone"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`
          relative rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer
          transition-all duration-300
          ${isDragging
            ? 'border-sony-red bg-sony-red/10 scale-[1.02]'
            : 'border-sony-surface-light hover:border-sony-red/50 bg-sony-surface/30'}
        `}
      >
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={36} className="text-sony-red animate-spin" />
            <p className="text-sony-gray text-sm">Uploading & indexing…</p>
            {/* Progress bar */}
            <div className="w-full max-w-xs h-2 rounded-full bg-sony-surface-light overflow-hidden">
              <motion.div
                className="h-full bg-sony-red rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs text-sony-gray">{progress}%</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload size={36} className="text-sony-gray" />
            <p className="text-sony-white font-medium">
              Drop a file here or <span className="text-sony-red">browse</span>
            </p>
            <p className="text-sony-gray text-xs">
              Supports PDF, DOCX, and TXT — up to 50 MB
            </p>
          </div>
        )}
      </div>

      {/* Result feedback */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`
              mt-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm
              ${result.success
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                : 'bg-red-500/10 text-red-300 border border-red-500/30'}
            `}
          >
            {result.success ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertTriangle size={18} />
            )}
            <span className="flex-1">{result.message}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setResult(null);
              }}
              className="opacity-60 hover:opacity-100 cursor-pointer"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
