import { useState, useEffect } from 'react';
import './App.css';

interface Habit {
  id: number;
  title: string;
  description?: string;
  is_active: boolean;
}

interface HabitLog {
  id: number;
  habit_id: number;
  log_date: string;
  completed: boolean;
}

interface DailyMetric {
  id: number;
  metric_name: string;
  metric_value: number;
  log_date: string;
}

const API_BASE = 'https://personal-ops-api.onrender.com/api';

function App() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Record<number, boolean>>({});
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [deepWorkHours, setDeepWorkHours] = useState<string>('');

  // Track selected date (defaults to today in YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  useEffect(() => {
    fetchHabits();
  }, []);

  // Re-fetch logs and metrics whenever the selected date changes
  useEffect(() => {
    fetchLogsForDate(selectedDate);
    fetchMetricsForDate(selectedDate);
  }, [selectedDate]);

  const fetchHabits = async () => {
    try {
      const response = await fetch(`${API_BASE}/habits`);
      const data = await response.json();
      setHabits(data);
    } catch (err) {
      console.error("Failed to fetch habits", err);
    }
  };

  const fetchLogsForDate = async (date: string) => {
    try {
      const response = await fetch(`${API_BASE}/habit-logs?log_date=${date}`);
      const data: HabitLog[] = await response.json();
      const logMap: Record<number, boolean> = {};
      data.forEach((log) => {
        logMap[log.habit_id] = log.completed;
      });
      setLogs(logMap);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    }
  };

  const fetchMetricsForDate = async (date: string) => {
    try {
      const response = await fetch(`${API_BASE}/daily-metrics?log_date=${date}`);
      const data: DailyMetric[] = await response.json();
      const deepWork = data.find((m) => m.metric_name === 'deep_work_hours');
      if (deepWork) {
        setDeepWorkHours(deepWork.metric_value.toString());
      } else {
        setDeepWorkHours(''); // Clear if no entry for that date
      }
    } catch (err) {
      console.error("Failed to fetch metrics", err);
    }
  };

  const handleToggle = async (habitId: number) => {
    const currentStatus = logs[habitId] || false;
    const nextStatus = !currentStatus;

    try {
      const response = await fetch(`${API_BASE}/habit-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habit_id: habitId,
          log_date: selectedDate,
          completed: nextStatus,
        }),
      });

      if (response.ok) {
        setLogs((prev) => ({ ...prev, [habitId]: nextStatus }));
      }
    } catch (err) {
      console.error("Failed to log habit", err);
    }
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc ? newDesc : null,
        }),
      });

      if (response.ok) {
        setNewTitle('');
        setNewDesc('');
        fetchHabits();
      }
    } catch (err) {
      console.error("Failed to create habit", err);
    }
  };

  const handleSaveMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(deepWorkHours);
    if (isNaN(val)) return;

    try {
      const response = await fetch(`${API_BASE}/daily-metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric_name: 'deep_work_hours',
          metric_value: val,
          log_date: selectedDate,
        }),
      });

      if (response.ok) {
        alert(`Deep work hours saved for ${selectedDate}!`);
      }
    } catch (err) {
      console.error("Failed to save metric", err);
    }
  };

  return (
    <div className="tracker-container">
      <main className="tracker-main">
        {/* Page Header */}
        <header className="tracker-header">
          <p className="tracker-eyebrow">PERSONAL OPS TRACKER</p>
          <h1 className="tracker-title">Daily overview</h1>
          <p className="tracker-subtitle">
            Your habits, your focus, one day at a time.
          </p>
        </header>

        {/* Date Selector */}
        <div className="date-selector-card">
          <label htmlFor="logDate" className="date-label">
            Tracking date
          </label>
          <input
            type="date"
            id="logDate"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-input"
          />
        </div>

        {/* Deep Work Metric */}
        <section aria-labelledby="deep-work-heading" className="tracker-section">
          <div className="section-header">
            <h2 id="deep-work-heading" className="section-title">
              Deep work
            </h2>
            <p className="section-description">Record your focused hours</p>
          </div>

          <form onSubmit={handleSaveMetric} className="metric-form">
            <div className="input-group">
              <label htmlFor="deepWorkHours" className="form-label">
                Hours today
              </label>
              <input
                id="deepWorkHours"
                type="number"
                step="0.5"
                min="0"
                max="24"
                placeholder="e.g. 4.5"
                value={deepWorkHours}
                onChange={(e) => setDeepWorkHours(e.target.value)}
                className="tracker-input"
              />
            </div>

            <button type="submit" className="btn-primary btn-metric">
              Save metric
            </button>
          </form>
        </section>

        {/* Daily Habits */}
        <section aria-labelledby="habits-heading" className="tracker-section-habits">
          <div className="section-header">
            <h2 id="habits-heading" className="section-title">
              Daily habits
            </h2>
            <p className="section-description">Habits for {selectedDate}</p>
          </div>

          {habits.length === 0 ? (
            <p className="empty-habits">
              No habits added yet. Create one below to get started.
            </p>
          ) : (
            <ul className="habits-list">
              {habits.map((habit) => {
                const isChecked = logs[habit.id] || false;

                return (
                  <li key={habit.id} className="habit-item">
                    <div className="habit-content">
                      <div
                        className={`habit-title ${isChecked ? "habit-title-checked" : "habit-title-unchecked"
                          }`}
                        style={{
                          textDecoration: isChecked ? "line-through" : "none",
                        }}
                      >
                        {habit.title}
                      </div>

                      {habit.description && (
                        <div className="habit-desc">{habit.description}</div>
                      )}
                    </div>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(habit.id)}
                      aria-label={`Mark ${habit.title} as ${isChecked ? "incomplete" : "complete"
                        }`}
                      className="habit-checkbox"
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Create Habit */}
        <section aria-labelledby="create-habit-heading">
          <div className="create-habit-wrapper">
            <h2 id="create-habit-heading" className="create-habit-title">
              Add a habit
            </h2>
            <p className="create-habit-desc">
              Create a habit to track each day.
            </p>

            <form onSubmit={handleCreateHabit} className="create-habit-form">
              <div>
                <label htmlFor="newHabitTitle" className="form-label field-spacing">
                  Habit title
                </label>
                <input
                  id="newHabitTitle"
                  type="text"
                  placeholder="e.g. Read for 20 minutes"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="tracker-input"
                />
              </div>

              <div>
                <label htmlFor="newHabitDescription" className="form-label field-spacing">
                  Description <span className="optional-text">(optional)</span>
                </label>
                <input
                  id="newHabitDescription"
                  type="text"
                  placeholder="Add a little context"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="tracker-input"
                />
              </div>

              <button type="submit" className="btn-primary btn-create">
                Create habit
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;