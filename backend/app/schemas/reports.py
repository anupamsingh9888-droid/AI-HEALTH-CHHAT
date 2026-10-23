from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from datetime import datetime


class MedicationItem(BaseModel):
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    instructions: Optional[str] = None


class LabTestResult(BaseModel):
    test_name: str
    result_value: str
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    status: Optional[str] = None  # Normal, High, Low, Uncertain


class ExtractedTable(BaseModel):
    table_index: int
    rows: List[List[str]] = Field(default_factory=list)


class KeyValuePair(BaseModel):
    key: str
    value: str
    confidence: Optional[float] = None


class StructuredMedicalInfo(BaseModel):
    document_type: str = "Laboratory"
    report_date: Optional[str] = None
    doctor_or_facility: Optional[str] = None
    summary: Optional[str] = None
    important_findings: List[str] = Field(default_factory=list)
    questions_for_doctor: List[str] = Field(default_factory=list)
    diagnoses: List[str] = Field(default_factory=list)
    medications: List[MedicationItem] = Field(default_factory=list)
    lab_results: List[LabTestResult] = Field(default_factory=list)
    key_values: List[KeyValuePair] = Field(default_factory=list)
    tables: List[ExtractedTable] = Field(default_factory=list)
    doctor_instructions: List[str] = Field(default_factory=list)
    uncertain_or_unclear_fields: List[str] = Field(default_factory=list)
    disclaimer: str = "Extracted information must be verified against the original physical medical document. This is not a clinical diagnosis."


class ReportResponse(BaseModel):
    id: str
    user_id: str
    file_name: str
    file_type: str
    file_size_bytes: Optional[int] = None
    document_type: str = "Laboratory"
    report_date: Optional[str] = None
    status: str = "Processed"  # Processing, Processed, Failed
    ocr_raw_text: Optional[str] = None
    ocr_confidence: Optional[float] = None
    ocr_engine: str = "Gemini Multimodal Document AI"
    structured_data: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None


class ReportListResponse(BaseModel):
    reports: List[ReportResponse]
    total: int
