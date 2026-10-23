from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import date, datetime


class HealthSummaryResponse(BaseModel):
    user_name: str
    known_health_info: Dict[str, Optional[str]]
    recorded_medications: List[str]
    allergies: List[str]
    current_metrics: Dict[str, Dict[str, str]]
    verified_reports_count: int
    data_backed_trends: List[str]
    missing_information: List[str]
    general_wellness_suggestions: List[str]
    disclaimer: str = "This summary is based on your entered data and uploaded reports. It does not replace clinical consultation."


class HealthInsightItem(BaseModel):
    category: str  # Sleep, Activity, Weight, Nutrition
    title: str
    observation: str
    delta_percentage: Optional[float] = None
    direction: Optional[str] = None  # "higher", "lower", "steady"
    tips: List[str] = Field(default_factory=list)
    has_sufficient_data: bool = True


class HealthInsightsResponse(BaseModel):
    insights: List[HealthInsightItem]
    sufficient_data_available: bool
    data_timeframe_days: int = 7


class RecommendationRequest(BaseModel):
    focus_areas: Optional[List[str]] = None


class RecommendationItem(BaseModel):
    title: str
    description: str
    category: str  # Sleep, Hydration, Nutrition, Activity, Stress
    level: str = "General"  # General, Gentle, Focus


class RecommendationsResponse(BaseModel):
    recommendations: List[RecommendationItem]
    disclaimer: str = "Recommendations are general healthy lifestyle suggestions and not clinical prescriptions."
