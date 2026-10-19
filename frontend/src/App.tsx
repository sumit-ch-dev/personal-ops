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

const API_BASE = 'http://localhost:8000/api';

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
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Personal Ops Tracker</h1>

      {/* Date Selector / History Navigator */}
      <div style={{ background: '#e2e8f0', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label htmlFor="logDate" style={{ fontWeight: 'bold' }}>Viewing Date:</label>
        <input
          type="date"
          id="logDate"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ padding: '6px', fontSize: '14px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
        />
      </div>

      {/* Numerical Metrics Section */}
      <section style={{ background: '#f0fdf4', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bbf7d0' }}>
        <h3>Daily Metric: Deep Work Hours ({selectedDate})</h3>
        <form onSubmit={handleSaveMetric} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="number"
            step="0.5"
            min="0"
            max="24"
            placeholder="Hours (e.g., 4.5)"
            value={deepWorkHours}
            onChange={(e) => setDeepWorkHours(e.target.value)}
            style={{ padding: '8px', fontSize: '14px', flex: 1 }}
          />
          <button type="submit" style={{ padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Save Metric
          </button>
        </form>
      </section>

      {/* Habit Checklist */}
      <section style={{ marginBottom: '20px' }}>
        <h3>Habits for {selectedDate}</h3>
        {habits.length === 0 ? (
          <p>No habits added yet. Create one below to get started!</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {habits.map((habit) => {
              const isChecked = logs[habit.id] || false;
              return (
                <li
                  key={habit.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    borderBottom: '1px solid #eee',
                    background: isChecked ? '#f0fdf4' : 'white',
                  }}
                >
                  <div>
                    <strong>{habit.title}</strong>
                    {habit.description && <div style={{ fontSize: '12px', color: '#666' }}>{habit.description}</div>}
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggle(habit.id)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Habit Creation Form */}
      <section style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
        <h3>Add New Global Habit</h3>
        <form onSubmit={handleCreateHabit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="text"
            placeholder="Habit title (e.g., Read 20 minutes)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{ padding: '8px', fontSize: '14px' }}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            style={{ padding: '8px', fontSize: '14px' }}
          />
          <button type="submit" style={{ padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Create Habit Definition
          </button>
        </form>
      </section>
    </div>
  );
}

export default App;