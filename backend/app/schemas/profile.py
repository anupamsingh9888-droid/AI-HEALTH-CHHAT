from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ProfileBase(BaseModel):
    full_name: Optional[str] = "Maya Rao"
    age: Optional[int] = Field(default=29, ge=1, le=125)
    gender: Optional[str] = "Female"
    height_cm: Optional[float] = Field(default=167.0, ge=40, le=260)
    weight_kg: Optional[float] = Field(default=62.4, ge=20, le=400)
    activity_level: Optional[str] = "Moderately active"
    health_goals: List[str] = Field(default_factory=lambda: ["Better sleep", "Walk 10k steps"])
    medical_history: Optional[str] = None
    allergies: List[str] = Field(default_factory=list)
    current_medications: List[str] = Field(default_factory=list)
    dietary_preferences: Optional[str] = None
    sleep_goal_hours: Optional[float] = Field(default=8.0, ge=4, le=14)


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = Field(default=None, ge=1, le=125)
    gender: Optional[str] = None
    height_cm: Optional[float] = Field(default=None, ge=40, le=260)
    weight_kg: Optional[float] = Field(default=None, ge=20, le=400)
    activity_level: Optional[str] = None
    health_goals: Optional[List[str]] = None
    medical_history: Optional[str] = None
    allergies: Optional[List[str]] = None
    current_medications: Optional[List[str]] = None
    dietary_preferences: Optional[str] = None
    sleep_goal_hours: Optional[float] = Field(default=None, ge=4, le=14)


class ProfileResponse(ProfileBase):
    id: str
    email: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
