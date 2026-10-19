from sqlalchemy import Column, Integer, String, Boolean, Date, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(Date, default=datetime.date.today)

    logs = relationship("HabitLog", back_populates="habit", cascade="all, delete-orphan")


class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id"), nullable=False)
    log_date = Column(Date, nullable=False, default=datetime.date.today)
    completed = Column(Boolean, default=False)

    habit = relationship("Habit", back_populates="logs")

    # Ensure a habit can only have one log entry per date
    __table_args__ = (UniqueConstraint('habit_id', 'log_date', name='uix_habit_date'),)


class DailyMetric(Base):
    __tablename__ = "daily_metrics"

    id = Column(Integer, primary_key=True, index=True)
    metric_name = Column(String(50), nullable=False)  # e.g., "deep_work_hours"
    metric_value = Column(Float, nullable=False)     # e.g., 4.5
    log_date = Column(Date, nullable=False, default=datetime.date.today)

    # Ensure a metric name is unique per date
    __table_args__ = (UniqueConstraint('metric_name', 'log_date', name='uix_metric_date'),)
