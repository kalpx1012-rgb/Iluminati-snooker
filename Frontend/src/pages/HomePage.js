import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CircleDot, Timer, ArrowRight, ShieldCheck } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function HomePage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTables = async () => {
    try {
      const res = await axios.get(`${API}/tables`);
      setTables(res.data);
    } catch (e) {
      console.error("Failed to fetch tables:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="content-wrapper page-enter">
      <div style={{ padding: "3rem 1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: "3rem" }} data-testid="home-header">
          <h1 className="brand-title" data-testid="brand-title">Illuminati Snooker</h1>
          <p className="brand-subtitle">Premium Billiards Lounge</p>
        </header>

        {/* Tables Grid */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "4rem 0" }}>
            <div className="spinner" />
          </div>
        ) : (
          <div className="tables-grid" data-testid="tables-grid">
            {tables.map((table) => {
              const isActive = table.status === "active";
              return (
                <div
                  key={table.table_number}
                  className={`glass-card ${isActive ? "glass-card-active" : ""}`}
                  style={{ cursor: "pointer", textAlign: "center" }}
                  onClick={() => navigate(`/table/${table.table_number}`)}
                  data-testid={`table-card-${table.table_number}`}
                >
                  <div style={{ marginBottom: "1rem" }}>
                    <span className="stat-label">Table</span>
                    <div className="table-badge">{table.table_number}</div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <span className={`status-dot ${isActive ? "status-dot-active" : "status-dot-available"}`} />
                    <span style={{ fontSize: "0.875rem", color: isActive ? "#39FF14" : "#71717a", fontWeight: 600 }}>
                      {isActive ? "In Play" : "Available"}
                    </span>
                  </div>

                  {isActive && table.session && (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}>
                        <Timer size={14} />
                        <span>{table.session.customer_name}</span>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem", color: isActive ? "#39FF14" : "var(--text-secondary)", fontSize: "0.8rem" }}>
                    {isActive ? <CircleDot size={14} /> : <ArrowRight size={14} />}
                    <span>{isActive ? "View Session" : "Start Game"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Admin Link */}
        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <button
            className="btn-secondary"
            onClick={() => navigate("/admin")}
            data-testid="admin-link"
          >
            <ShieldCheck size={16} />
            Admin Panel
          </button>
        </div>
      </div>
    </div>
  );
}
