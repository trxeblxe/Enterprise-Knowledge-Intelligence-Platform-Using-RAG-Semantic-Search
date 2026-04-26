import time
import asyncio
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

# How long (seconds) to wait for the LLM before giving up
LLM_TIMEOUT_SECONDS = 90
GEMINI_FALLBACK_MODELS = [
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest",
]

class RAGService:
    def __init__(self, vector_store: VectorStoreService):
        self.vector_store = vector_store
        self._llm_init_error = None
        self.active_model = settings.llm_model
        
        self.system_prompt = (
            "You are an expert enterprise knowledge assistant. Answer questions\n"
            "using ONLY the provided document context. Cite which document your\n"
            "answer comes from. If context is insufficient, say so clearly.\n"
            "Do NOT use training knowledge to fill gaps."
        )
        
        try:
            self.llm = self._build_llm()
        except Exception as exc:
            self.llm = None
            self._llm_init_error = str(exc)
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt + "\n\nContext:\n{context}"),
            ("human", "{question}")
        ])
        
        self.chain = (prompt | self.llm | StrOutputParser()) if self.llm else None

    async def query(self, request: QueryRequest) -> QueryResponse:
        start_time = time.time()
        
        top_k = request.top_k or settings.top_k_results
        chunks = self.vector_store.similarity_search(request.question, top_k, request.filter_doc_id)
        
        context_str, sources = self._build_context(chunks)
        
        if not chunks:
            answer = "No relevant documents found. Please upload a document first, or try a different question."
        elif self.chain is None:
            answer = self._build_extractive_answer(chunks)
        else:
            try:
                answer = await asyncio.wait_for(
                    self.chain.ainvoke({
                        "context": context_str,
                        "question": request.question
                    }),
                    timeout=LLM_TIMEOUT_SECONDS
                )
            except asyncio.TimeoutError:
                raise RuntimeError(
                    f"The AI model took too long to respond (>{LLM_TIMEOUT_SECONDS}s). "
                    "Please try again or check your API key."
                )
            except Exception as llm_exc:
                # Surface the real error message so the frontend can display it
                error_msg = str(llm_exc)
                if self._should_try_gemini_fallback(error_msg):
                    retry_answer = await self._retry_with_gemini_fallback(context_str, request.question)
                    if retry_answer is not None:
                        answer = retry_answer
                    else:
                        answer = self._build_extractive_answer(chunks)
                else:
                    if "API_KEY" in error_msg.upper() or "api key" in error_msg.lower() or "api_key" in error_msg.lower():
                        answer = self._build_extractive_answer(chunks)
                    else:
                        answer = self._build_extractive_answer(chunks)
            
        elapsed_ms = (time.time() - start_time) * 1000
        
        return QueryResponse(
            question=request.question,
            answer=answer,
            sources=sources,
            total_sources_found=len(sources),
            model_used=f"{settings.llm_provider}/{self.active_model}",
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
        provider = settings.llm_provider.lower()
        if provider == "gemini":
            if not settings.gemini_api_key:
                raise RuntimeError(
                    "GEMINI_API_KEY is not set. Please add it to your backend/.env file."
                )
            return ChatGoogleGenerativeAI(
                model=self.active_model,
                temperature=settings.temperature,
                max_tokens=settings.max_tokens,
                google_api_key=settings.gemini_api_key,
                request_timeout=LLM_TIMEOUT_SECONDS,
            )
        elif provider == "anthropic":
            if not settings.anthropic_api_key:
                raise RuntimeError(
                    "ANTHROPIC_API_KEY is not set. Please add it to your backend/.env file."
                )
            return ChatAnthropic(
                model=settings.llm_model,
                temperature=settings.temperature,
                max_tokens=settings.max_tokens,
                anthropic_api_key=settings.anthropic_api_key,
                timeout=LLM_TIMEOUT_SECONDS,
            )
        else:
            if not settings.openai_api_key:
                raise RuntimeError(
                    "OPENAI_API_KEY is not set. Please add it to your backend/.env file."
                )
            return ChatOpenAI(
                model=settings.llm_model,
                temperature=settings.temperature,
                max_tokens=settings.max_tokens,
                openai_api_key=settings.openai_api_key,
                request_timeout=LLM_TIMEOUT_SECONDS,
            )

    def _should_try_gemini_fallback(self, error_msg: str) -> bool:
        if settings.llm_provider.lower() != "gemini":
            return False
        msg = error_msg.lower()
        return "not_found" in msg or "is not found" in msg or "not supported for generatecontent" in msg

    async def _retry_with_gemini_fallback(self, context: str, question: str):
        candidates = [self.active_model] + [m for m in GEMINI_FALLBACK_MODELS if m != self.active_model]
        for model_name in candidates[1:]:
            try:
                llm = ChatGoogleGenerativeAI(
                    model=model_name,
                    temperature=settings.temperature,
                    max_tokens=settings.max_tokens,
                    google_api_key=settings.gemini_api_key,
                    request_timeout=LLM_TIMEOUT_SECONDS,
                )
                prompt = ChatPromptTemplate.from_messages([
                    ("system", self.system_prompt + "\n\nContext:\n{context}"),
                    ("human", "{question}")
                ])
                chain = prompt | llm | StrOutputParser()
                answer = await asyncio.wait_for(
                    chain.ainvoke({"context": context, "question": question}),
                    timeout=LLM_TIMEOUT_SECONDS
                )
                # Persist successful fallback for subsequent requests.
                self.active_model = model_name
                self.llm = llm
                self.chain = chain
                return answer
            except Exception:
                continue
        return None

    def _build_extractive_answer(self, chunks: List[dict]) -> str:
        top_chunks = chunks[:3]
        if not top_chunks:
            return "I could not find relevant document context to answer this."

        lines = [
            "AI model is currently unavailable, so here is a context-based answer from your indexed documents:",
            ""
        ]
        for i, chunk in enumerate(top_chunks, start=1):
            filename = chunk.get("filename", "Unknown")
            page = chunk.get("source_page", 1)
            text = (chunk.get("text", "") or "").strip()
            excerpt = text[:320] + ("..." if len(text) > 320 else "")
            lines.append(f"{i}. ({filename}, page {page}) {excerpt}")
        lines.append("")
        lines.append("Tip: Set a working LLM/API key to get fully generated answers.")
        return "\n".join(lines)
