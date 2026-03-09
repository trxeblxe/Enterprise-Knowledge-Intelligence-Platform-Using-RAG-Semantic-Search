import os
import uuid
import io
from typing import List, Tuple, Dict
from datetime import datetime
from pypdf import PdfReader
from docx import Document as DocxDocument
from langchain.text_splitter import RecursiveCharacterTextSplitter
from app.core.config import get_settings
from app.models.schemas import UploadResponse, DocumentMetadata, DocumentInfo
from app.services.vector_store_service import VectorStoreService

settings = get_settings()

class DocumentService:
    def __init__(self, vector_store: VectorStoreService):
        self.vector_store = vector_store
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        self._documents: Dict[str, DocumentInfo] = {}
        # Simple scan on existing vectors to populate self._documents
        self._init_documents_from_vector_store()

    def _init_documents_from_vector_store(self):
        for idx, meta in self.vector_store._metadata.items():
            doc_id = meta.get("doc_id")
            if doc_id and doc_id not in self._documents:
                self._documents[doc_id] = DocumentInfo(
                    doc_id=doc_id,
                    filename=meta.get("filename", "Unknown"),
                    file_type=meta.get("file_type", "txt"),
                    total_chunks=meta.get("total_chunks", 0),
                    upload_time=meta.get("upload_time", datetime.utcnow().isoformat()),
                    status="indexed"
                )

    async def ingest_document(self, file_bytes: bytes, filename: str) -> UploadResponse:
        doc_id = str(uuid.uuid4())
        
        ext = filename.lower().split('.')[-1]
        file_type = "txt"
        if ext == "pdf":
            file_type = "pdf"
        elif ext in ["docx", "doc"]:
            file_type = "docx"
            
        pages = self._parse_document(file_bytes, file_type)
        if not pages:
            return UploadResponse(
                success=False,
                doc_id=doc_id,
                filename=filename,
                chunks_created=0,
                message="No text could be extracted from the document."
            )
            
        chunks = self._chunk_pages(pages)
        if not chunks:
            return UploadResponse(
                success=False,
                doc_id=doc_id,
                filename=filename,
                chunks_created=0,
                message="Document could not be chunked."
            )
            
        upload_time = datetime.utcnow().isoformat()
        
        texts = []
        metadatas = []
        
        total_chunks = len(chunks)
        for i, (chunk_text, page_number) in enumerate(chunks):
            meta = DocumentMetadata(
                doc_id=doc_id,
                filename=filename,
                file_type=file_type,
                chunk_index=i,
                total_chunks=total_chunks,
                upload_time=upload_time,
                source_page=page_number
            )
            texts.append(chunk_text)
            meta_dict = meta.model_dump()
            meta_dict["text"] = chunk_text
            metadatas.append(meta_dict)
            
        self.vector_store.add_documents(texts, metadatas)
        
        doc_info = DocumentInfo(
            doc_id=doc_id,
            filename=filename,
            file_type=file_type,
            total_chunks=total_chunks,
            upload_time=upload_time,
            status="indexed"
        )
        self._documents[doc_id] = doc_info
        
        return UploadResponse(
            success=True,
            doc_id=doc_id,
            filename=filename,
            chunks_created=total_chunks,
            message="Document successfully ingested and indexed."
        )

    def get_all_documents(self) -> List[DocumentInfo]:
        return list(self._documents.values())

    def get_document(self, doc_id: str) -> DocumentInfo:
        return self._documents.get(doc_id)

    def delete_document(self, doc_id: str) -> bool:
        if doc_id in self._documents:
            self.vector_store.delete_by_doc_id(doc_id)
            del self._documents[doc_id]
            return True
        return False

    def _parse_document(self, file_bytes: bytes, file_type: str) -> List[Tuple[str, int]]:
        if file_type == "pdf":
            return self._parse_pdf(file_bytes)
        elif file_type == "docx":
            return self._parse_docx(file_bytes)
        else:
            return self._parse_txt(file_bytes)

    def _parse_pdf(self, file_bytes: bytes) -> List[Tuple[str, int]]:
        reader = PdfReader(io.BytesIO(file_bytes))
        pages = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text and text.strip():
                pages.append((text.strip(), i + 1))
        return pages

    def _parse_docx(self, file_bytes: bytes) -> List[Tuple[str, int]]:
        doc = DocxDocument(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text and p.text.strip()]
        text = "\n\n".join(paragraphs)
        if text:
            return [(text, 1)]
        return []

    def _parse_txt(self, file_bytes: bytes) -> List[Tuple[str, int]]:
        try:
            text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            text = file_bytes.decode("latin-1")
            
        if text and text.strip():
            return [(text.strip(), 1)]
        return []

    def _chunk_pages(self, pages: List[Tuple[str, int]]) -> List[Tuple[str, int]]:
        chunks = []
        for text, page_num in pages:
            page_chunks = self.text_splitter.split_text(text)
            for chunk in page_chunks:
                chunks.append((chunk, page_num))
        return chunks
