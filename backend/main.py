from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import date
from typing import List

from database import get_db, engine
import models
import schemas

app = FastAPI(title="Personal Ops API", version="0.1.0")

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "message": "Personal Ops API is running!"}

# --- HABIT ENDPOINTS ---

@app.post("/api/habits", response_model=schemas.HabitResponse, status_code=status.HTTP_201_CREATED)
def create_habit(habit: schemas.HabitCreate, db: Session = Depends(get_db)):
    db_habit = models.Habit(title=habit.title, description=habit.description)
    db.add(db_habit)
    db.commit()
    db.refresh(db_habit)
    return db_habit

@app.get("/api/habits", response_model=List[schemas.HabitResponse])
def get_habits(db: Session = Depends(get_db)):
    return db.query(models.Habit).filter(models.Habit.is_active == True).all()

# --- HABIT LOG ENDPOINTS ---

@app.post("/api/habit-logs", response_model=schemas.HabitLogResponse)
def log_habit(log: schemas.HabitLogCreate, db: Session = Depends(get_db)):
    # Check if a log already exists for this habit and date
    existing_log = db.query(models.HabitLog).filter(
        models.HabitLog.habit_id == log.habit_id,
        models.HabitLog.log_date == log.log_date
    ).first()

    if existing_log:
        existing_log.completed = log.completed
        db.commit()
        db.refresh(existing_log)
        return existing_log

    # Otherwise, create a new log entry
    db_log = models.HabitLog(
        habit_id=log.habit_id,
        log_date=log.log_date,
        completed=log.completed
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@app.get("/api/habit-logs", response_model=List[schemas.HabitLogResponse])
def get_habit_logs(log_date: date, db: Session = Depends(get_db)):
    return db.query(models.HabitLog).filter(models.HabitLog.log_date == log_date).all()


# --- DAILY METRIC ENDPOINTS ---

@app.post("/api/daily-metrics", response_model=schemas.DailyMetricResponse)
def log_daily_metric(metric: schemas.DailyMetricCreate, db: Session = Depends(get_db)):
    # Check if a metric entry already exists for this name and date
    existing_metric = db.query(models.DailyMetric).filter(
        models.DailyMetric.metric_name == metric.metric_name,
        models.DailyMetric.log_date == metric.log_date
    ).first()

    if existing_metric:
        existing_metric.metric_value = metric.metric_value
        db.commit()
        db.refresh(existing_metric)
        return existing_metric

    # Otherwise, create a new entry
    db_metric = models.DailyMetric(
        metric_name=metric.metric_name,
        metric_value=metric.metric_value,
        log_date=metric.log_date
    )
    db.add(db_metric)
    db.commit()
    db.refresh(db_metric)
    return db_metric

@app.get("/api/daily-metrics", response_model=List[schemas.DailyMetricResponse])
def get_daily_metrics(log_date: date, db: Session = Depends(get_db)):
    return db.query(models.DailyMetric).filter(models.DailyMetric.log_date == log_date).all()