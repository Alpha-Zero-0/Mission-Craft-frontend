import React, { useState, useEffect } from "react";
import Dashboard from "./Dashboard";


const Auth = () => {
  const [mode, setMode] = useState("login"); // or "signup"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    // Check for token and user
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("username");
    if (token && storedUser) {
      setLoggedInUser(storedUser);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = mode === "login" ? "login" : "signup";

    try {
      const res = await fetch(`http://localhost:5432/api/auth/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        setLoggedInUser(data.username);
        setMessage(`✅ Logged in as ${data.username}`);
      } else {
        setMessage(data.message || data.error || "Something went wrong.");
      }
    } catch (err) {
      setMessage("❌ Error: " + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setLoggedInUser(null);
    setUsername("");
    setPassword("");
    setMessage("Logged out.");
  };

  if (loggedInUser) {
    return (
      <Dashboard
        username={loggedInUser}
        onLogout={handleLogout}
      />
    );
  }
  

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Mission Craft - {mode === "login" ? "Login" : "Sign Up"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        /><br /><br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br /><br />
        <button type="submit">
          {mode === "login" ? "Log In" : "Sign Up"}
        </button>
      </form>
      <p>{message}</p>
      <button onClick={() => setMode(mode === "login" ? "signup" : "login")}>
        Switch to {mode === "login" ? "Sign Up" : "Log In"}
      </button>
    </div>
  );
};

export default Auth;
