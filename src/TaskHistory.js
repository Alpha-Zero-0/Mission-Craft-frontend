import React, { useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

const TaskHistory = ({ onBack }) => {
  const [mode, setMode] = useState("day");
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
    return `${h > 0 ? `${h}h ` : ""}${m > 0 ? `${m}m ` : ""}`.trim();
  };

  const fetchDayTasks = async (date, setter) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${backendURL}/api/tasks/${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setter(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load tasks:", err);
      setter([]);
    }
  };

  const fetchWeekTasks = async (startDate, setter) => {
    setLoading(true);
    const start = new Date(startDate);
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d.toISOString().slice(0, 10);
    });

    const allTasks = [];
    await Promise.all(
      dates.map(date => fetchDayTasks(date, (tasksOfDay) => {
        allTasks.push(...tasksOfDay);
      }))
    );

    setter(allTasks);
    setLoading(false);
  };

  const calculateSummary = (taskList) => {
    let productiveTime = 0;
    let screenTime = 0;
    let completedTasks = 0;
    let totalTasks = 0;

    taskList.forEach((task) => {
      if (task.name === "Screen time") {
        screenTime += task.time;
      } else {
        productiveTime += task.time;
        totalTasks += 1;
        if (task.completed) completedTasks += 1;
      }
    });

    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : "0.00";

    return { productiveTime, screenTime, completionRate };
  };

  const summaryDay = calculateSummary(tasks);
  const summary1 = calculateSummary(week1Data);
  const summary2 = calculateSummary(week2Data);

  const toHours = (seconds) => (seconds / 3600).toFixed(2);

  const hoursData = [
    { metric: "Productive Hours", Week1: +toHours(summary1.productiveTime), Week2: +toHours(summary2.productiveTime) },
    { metric: "Screen Time", Week1: +toHours(summary1.screenTime), Week2: +toHours(summary2.screenTime) },
  ];

  const completionData = [
    { metric: "Completion Rate", Week1: +summary1.completionRate, Week2: +summary2.completionRate },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28DFF", "#FF6666"];

  const renderHoursChart = () => (
    <BarChart data={hoursData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barGap={10}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="metric" />
      <YAxis label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
      <Tooltip formatter={(value) => (typeof value === "number" ? value.toFixed(2) : value)} />
      <Legend />
      <Bar dataKey="Week1" fill="#8884d8" />
      <Bar dataKey="Week2" fill="#82ca9d" />
    </BarChart>
  );

  const renderCompletionChart = () => (
    <BarChart data={completionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barGap={10}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="metric" />
      <YAxis label={{ value: "% Completion", angle: -90, position: "insideLeft" }} />
      <Tooltip formatter={(value) => (typeof value === "number" ? value.toFixed(2) : value)} />
      <Legend />
      <Bar dataKey="Week1" fill="#8884d8" />
      <Bar dataKey="Week2" fill="#82ca9d" />
    </BarChart>
  );

  const renderDayPieChart = () => (
    <PieChart>
      <Pie data={tasks.map(task => ({ name: task.name, value: task.time }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} fill="#8884d8" label>
        {tasks.map((_, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip formatter={(value) => formatTime(value)} />
      <Legend />
    </PieChart>
  );

  return (
    <div style={{ padding: "2rem", minHeight: "100vh", background: "linear-gradient(135deg, #f0f4ff, #dfe9f3)" }}>
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
            <div style={{ marginTop: "2rem" }}>
              <h3>📝 Task Details</h3>
              <ul style={{ marginTop: "1rem" }}>
                {tasks.map((task) => (
                  <li key={task.id || task.name}>
                    <strong>{task.name}</strong> — {formatTime(task.time)}
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: "2rem" }}>
                <h3>📊 Task Time Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  {renderDayPieChart()}
                </ResponsiveContainer>
              </div>

              <div style={{ marginTop: "2rem" }}>
                <h3>📋 Day Summary</h3>
                <div style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: "8px", maxWidth: "400px" }}>
                  <p>Productive Hours: {toHours(summaryDay.productiveTime)}h</p>
                  <p>Screen Time: {toHours(summaryDay.screenTime)}h</p>
                  <p>Completion Rate: {summaryDay.completionRate}%</p>
                </div>
              </div>
            </div>
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
            <div>
              <div style={{ marginTop: "2rem" }}>
                <h3>📋 Summary</h3>
                <div style={{ display: "flex", gap: "2rem" }}>
                  {[summary1, summary2].map((summary, index) => (
                    <div key={index} style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }}>
                      <h4>Week {index + 1}</h4>
                      <p>Productive Hours: {toHours(summary.productiveTime)}h</p>
                      <p>Screen Time: {toHours(summary.screenTime)}h</p>
                      <p>Completion Rate: {summary.completionRate}%</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "2rem" }}>
                <h3>📊 Hours Comparison</h3>
                <ResponsiveContainer width="100%" height={400}>
                  {renderHoursChart()}
                </ResponsiveContainer>
              </div>

              <div style={{ marginTop: "2rem" }}>
                <h3>📈 Completion Rate Comparison</h3>
                <ResponsiveContainer width="100%" height={300}>
                  {renderCompletionChart()}
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      <button onClick={onBack} style={{ marginTop: "2rem" }}>🔙 Back to Dashboard</button>
    </div>
  );
};

export default TaskHistory;