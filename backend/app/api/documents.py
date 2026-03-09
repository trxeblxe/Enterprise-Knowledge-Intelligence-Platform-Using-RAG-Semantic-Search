import os
from fastapi import APIRouter, File, UploadFile, HTTPException, Request, status
from app.core.config import get_settings
from app.models.schemas import UploadResponse, DocumentListResponse, DeleteResponse, DocumentInfo

settings = get_settings()
router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_EXTENSIONS = {"pdf", "docx", "doc", "txt"}

def _get_extension(filename: str) -> str:
    if "." not in filename:
        return ""
    return filename.rsplit(".", 1)[-1].lower()

@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    request: Request, 
    file: UploadFile = File(...)
):
    ext = _get_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension not allowed. Allowed extensions are: {', '.join(ALLOWED_EXTENSIONS)}"
        )
        
    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > settings.max_upload_size_mb:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum upload size of {settings.max_upload_size_mb} MB"
        )
        
    doc_service = request.app.state.document_service
    try:
        response = await doc_service.ingest_document(contents, file.filename)
        if not response.success:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=response.message)
        return response
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/", response_model=DocumentListResponse)
async def get_documents(request: Request):
    doc_service = request.app.state.document_service
    docs = doc_service.get_all_documents()
    return DocumentListResponse(documents=docs, total=len(docs))

@router.get("/{doc_id}", response_model=DocumentInfo)
async def get_document(doc_id: str, request: Request):
    doc_service = request.app.state.document_service
    doc = doc_service.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return doc

@router.delete("/{doc_id}", response_model=DeleteResponse)
async def delete_document(doc_id: str, request: Request):
    doc_service = request.app.state.document_service
    success = doc_service.delete_document(doc_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return DeleteResponse(success=True, message=f"Document {doc_id} successfully deleted.")
