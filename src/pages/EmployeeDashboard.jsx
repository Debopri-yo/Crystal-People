import { useState, useEffect, useCallback } from 'react';
import Timeline from '../components/Timeline.jsx';
import { getReviews, getTrendSummary } from '../lib/api.js';

export default function EmployeeDashboard({ user, onLogout }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getReviews(user.id);
      const sorted = (data.reviews || []).sort((a, b) => (a.month < b.month ? 1 : -1));
      setReviews(sorted);
    } catch (err) {
      console.error(err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    async function runSummary() {
      if (reviews.length === 0) return;
      setSummaryLoading(true);
      try {
        const recent = reviews.slice(0, 3);
        const result = await getTrendSummary(user.name, recent);
        setSummary(result.summary);
      } catch (err) {
        console.error(err);
        setSummary(null);
      } finally {
        setSummaryLoading(false);
      }
    }
    runSummary();
  }, [reviews, user.name]);

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark" />
          <span className="brand-name">Crystal People</span>
          <span className="brand-sub">Employee</span>
        </div>
        <div className="user-chip">
          Signed in as <strong>{user.name}</strong>
          <button className="logout-btn" onClick={onLogout}>Log out</button>
        </div>
      </div>

      <div className="main">
        <div className="card">
          <div className="card-title">Your performance timeline</div>

          {loading ? (
            <div className="loading-text">Loading…</div>
          ) : (
            <>
              {reviews.length > 0 && (
                <div className="ai-panel">
                  <div className="ai-panel-title">✦ AI trend summary (last 3 months)</div>
                  <div className="ai-panel-body">
                    {summaryLoading ? 'Reading your recent reviews…' : (summary || 'Summary unavailable right now.')}
                  </div>
                </div>
              )}
              <div style={{ marginTop: 20 }}>
                <Timeline reviews={reviews} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
