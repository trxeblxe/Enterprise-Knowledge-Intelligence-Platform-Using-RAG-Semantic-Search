import time
from typing import List, Tuple
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import get_settings
from app.models.schemas import QueryRequest, QueryResponse, SourceCitation
from app.services.vector_store_service import VectorStoreService

settings = get_settings()

class RAGService:
    def __init__(self, vector_store: VectorStoreService):
        self.vector_store = vector_store
        
        self.system_prompt = (
            "You are an expert enterprise knowledge assistant. Answer questions\n"
            "using ONLY the provided document context. Cite which document your\n"
            "answer comes from. If context is insufficient, say so clearly.\n"
            "Do NOT use training knowledge to fill gaps."
        )
        
        self.llm = self._build_llm()
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt + "\n\nContext:\n{context}"),
            ("human", "{question}")
        ])
        
        self.chain = prompt | self.llm | StrOutputParser()

    async def query(self, request: QueryRequest) -> QueryResponse:
        start_time = time.time()
        
        top_k = request.top_k or settings.top_k_results
        chunks = self.vector_store.similarity_search(request.question, top_k, request.filter_doc_id)
        
        context_str, sources = self._build_context(chunks)
        
        if not chunks:
            answer = "No relevant documents found. I cannot answer your question."
        else:
            answer = await self.chain.ainvoke({
                "context": context_str,
                "question": request.question
            })
            
        elapsed_ms = (time.time() - start_time) * 1000
        
        return QueryResponse(
            question=request.question,
            answer=answer,
            sources=sources,
            total_sources_found=len(sources),
            model_used=f"{settings.llm_provider}/{settings.llm_model}",
            processing_time_ms=elapsed_ms
        )

    def _build_context(self, chunks: List[dict]) -> Tuple[str, List[SourceCitation]]:
        context_parts = []
        sources = []
        
        for i, chunk in enumerate(chunks):
            source_num = i + 1
            filename = chunk.get("filename", "Unknown")
            page = chunk.get("source_page", 1)
            text = chunk.get("text", "")
            
            context_parts.append(f"[Source {source_num}: {filename}, Page {page}]\n{text}")
            
            excerpt = text[:300] + "..." if len(text) > 300 else text
            score = chunk.get("score", 0.0)
            percentage = round(score * 100, 2)
            
            sources.append(
                SourceCitation(
                    doc_id=chunk.get("doc_id", ""),
                    filename=filename,
                    chunk_index=chunk.get("chunk_index", 0),
                    relevance_score=percentage,
                    excerpt=excerpt,
                    page_number=page
                )
            )
            
        context_str = "\n\n---\n\n".join(context_parts)
        return context_str, sources

    def _build_llm(self):
        if settings.llm_provider.lower() == "gemini":
            return ChatGoogleGenerativeAI(
                model=settings.llm_model,
                temperature=settings.temperature,
                max_tokens=settings.max_tokens,
                google_api_key=settings.gemini_api_key
            )
        elif settings.llm_provider.lower() == "anthropic":
            return ChatAnthropic(
                model=settings.llm_model,
                temperature=settings.temperature,
                max_tokens=settings.max_tokens,
                anthropic_api_key=settings.anthropic_api_key
            )
        else:
            return ChatOpenAI(
                model=settings.llm_model,
                temperature=settings.temperature,
                max_tokens=settings.max_tokens,
                openai_api_key=settings.openai_api_key
            )
