import logging
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.schemas.reports import ReportResponse, ReportListResponse
from app.services.supabase_service import get_supabase_service
from app.services.ocr_service import get_ocr_service
from app.services.gemini_service import get_gemini_service
from app.utils.security import get_current_user, AuthenticatedUser

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/reports", tags=["Medical Reports & OCR"])


@router.post("/upload", response_model=ReportResponse)
async def upload_medical_report(
    file: UploadFile = File(...),
    document_type: Optional[str] = Form(None),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Uploads a medical document (PNG, JPEG, WebP, TIFF, or PDF), performs Gemini multimodal
    document processing (transcription, table/form extraction, and clinical structuring),
    and saves to Supabase PostgreSQL.
    """
    ocr_service = get_ocr_service()
    gemini_service = get_gemini_service()
    supabase = get_supabase_service()

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty."
        )

    filename = file.filename or "medical_report.pdf"
    content_type = file.content_type or "application/octet-stream"

    # Step 1: Run Gemini Multimodal Document Processing
    try:
        ocr_result = ocr_service.process_document(
            file_bytes=file_bytes,
            filename=filename,
            content_type=content_type,
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Gemini document processing failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gemini document processing encountered an error: {str(e)}"
        )

    extracted_text = ocr_result.get("extracted_text", "")
    ocr_confidence = ocr_result.get("confidence_score", 0.95)
    key_values = ocr_result.get("key_values", [])
    tables = ocr_result.get("tables", [])
    structured_data = ocr_result.get("structured_data")

    # If structured_data wasn't fully formed by multimodal call, analyze with gemini_service
    doc_type = document_type or "Laboratory"
    if not structured_data or not structured_data.get("summary"):
        try:
            structured_data = await gemini_service.analyze_medical_report(
                ocr_text=extracted_text,
                filename=filename,
                key_values=key_values,
                tables=tables,
            )
        except Exception as e:
            logger.warning(f"Secondary Gemini structuring skipped: {e}")
            structured_data = {
                "document_type": doc_type,
                "disclaimer": "Extracted text could not be automatically structured. Please review original document."
            }

    if structured_data and "document_type" in structured_data:
        doc_type = structured_data["document_type"]

    # Ensure tables and key_values are present in structured_data
    if structured_data is not None:
        if key_values and "key_values" not in structured_data:
            structured_data["key_values"] = key_values
        if tables and "tables" not in structured_data:
            structured_data["tables"] = tables

    # Step 2: Save to Supabase
    report_record = {
        "file_name": filename,
        "file_type": content_type,
        "file_size_bytes": len(file_bytes),
        "document_type": doc_type,
        "report_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "status": "Processed",
        "ocr_raw_text": extracted_text,
        "ocr_confidence": ocr_confidence,
        "ocr_engine": "Gemini Multimodal Document AI",
        "structured_data": structured_data,
    }

    saved = supabase.create_report(current_user.id, report_record)
    return saved


@router.get("", response_model=ReportListResponse)
async def list_reports(current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    Returns all medical reports belonging to the authenticated user.
    """
    supabase = get_supabase_service()
    reports = supabase.get_reports(current_user.id)
    return ReportListResponse(reports=reports, total=len(reports))


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: str, current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    Retrieves details and OCR findings for a specific report.
    """
    supabase = get_supabase_service()
    report = supabase.get_report(current_user.id, report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{report_id}' was not found or access is unauthorized."
        )
    return report


@router.delete("/{report_id}")
async def delete_report(report_id: str, current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    Deletes a specific report owned by the authenticated user.
    """
    supabase = get_supabase_service()
    success = supabase.delete_report(current_user.id, report_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found or could not be removed."
        )
    return {"message": "Report deleted successfully", "id": report_id}
