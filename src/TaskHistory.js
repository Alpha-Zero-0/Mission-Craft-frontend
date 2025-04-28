import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const TaskHistory = ({ onBack }) => {
  const [selectedWeek1, setSelectedWeek1] = useState("");
  const [selectedWeek2, setSelectedWeek2] = useState("");
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

  const fetchWeekData = async (weekStartDate, setter) => {
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${backendURL}/api/tasks/week/${weekStartDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setter(data);
      } else {
        setter([]);
      }
    } catch (err) {
      console.error("Failed to load week tasks:", err);
      setter([]);
    } finally {
      setLoading(false);
    }
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
      <h2>📅 Weekly Comparison</h2>

      <div>
        <label>
          Select Week 1 Start Date: 
          <input
            type="date"
            value={selectedWeek1}
            onChange={(e) => {
              setSelectedWeek1(e.target.value);
              fetchWeekData(e.target.value, setWeek1Data);
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
              fetchWeekData(e.target.value, setWeek2Data);
            }}
            style={{ marginLeft: "0.5rem" }}
          />
        </label>
      </div>

      {loading && <p>⏳ Loading data...</p>}

      {!loading && selectedWeek1 && selectedWeek2 && (
        <div style={{ marginTop: "2rem" }}>
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
      )}

      <button onClick={onBack} style={{ marginTop: "2rem" }}>
        🔙 Back to Dashboard
      </button>
    </div>
  );
};

export default TaskHistory;
