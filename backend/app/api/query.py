from fastapi import APIRouter, HTTPException, Request, status
from app.models.schemas import QueryRequest, QueryResponse, HealthResponse
from app.core.config import get_settings

router = APIRouter(prefix="/query", tags=["Query"])
settings = get_settings()

@router.post("/", response_model=QueryResponse)
async def submit_query(
    request: Request, 
    body: QueryRequest
):
    vector_store = request.app.state.vector_store
    stats = vector_store.get_stats()
    if stats["total_chunks"] == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No documents have been indexed yet. Please upload a document first."
        )
        
    rag_service = request.app.state.rag_service
    try:
        response = await rag_service.query(body)
        return response
    except Exception as e:
        if isinstance(e, RuntimeError):
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/health", response_model=HealthResponse)
async def health_check(request: Request):
    vector_store = request.app.state.vector_store
    stats = vector_store.get_stats()
    
    return HealthResponse(
        status="ok",
        vector_store_loaded=(stats["total_chunks"] > 0),
        total_documents=stats["total_documents"],
        total_chunks=stats["total_chunks"],
        embedding_model=settings.embedding_model,
        llm_provider=settings.llm_provider,
        llm_model=settings.llm_model
    )
