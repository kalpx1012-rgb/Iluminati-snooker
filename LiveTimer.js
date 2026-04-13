import { useState, useEffect, useCallback } from "react";

const RATE_PER_BLOCK = 60;
const BLOCK_MINUTES = 15;

export default function LiveTimer({ startTime }) {
  const [elapsed, setElapsed] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [bill, setBill] = useState(RATE_PER_BLOCK);

  const calculate = useCallback(() => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now - start;
    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    setElapsed({ hours, minutes, seconds });

    const totalMinutes = totalSeconds / 60;
    const blocks = Math.max(1, Math.ceil(totalMinutes / BLOCK_MINUTES));
    setBill(blocks * RATE_PER_BLOCK);
  }, [startTime]);

  useEffect(() => {
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [calculate]);

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div data-testid="live-timer">
      <div className="timer-display" data-testid="timer-value">
        {pad(elapsed.hours)}:{pad(elapsed.minutes)}:{pad(elapsed.seconds)}
      </div>
      <div style={{ marginTop: "0.75rem" }}>
        <span className="stat-label">Running Bill</span>
        <div className="bill-amount" data-testid="running-bill" style={{ marginTop: "0.25rem" }}>
          ₹{bill}
        </div>
      </div>
    </div>
  );
}
