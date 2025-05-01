import React, { useState, useEffect, useRef } from "react";
import TaskHistory from "./TaskHistory";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import MonsterMood from "./components/MonsterMood";

const Dashboard = ({ username, onLogout }) => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [activeTask, setActiveTask] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const timerRef = useRef(null);

  const backendURL = process.env.REACT_APP_BACKEND_URL;
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA336A"];

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const formatTooltipTime = (hoursDecimal) => {
    const totalMinutes = Math.round(hoursDecimal * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };

  useEffect(() => {
    const fetchTasks = async () => {
      const token = localStorage.getItem("token");
      const date = new Date().toISOString().slice(0, 10);

      try {
        const res = await fetch(`${backendURL}/api/tasks/${date}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          const loaded = data.map((task) => ({
            name: task.name,
            time: task.time,
            completed: task.completed || false,
            fixed: task.name === "Screen time",
          }));

          const screenTask = loaded.find((t) => t.name === "Screen time") || {
            name: "Screen time",
            time: 0,
            completed: false,
            fixed: true,
          };
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
  }, [backendURL]);

  useEffect(() => {
    if (loading) return;
    clearInterval(timerRef.current);

    if (activeTask && !isPaused) {
      timerRef.current = setInterval(() => {
        setTasks((prev) =>
          prev.map((task) =>
            task.name === activeTask ? { ...task, time: Math.min(task.time + 1, 86400) } : task
          )
        );
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [activeTask, isPaused, loading]);

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    const exists = tasks.find((t) => t.name.toLowerCase() === newTask.toLowerCase());
    if (exists) return alert("Task already exists");
    setTasks([...tasks, { name: newTask, time: 0, completed: false }]);
    setNewTask("");
  };

  const handleRemoveTask = (name) => {
    if (activeTask === name) stopTimer();
    setTasks(tasks.filter((task) => task.name !== name));
  };

  const toggleCompletion = (name) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.name === name ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const startTimer = (taskName) => {
    if (activeTask === taskName && isPaused) {
      setIsPaused(false);
    } else {
      setActiveTask(taskName);
      setIsPaused(false);
    }
  };

  const pauseTimer = () => setIsPaused(true);
  const stopTimer = () => {
    clearInterval(timerRef.current);
    setActiveTask(null);
    setIsPaused(false);
  };

  const handleSaveTasks = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("You must be logged in");

    const date = new Date().toISOString().slice(0, 10);

    try {
      const res = await fetch(`${backendURL}/api/tasks/save`, {
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

  const completedTasks = tasks.filter((t) => !t.fixed && t.completed).length;
  const totalTasks = tasks.filter((t) => !t.fixed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const productiveTime = tasks.filter((t) => !t.fixed).reduce((sum, t) => sum + t.time, 0);
  const screenTime = tasks.filter((t) => t.fixed && t.name === "Screen time").reduce((sum, t) => sum + t.time, 0);

  const chartData = tasks.map((task) => ({ name: task.name, value: task.time / 3600 }));

  const handleTimeChange = (name, hours, minutes) => {
    let newTime = hours * 3600 + minutes * 60;
    if (newTime > 86400) newTime = 86400;
    setTasks((prev) =>
      prev.map((task) => (task.name === name ? { ...task, time: newTime } : task))
    );
  };

  if (showHistory) {
    return <TaskHistory onBack={() => setShowHistory(false)} />;
  }

  return (
    <div style={{
      padding: "2rem",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f0f4ff, #dfe9f3)",
    }}>
      <h2>🎯 Welcome, {username}</h2>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "2rem" }}>
        {/* Left: Task Tracker */}
        <div style={{ flex: "1" }}>
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
            {tasks.map((task) => {
              const hours = Math.floor(task.time / 3600);
              const minutes = Math.floor((task.time % 3600) / 60);
              return (
                <li key={task.name} style={{ marginBottom: "1rem" }}>
                  <strong>{task.name}</strong>
                  <div style={{ marginTop: "0.5rem" }}>
                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={hours}
                      onChange={(e) => handleTimeChange(task.name, parseInt(e.target.value) || 0, minutes)}
                      style={{ width: "60px", marginRight: "0.5rem" }}
                    />h
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={minutes}
                      onChange={(e) => handleTimeChange(task.name, hours, parseInt(e.target.value) || 0)}
                      style={{ width: "60px", marginLeft: "0.5rem", marginRight: "0.5rem" }}
                    />m
                  </div>
                  ({formatTime(task.time)})

                  {!task.fixed && (
                    <>
                      <button
                        onClick={() => handleRemoveTask(task.name)}
                        style={{ marginLeft: "1rem" }}
                      >
                        ❌ Remove
                      </button>
                      <button
                        onClick={() => toggleCompletion(task.name)}
                        style={{ marginLeft: "0.5rem" }}
                      >
                        {task.completed ? "✅ Completed" : "⭕ Incomplete"}
                      </button>
                    </>
                  )}
                </li>
              );
            })}
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

        {/* Middle: Pie Chart */}
        <div style={{ flex: "0 0 420px", textAlign: "center" }}>
          <h3>📊 Time Distribution</h3>
          <PieChart width={400} height={400}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              fill="#8884d8"
              label
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatTooltipTime(value)} />
            <Legend />
          </PieChart>
        </div>

        {/* Right: Monster + Stats */}
        <div style={{ flex: "0 0 300px", textAlign: "center" }}>
          <MonsterMood
            completionRate={completionRate}
            productiveTime={productiveTime}
            screenTime={screenTime}
          />
          <div style={{ marginTop: "1rem" }}>
            <h3>✅ Today's Completion Rate: {completionRate}%</h3>
            <p>🧠 Productive Time: {formatTime(productiveTime)}</p>
            <p>📱 Screen Time: {formatTime(screenTime)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
