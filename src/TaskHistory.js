import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const TaskHistory = ({ onBack }) => {
  const [mode, setMode] = useState("day"); // "day" or "week"
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedWeek1, setSelectedWeek1] = useState("");
  const [selectedWeek2, setSelectedWeek2] = useState("");
  const [tasks, setTasks] = useState([]);
  const [week1Data, setWeek1Data] = useState([]);
  const [week2Data, setWeek2Data] = useState([]);
  const [loading, setLoading] = useState(false);

  const backendURL = process.env.REACT_APP_BACKEND_URL;

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h}h ` : ""}${m > 0 ? `${m}m ` : ""}${s}s`;
  };

  const fetchDayTasks = async (date, setter) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${backendURL}/api/tasks/${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setter(data);
      } else {
        setter([]);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
      setter([]);
    }
  };

  const fetchWeekTasks = async (startDate, setter) => {
    setLoading(true);
    const dates = [];
    const start = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }

    const allTasks = [];
    for (const date of dates) {
      await fetchDayTasks(date, (tasksOfDay) => {
        allTasks.push(...tasksOfDay);
      });
    }
    setter(allTasks);
    setLoading(false);
  };

  const calculateSummary = (weekTasks) => {
    let productiveTime = 0;
    let screenTime = 0;
    let completedTasks = 0;
    let totalTasks = 0;

    weekTasks.forEach((task) => {
      if (task.name === "Screen time") {
        screenTime += task.time;
      } else {
        productiveTime += task.time;
        totalTasks += 1;
        if (task.completed) completedTasks += 1;
      }
    });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return { productiveTime, screenTime, completionRate };
  };

  const summary1 = calculateSummary(week1Data);
  const summary2 = calculateSummary(week2Data);

  const comparisonData = [
    { name: "Productive Hours", Week1: summary1.productiveTime / 3600, Week2: summary2.productiveTime / 3600 },
    { name: "Screen Time", Week1: summary1.screenTime / 3600, Week2: summary2.screenTime / 3600 },
    { name: "Completion %", Week1: summary1.completionRate, Week2: summary2.completionRate },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      <h2>📅 Task History</h2>

      <div style={{ marginBottom: "1rem" }}>
        <button onClick={() => setMode("day")} style={{ marginRight: "1rem" }}>View One Day</button>
        <button onClick={() => setMode("week")}>Compare Weeks</button>
      </div>

      {mode === "day" && (
        <>
          <label>
            Select a date: 
            <input
              type="date"
              value={selectedDate}
              onChange={async (e) => {
                setSelectedDate(e.target.value);
                setLoading(true);
                await fetchDayTasks(e.target.value, setTasks);
                setLoading(false);
              }}
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
        </>
      )}

      {mode === "week" && (
        <>
          <div>
            <label>
              Select Week 1 Start Date: 
              <input
                type="date"
                value={selectedWeek1}
                onChange={(e) => {
                  setSelectedWeek1(e.target.value);
                  fetchWeekTasks(e.target.value, setWeek1Data);
                }}
                style={{ marginLeft: "0.5rem" }}
              />
            </label>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <label>
              Select Week 2 Start Date: 
              <input
                type="date"
                value={selectedWeek2}
                onChange={(e) => {
                  setSelectedWeek2(e.target.value);
                  fetchWeekTasks(e.target.value, setWeek2Data);
                }}
                style={{ marginLeft: "0.5rem" }}
              />
            </label>
          </div>

          {loading && <p>⏳ Loading weeks data...</p>}

          {!loading && selectedWeek1 && selectedWeek2 && (
            <>
              <div style={{ marginTop: "2rem" }}>
                <h3>📋 Summary</h3>
                <div style={{ display: "flex", gap: "2rem" }}>
                  <div style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }}>
                    <h4>Week 1</h4>
                    <p>Productive Hours: {summary1.productiveTime / 3600}h</p>
                    <p>Screen Time: {summary1.screenTime / 3600}h</p>
                    <p>Completion Rate: {summary1.completionRate}%</p>
                  </div>
                  <div style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }}>
                    <h4>Week 2</h4>
                    <p>Productive Hours: {summary2.productiveTime / 3600}h</p>
                    <p>Screen Time: {summary2.screenTime / 3600}h</p>
                    <p>Completion Rate: {summary2.completionRate}%</p>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "2rem" }}>
                <h3>📊 Weekly Comparison</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Week1" fill="#8884d8" />
                    <Bar dataKey="Week2" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </>
      )}

      <button onClick={onBack} style={{ marginTop: "2rem" }}>
        🔙 Back to Dashboard
      </button>
    </div>
  );
};

export default TaskHistory;
