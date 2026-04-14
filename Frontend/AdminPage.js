import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Lock, DollarSign, Users, Activity, Hash,
  CircleDot
} from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API}/admin-login`, { password });
      if (res.data.success) {
        sessionStorage.setItem("admin_auth", "true");
        onLogin();
      }
    } catch (e) {
      setError("Invalid password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-wrapper password-gate page-enter">
      <div className="glass-card" style={{ width: "100%", maxWidth: "400px", textAlign: "center" }} data-testid="admin-login-card">
        <Lock size={32} style={{ color: "#39FF14", margin: "0 auto 1rem" }} />
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.5rem" }}>
          Admin Access
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
          Enter the admin password to continue
        </p>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <input
            className="input-neon"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="admin-password-input"
            autoFocus
          />
          {error && (
            <p style={{ color: "#ef4444", fontSize: "0.875rem" }} data-testid="admin-error">
              {error}
            </p>
          )}
          <button
            className="btn-neon"
            type="submit"
            disabled={loading}
            data-testid="admin-login-btn"
          >
            {loading ? "Verifying..." : "Unlock Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}

function formatTime(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    hour12: true
  });
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, sessionsRes] = await Promise.all([
        axios.get(`${API}/dashboard-stats`),
        axios.get(`${API}/sessions`),
      ]);
      setStats(statsRes.data);
      setSessions(sessionsRes.data);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="content-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="content-wrapper page-enter">
      <div style={{ padding: "2rem 1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.75rem" }} data-testid="admin-title">
              Admin Dashboard
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
              Auto-refreshing every 5 seconds
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn-secondary" onClick={() => navigate("/")} data-testid="admin-back-btn">
              <ArrowLeft size={16} /> Home
            </button>
            <button className="btn-secondary" onClick={handleLogout} data-testid="admin-logout-btn">
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="stats-grid" style={{ marginBottom: "2rem" }} data-testid="stats-grid">
            <div className="stat-card" data-testid="stat-revenue">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <DollarSign size={16} style={{ color: "#39FF14" }} />
                <span className="stat-label" style={{ marginTop: 0 }}>Total Revenue</span>
              </div>
              <div className="stat-value" data-testid="revenue-value">₹{stats.total_revenue}</div>
            </div>
            <div className="stat-card" data-testid="stat-sessions">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <Users size={16} style={{ color: "#39FF14" }} />
                <span className="stat-label" style={{ marginTop: 0 }}>Total Sessions</span>
              </div>
              <div className="stat-value" data-testid="sessions-value">{stats.total_sessions}</div>
            </div>
            <div className="stat-card" data-testid="stat-active">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <Activity size={16} style={{ color: "#39FF14" }} />
                <span className="stat-label" style={{ marginTop: 0 }}>Active Sessions</span>
              </div>
              <div className="stat-value" data-testid="active-value">{stats.active_sessions}</div>
            </div>
          </div>
        )}

        {/* Table Status Grid */}
        {stats && (
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "1.25rem", marginBottom: "1rem" }}>
              Table Status
            </h2>
            <div className="tables-grid" data-testid="admin-tables-grid">
              {stats.tables.map((t) => {
                const isActive = t.status === "active";
                return (
                  <div
                    key={t.table_number}
                    className={`glass-card ${isActive ? "glass-card-active" : ""}`}
                    style={{ textAlign: "center" }}
                    data-testid={`admin-table-${t.table_number}`}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <Hash size={14} style={{ color: "#39FF14" }} />
                      <span className="table-badge table-badge-sm">{t.table_number}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                      <span className={`status-dot ${isActive ? "status-dot-active" : "status-dot-available"}`} />
                      <span style={{ fontSize: "0.8rem", color: isActive ? "#39FF14" : "#71717a", fontWeight: 600 }}>
                        {isActive ? "In Play" : "Available"}
                      </span>
                    </div>
                    {isActive && t.session && (
                      <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        <div>{t.session.customer_name}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Session History */}
        <div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "1.25rem", marginBottom: "1rem" }}>
            Session History
          </h2>
          <div className="glass-card" style={{ maxHeight: "500px", overflowY: "auto" }} data-testid="session-history">
            {sessions.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem 0" }}>
                No sessions recorded yet
              </p>
            ) : (
              <>
                {/* Header Row */}
                <div className="session-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#71717a" }}>
                  <span>Table</span>
                  <span>Player</span>
                  <span>Time</span>
                  <span style={{ textAlign: "right" }}>Amount</span>
                </div>
                {sessions.map((s, i) => (
                  <div className="session-row" key={s.session_id || i} data-testid={`session-row-${i}`}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <CircleDot size={12} style={{ color: s.status === "active" ? "#39FF14" : "#52525b" }} />
                      <span style={{ fontWeight: 600 }}>T{s.table_number}</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{s.customer_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#71717a" }}>{s.customer_phone}</div>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {formatTime(s.start_time)}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {s.status === "active" ? (
                        <span style={{ color: "#39FF14", fontWeight: 600, fontSize: "0.8rem" }}>LIVE</span>
                      ) : (
                        <span style={{ color: "#39FF14", fontWeight: 700 }}>₹{s.total_amount}</span>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem("admin_auth");
    if (auth === "true") setAuthenticated(true);
  }, []);

  if (!authenticated) {
    return <AdminLogin onLogin={() => setAuthenticated(true)} />;
  }

  return <AdminDashboard />;
}
