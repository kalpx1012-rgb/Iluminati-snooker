import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Square, User, Phone, Receipt } from "lucide-react";
import axios from "axios";
import LiveTimer from "@/components/LiveTimer";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TablePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tableNum = parseInt(id, 10);

  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bill, setBill] = useState(null);
  const [error, setError] = useState("");

  const fetchTable = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/tables`);
      const found = res.data.find((t) => t.table_number === tableNum);
      if (found) setTable(found);
    } catch (e) {
      console.error("Failed to fetch table:", e);
    } finally {
      setLoading(false);
    }
  }, [tableNum]);

  useEffect(() => {
    fetchTable();
    const interval = setInterval(fetchTable, 5000);
    return () => clearInterval(interval);
  }, [fetchTable]);

  const handleStartGame = async () => {
    if (!name.trim() || !phone.trim()) {
      setError("Please enter both name and phone number");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await axios.post(`${API}/start-game/${tableNum}`, {
        customer_name: name.trim(),
        customer_phone: phone.trim(),
      });
      setName("");
      setPhone("");
      await fetchTable();
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to start game");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndGame = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await axios.post(`${API}/end-game/${tableNum}`);
      setBill(res.data);
      await fetchTable();
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to end game");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="content-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  const isActive = table?.status === "active";

  return (
    <div className="content-wrapper page-enter">
      <div style={{ padding: "2rem 1.5rem", maxWidth: "600px", margin: "0 auto" }}>
        {/* Back Button */}
        <button
          className="btn-secondary"
          onClick={() => navigate("/")}
          style={{ marginBottom: "2rem" }}
          data-testid="back-button"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Table Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }} data-testid="table-header">
          <span className="stat-label">Table</span>
          <div className="table-badge" style={{ fontSize: "5rem" }} data-testid="table-number-badge">
            {tableNum}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
            <span className={`status-dot ${isActive ? "status-dot-active" : "status-dot-available"}`} />
            <span style={{ fontSize: "0.875rem", color: isActive ? "#39FF14" : "#71717a", fontWeight: 600 }}>
              {isActive ? "In Play" : "Available"}
            </span>
          </div>
        </div>

        {/* Bill Receipt (shown after ending game) */}
        {bill && (
          <div className="glass-card glass-card-active" style={{ textAlign: "center", marginBottom: "2rem" }} data-testid="bill-receipt">
            <Receipt size={24} style={{ color: "#39FF14", margin: "0 auto 1rem" }} />
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "1.25rem", marginBottom: "1rem" }}>
              Session Complete
            </h3>
            <div className="neon-line" style={{ margin: "1rem 0" }} />
            <div style={{ display: "grid", gap: "0.75rem", fontSize: "0.9rem", textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Player</span>
                <span style={{ fontWeight: 600 }}>{bill.customer_name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Duration</span>
                <span style={{ fontWeight: 600 }}>{bill.duration_minutes?.toFixed(1)} min</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Rate</span>
                <span style={{ fontWeight: 600 }}>₹60 / 15 min</span>
              </div>
            </div>
            <div className="neon-line" style={{ margin: "1rem 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--text-secondary)" }}>Total</span>
              <span className="bill-amount" data-testid="final-bill-amount">₹{bill.total_amount}</span>
            </div>
            <button
              className="btn-neon"
              style={{ marginTop: "1.5rem", width: "100%" }}
              onClick={() => setBill(null)}
              data-testid="new-game-btn"
            >
              New Game
            </button>
          </div>
        )}

        {/* Start Game Form (when table is available) */}
        {!isActive && !bill && (
          <div className="glass-card" data-testid="start-game-form">
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "1.25rem", marginBottom: "1.5rem", textAlign: "center" }}>
              Start a Session
            </h3>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label className="stat-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <User size={12} /> Player Name
                </label>
                <input
                  className="input-neon"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="player-name-input"
                />
              </div>
              <div>
                <label className="stat-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <Phone size={12} /> Phone Number
                </label>
                <input
                  className="input-neon"
                  type="tel"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  data-testid="player-phone-input"
                />
              </div>
              {error && (
                <p style={{ color: "#ef4444", fontSize: "0.875rem", textAlign: "center" }} data-testid="error-message">
                  {error}
                </p>
              )}
              <button
                className="btn-neon"
                style={{ width: "100%", marginTop: "0.5rem" }}
                onClick={handleStartGame}
                disabled={submitting}
                data-testid="start-game-btn"
              >
                {submitting ? <div className="spinner" style={{ width: "1rem", height: "1rem" }} /> : <Play size={16} />}
                {submitting ? "Starting..." : "Start Game"}
              </button>
            </div>
          </div>
        )}

        {/* Active Session View */}
        {isActive && !bill && (
          <div className="glass-card glass-card-active" style={{ textAlign: "center" }} data-testid="active-session">
            {table.session && (
              <>
                <div style={{ marginBottom: "1rem" }}>
                  <span style={{ fontSize: "1rem", fontWeight: 600 }}>{table.session.customer_name}</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginLeft: "0.5rem" }}>
                    {table.session.customer_phone}
                  </span>
                </div>
                <div className="neon-line" style={{ margin: "1rem 0" }} />
                <LiveTimer startTime={table.session.start_time} />
                <div className="neon-line" style={{ margin: "1.5rem 0" }} />
              </>
            )}
            {error && (
              <p style={{ color: "#ef4444", fontSize: "0.875rem", marginBottom: "1rem" }} data-testid="error-message">
                {error}
              </p>
            )}
            <button
              className="btn-danger"
              style={{ width: "100%" }}
              onClick={handleEndGame}
              disabled={submitting}
              data-testid="end-game-btn"
            >
              {submitting ? <div className="spinner" style={{ width: "1rem", height: "1rem" }} /> : <Square size={16} />}
              {submitting ? "Ending..." : "End Game"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
