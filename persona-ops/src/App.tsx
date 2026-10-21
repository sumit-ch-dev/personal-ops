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
    <div
      style={{
        minHeight: "100vh",
        background: "#151719",
        color: "#F1F2EF",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        boxSizing: "border-box",
        padding: "40px 20px 64px",
      }}
    >
      <main
        style={{
          maxWidth: "620px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        {/* Page Header */}
        <header style={{ marginBottom: "28px" }}>
          <p
            style={{
              color: "#A3B8A0",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              margin: "0 0 10px",
            }}
          >
            PERSONAL OPS TRACKER
          </p>

          <h1
            style={{
              fontSize: "30px",
              lineHeight: 1.25,
              fontWeight: 600,
              letterSpacing: "-0.035em",
              margin: "0 0 8px",
            }}
          >
            Daily overview
          </h1>

          <p
            style={{
              color: "#A1A6A3",
              fontSize: "14px",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Your habits, your focus, one day at a time.
          </p>
        </header>

        {/* Date Selector */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            background: "#202325",
            border: "1px solid #383D3D",
            borderRadius: "10px",
            padding: "12px 14px",
            marginBottom: "32px",
            boxSizing: "border-box",
          }}
        >
          <label
            htmlFor="logDate"
            style={{
              color: "#A1A6A3",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            Tracking date
          </label>

          <input
            type="date"
            id="logDate"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              background: "transparent",
              color: "#F1F2EF",
              border: "1px solid #454B48",
              borderRadius: "6px",
              padding: "8px",
              fontSize: "14px",
              fontFamily: "inherit",
              maxWidth: "100%",
              colorScheme: "dark",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Deep Work Metric */}
        <section
          aria-labelledby="deep-work-heading"
          style={{ marginBottom: "36px" }}
        >
          <div style={{ marginBottom: "18px" }}>
            <h2
              id="deep-work-heading"
              style={{
                fontSize: "21px",
                lineHeight: 1.4,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: "0 0 5px",
              }}
            >
              Deep work
            </h2>

            <p
              style={{
                color: "#A1A6A3",
                fontSize: "14px",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Record your focused hours
            </p>
          </div>

          <form
            onSubmit={handleSaveMetric}
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                flex: "1 1 200px",
                minWidth: 0,
              }}
            >
              <label
                htmlFor="deepWorkHours"
                style={{
                  display: "block",
                  color: "#C6CBC6",
                  fontSize: "13px",
                  fontWeight: 500,
                  marginBottom: "8px",
                }}
              >
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
                style={{
                  width: "100%",
                  minHeight: "44px",
                  padding: "10px 12px",
                  boxSizing: "border-box",
                  background: "#202325",
                  color: "#F1F2EF",
                  border: "1px solid #454B48",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  outlineOffset: "3px",
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                minHeight: "44px",
                padding: "0 18px",
                marginTop: "21px",
                background: "#A3B8A0",
                color: "#182019",
                border: "1px solid transparent",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              Save metric
            </button>
          </form>
        </section>

        {/* Daily Habits */}
        <section
          aria-labelledby="habits-heading"
          style={{ marginBottom: "40px" }}
        >
          <div style={{ marginBottom: "16px" }}>
            <h2
              id="habits-heading"
              style={{
                fontSize: "21px",
                lineHeight: 1.4,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: "0 0 5px",
              }}
            >
              Daily habits
            </h2>

            <p
              style={{
                color: "#A1A6A3",
                fontSize: "14px",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Habits for {selectedDate}
            </p>
          </div>

          {habits.length === 0 ? (
            <p
              style={{
                color: "#A1A6A3",
                fontSize: "14px",
                lineHeight: 1.7,
                padding: "16px 0",
                margin: 0,
                borderTop: "1px solid #303536",
                borderBottom: "1px solid #303536",
              }}
            >
              No habits added yet. Create one below to get started.
            </p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
              }}
            >
              {habits.map((habit) => {
                const isChecked = logs[habit.id] || false;

                return (
                  <li
                    key={habit.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "16px 4px",
                      borderBottom: "1px solid #303536",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          color: isChecked ? "#A1A6A3" : "#E8EAE6",
                          fontSize: "15px",
                          lineHeight: 1.5,
                          fontWeight: 500,
                          textDecoration: isChecked
                            ? "line-through"
                            : "none",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {habit.title}
                      </div>

                      {habit.description && (
                        <div
                          style={{
                            color: "#929A95",
                            fontSize: "13px",
                            lineHeight: 1.6,
                            marginTop: "3px",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {habit.description}
                        </div>
                      )}
                    </div>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(habit.id)}
                      aria-label={`Mark ${habit.title} as ${isChecked ? "incomplete" : "complete"
                        }`}
                      style={{
                        width: "20px",
                        height: "20px",
                        flexShrink: 0,
                        margin: 0,
                        accentColor: "#A3B8A0",
                        cursor: "pointer",
                      }}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Create Habit */}
        <section aria-labelledby="create-habit-heading">
          <div
            style={{
              borderTop: "1px solid #303536",
              paddingTop: "24px",
            }}
          >
            <h2
              id="create-habit-heading"
              style={{
                fontSize: "19px",
                lineHeight: 1.4,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: "0 0 6px",
              }}
            >
              Add a habit
            </h2>

            <p
              style={{
                color: "#A1A6A3",
                fontSize: "14px",
                lineHeight: 1.6,
                margin: "0 0 18px",
              }}
            >
              Create a habit to track each day.
            </p>

            <form
              onSubmit={handleCreateHabit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div>
                <label
                  htmlFor="newHabitTitle"
                  style={{
                    display: "block",
                    color: "#C6CBC6",
                    fontSize: "13px",
                    fontWeight: 500,
                    marginBottom: "7px",
                  }}
                >
                  Habit title
                </label>

                <input
                  id="newHabitTitle"
                  type="text"
                  placeholder="e.g. Read for 20 minutes"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    minHeight: "44px",
                    padding: "10px 12px",
                    boxSizing: "border-box",
                    background: "#202325",
                    color: "#F1F2EF",
                    border: "1px solid #454B48",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="newHabitDescription"
                  style={{
                    display: "block",
                    color: "#C6CBC6",
                    fontSize: "13px",
                    fontWeight: 500,
                    marginBottom: "7px",
                  }}
                >
                  Description <span style={{ color: "#929A95" }}>(optional)</span>
                </label>

                <input
                  id="newHabitDescription"
                  type="text"
                  placeholder="Add a little context"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: "44px",
                    padding: "10px 12px",
                    boxSizing: "border-box",
                    background: "#202325",
                    color: "#F1F2EF",
                    border: "1px solid #454B48",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  alignSelf: "flex-start",
                  minHeight: "44px",
                  padding: "0 18px",
                  marginTop: "4px",
                  background: "#A3B8A0",
                  color: "#182019",
                  border: "1px solid transparent",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
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