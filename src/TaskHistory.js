import React, { useState } from "react";

const TaskHistory = ({ onBack }) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const backendURL = process.env.REACT_APP_BACKEND_URL; // ✅ Add this

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h}h ` : ""}${m > 0 ? `${m}m ` : ""}${s}s`;
  };

  const handleDateChange = async (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setLoading(true);
    setTasks([]);

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${backendURL}/api/tasks/${date}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (Array.isArray(data)) {
        setTasks(data);
      } else {
        alert("No tasks found.");
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
      alert("Something went wrong loading tasks.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>📅 Task History</h2>

      <label>
        Select a date:{" "}
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          style={{ marginLeft: "0.5rem" }}
        />
      </label>

      {loading && <p>⏳ Loading tasks...</p>}

      {!loading && tasks.length > 0 && (
        <ul style={{ marginTop: "1rem" }}>
          {tasks.map((task) => (
            <li key={task.name}>
              <strong>{task.name}</strong> — {formatTime(task.time)}
            </li>
          ))}
        </ul>
      )}

      {!loading && selectedDate && tasks.length === 0 && (
        <p style={{ marginTop: "1rem" }}>No tasks recorded for this day.</p>
      )}

      <button onClick={onBack} style={{ marginTop: "2rem" }}>
        🔙 Back to Dashboard
      </button>
    </div>
  );
};

export default TaskHistory;
