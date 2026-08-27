import { useState, useEffect, useCallback } from 'react';
import { EMPLOYEES } from '../lib/users.js';
import ScoreInput from '../components/ScoreInput.jsx';
import Timeline from '../components/Timeline.jsx';
import { getReviews, submitReview, getConsistencyCheck } from '../lib/api.js';
import { average, currentMonthValue } from '../lib/scoreUtils.js';

export default function ManagerDashboard({ user, onLogout }) {
  const [selectedEmpId, setSelectedEmpId] = useState(EMPLOYEES[0].id);
  const [outputQuality, setOutputQuality] = useState(0);
  const [attendance, setAttendance] = useState(0);
  const [teamwork, setTeamwork] = useState(0);
  const [comment, setComment] = useState('');
  const [month, setMonth] = useState(currentMonthValue());

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null); // {ok, text}

  const [flag, setFlag] = useState(null); // {consistent, note}
  const [checkingFlag, setCheckingFlag] = useState(false);

  const selectedEmp = EMPLOYEES.find((e) => e.id === selectedEmpId);

  const loadReviews = useCallback(async (empId) => {
    setLoadingReviews(true);
    try {
      const data = await getReviews(empId);
      setReviews(data.reviews || []);
    } catch (err) {
      console.error(err);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  useEffect(() => {
    loadReviews(selectedEmpId);
    setOutputQuality(0);
    setAttendance(0);
    setTeamwork(0);
    setComment('');
    setFlag(null);
    setStatusMsg(null);
  }, [selectedEmpId, loadReviews]);

  async function handleCheckConsistency() {
    if (!outputQuality || !attendance || !teamwork || !comment.trim()) return;
    setCheckingFlag(true);
    setFlag(null);
    try {
      const result = await getConsistencyCheck(
        { outputQuality, attendance, teamwork },
        comment
      );
      setFlag(result);
    } catch (err) {
      console.error(err);
      setFlag({ consistent: true, note: 'Could not run AI check right now.' });
    } finally {
      setCheckingFlag(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!outputQuality || !attendance || !teamwork) {
      setStatusMsg({ ok: false, text: 'Please score all three dimensions.' });
      return;
    }
    setSubmitting(true);
    setStatusMsg(null);
    try {
      await submitReview({
        employeeId: selectedEmp.id,
        employeeName: selectedEmp.name,
        manager: user.name,
        month,
        outputQuality,
        attendance,
        teamwork,
        avgScore: average(outputQuality, attendance, teamwork),
        comment: comment.trim(),
      });
      setStatusMsg({ ok: true, text: 'Review submitted.' });
      setOutputQuality(0);
      setAttendance(0);
      setTeamwork(0);
      setComment('');
      setFlag(null);
      loadReviews(selectedEmpId);
    } catch (err) {
      console.error(err);
      setStatusMsg({ ok: false, text: 'Something went wrong submitting the review. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  const canCheck = outputQuality && attendance && teamwork && comment.trim().length > 5;

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark" />
          <span className="brand-name">Crystal People</span>
          <span className="brand-sub">Manager</span>
        </div>
        <div className="user-chip">
          Signed in as <strong>{user.name}</strong>
          <button className="logout-btn" onClick={onLogout}>Log out</button>
        </div>
      </div>

      <div className="main">
        <div className="grid-2">
          <div className="card">
            <div className="card-title">Score a review</div>

            <div className="field">
              <label htmlFor="employee">Employee</label>
              <select id="employee" value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)}>
                {EMPLOYEES.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="month">Month</label>
              <input id="month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>

            <form onSubmit={handleSubmit}>
              <ScoreInput label="Output Quality" value={outputQuality} onChange={setOutputQuality} />
              <ScoreInput label="Attendance" value={attendance} onChange={setAttendance} />
              <ScoreInput label="Teamwork" value={teamwork} onChange={setTeamwork} />

              <div className="field" style={{ marginTop: 16 }}>
                <label htmlFor="comment">Comment</label>
                <textarea
                  id="comment"
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did this person do well, and what should they focus on next month?"
                />
              </div>

              <div className="submit-row">
                <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit review'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCheckConsistency}
                  disabled={!canCheck || checkingFlag}
                >
                  {checkingFlag ? 'Checking…' : 'Check with AI before submitting'}
                </button>
              </div>
              {statusMsg && (
                <div className={`status-text ${statusMsg.ok ? 'ok' : 'err'}`} style={{ marginTop: 10 }}>
                  {statusMsg.text}
                </div>
              )}
            </form>

            {flag && (
              <div className={flag.consistent ? 'flag-ok' : 'flag-warn'}>
                {flag.consistent ? '✓ ' : '⚠ '}{flag.note}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">{selectedEmp.name} — history</div>
            {loadingReviews ? (
              <div className="loading-text">Loading…</div>
            ) : (
              <Timeline reviews={reviews} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
