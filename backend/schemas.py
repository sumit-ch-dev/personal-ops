from pydantic import BaseModel, Field
from datetime import date
from typing import Optional

class HabitCreate(BaseModel):
    title: str = Field(..., min_string_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=255)

class HabitResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    is_active: bool
    created_at: date

    class Config:
        from_attributes = True

class HabitLogCreate(BaseModel):
    habit_id: int
    log_date: date
    completed: bool

class HabitLogResponse(BaseModel):
    id: int
    habit_id: int
    log_date: date
    completed: bool

    class Config:
        from_attributes = True
        
class DailyMetricCreate(BaseModel):
    metric_name: str = Field(..., min_length=1, max_length=50)
    metric_value: float
    log_date: date

class DailyMetricResponse(BaseModel):
    id: int
    metric_name: str
    metric_value: float
    log_date: date

    class Config:
        from_attributes = True
