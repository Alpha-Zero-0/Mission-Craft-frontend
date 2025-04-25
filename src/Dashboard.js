import React, { useState, useEffect, useRef } from "react";
import TaskHistory from "./TaskHistory";

const Dashboard = ({ username, onLogout }) => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [activeTask, setActiveTask] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const timerRef = useRef(null);

  // ✅ Format seconds into h m s string
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h}h ` : ""}${m > 0 ? `${m}m ` : ""}${s}s`;
  };

  // ✅ Load tasks on first render
  useEffect(() => {
    const fetchTasks = async () => {
      const token = localStorage.getItem("token");
      const date = new Date().toISOString().slice(0, 10);

      try {
        const res = await fetch(`/api/tasks/${date}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (Array.isArray(data)) {
          const loaded = data.map((task) => ({
            name: task.name,
            time: task.time,
            fixed: task.name === "Screen time",
          }));

          const screenTask =
            loaded.find((t) => t.name === "Screen time") ||
            { name: "Screen time", time: 0, fixed: true };
          const otherTasks = loaded.filter((t) => t.name !== "Screen time");

          setTasks([screenTask, ...otherTasks]);
        }
      } catch (err) {
        console.error("❌ Failed to load tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // ✅ Timer logic — waits for tasks to finish loading
  useEffect(() => {
    if (loading) return;

    clearInterval(timerRef.current);

    if (activeTask && !isPaused) {
      timerRef.current = setInterval(() => {
        setTasks((prev) =>
          prev.map((task) =>
            task.name === activeTask
              ? { ...task, time: task.time + 1 }
              : task
          )
        );
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [activeTask, isPaused, loading]);

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    const exists = tasks.find(
      (t) => t.name.toLowerCase() === newTask.toLowerCase()
    );
    if (exists) return alert("Task already exists");

    setTasks([...tasks, { name: newTask, time: 0 }]);
    setNewTask("");
  };

  const handleRemoveTask = (name) => {
    if (activeTask === name) stopTimer();
    setTasks(tasks.filter((task) => task.name !== name));
  };

  const startTimer = (taskName) => {
    if (activeTask === taskName && isPaused) {
      setIsPaused(false); // Resume
    } else {
      setActiveTask(taskName);
      setIsPaused(false);
    }
  };

  const pauseTimer = () => {
    setIsPaused(true);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    setActiveTask(null);
    setIsPaused(false);
  };

  const handleSaveTasks = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("You must be logged in");

    const date = new Date().toISOString().slice(0, 10); // format: YYYY-MM-DD

    try {
      const res = await fetch("/api/tasks/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tasks, date }),
      });

      const data = await res.json();
      alert(data.message || "Saved.");
    } catch (err) {
      alert("Error saving tasks: " + err.message);
    }
  };

  if (loading) return <p>⏳ Loading your tasks...</p>;

  // ✅ Show history page
  if (showHistory) {
    return <TaskHistory onBack={() => setShowHistory(false)} />;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2>🎯 Welcome, {username}</h2>

      <div>
        <input
          type="text"
          placeholder="New task name"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />
        <button onClick={handleAddTask}>Add Task</button>
      </div>

      <ul style={{ marginTop: "1rem" }}>
        {tasks.map((task) => (
          <li key={task.name} style={{ marginBottom: "0.5rem" }}>
            <strong>{task.name}</strong>

            <input
              type="number"
              value={task.time}
              min="0"
              onChange={(e) => {
                const updatedTime = parseInt(e.target.value) || 0;
                setTasks((prev) =>
                  prev.map((t) =>
                    t.name === task.name ? { ...t, time: updatedTime } : t
                  )
                );
              }}
              style={{
                width: "80px",
                marginLeft: "1rem",
                marginRight: "0.5rem",
              }}
            />
            seconds ({formatTime(task.time)})

            {!task.fixed && (
              <button
                onClick={() => handleRemoveTask(task.name)}
                style={{ marginLeft: "1rem" }}
              >
                ❌ Remove
              </button>
            )}

            <div style={{ marginTop: "0.5rem" }}>
              {activeTask === task.name ? (
                isPaused ? (
                  <>
                    ⏸️ Paused
                    <button onClick={() => startTimer(task.name)}>
                      ▶ Resume
                    </button>
                    <button onClick={stopTimer}>⏹ Stop</button>
                  </>
                ) : (
                  <>
                    ⏱️ Running
                    <button onClick={pauseTimer}>⏸ Pause</button>
                    <button onClick={stopTimer}>⏹ Stop</button>
                  </>
                )
              ) : (
                <button onClick={() => startTimer(task.name)}>▶ Start</button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: "2rem" }}>
        <button onClick={handleSaveTasks} style={{ marginRight: "1rem" }}>
          💾 Save Progress
        </button>
        <button onClick={() => setShowHistory(true)} style={{ marginRight: "1rem" }}>
          📅 View History
        </button>
        <button onClick={onLogout}>Log Out</button>
      </div>
    </div>
  );
};

export default Dashboard;
