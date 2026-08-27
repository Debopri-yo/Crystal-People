import { scoreColor } from '../lib/scoreUtils.js';
import { monthLabel } from '../lib/scoreUtils.js';

function Bar({ label, value }) {
  return (
    <div className="bar-metric">
      <div className="bar-metric-label">{label}</div>
      <div className="bar-track">
        <div
          className="bar-fill"
          style={{ width: `${(value / 5) * 100}%`, background: scoreColor(value) }}
        />
      </div>
      <div className="bar-value" style={{ color: scoreColor(value) }}>{value}/5</div>
    </div>
  );
}

export default function Timeline({ reviews }) {
  if (!reviews || reviews.length === 0) {
    return <div className="empty-state">No reviews yet. Once a manager submits one, it will show up here.</div>;
  }

  const sorted = [...reviews].sort((a, b) => (a.month < b.month ? 1 : -1));

  return (
    <div className="timeline">
      {sorted.map((r, idx) => (
        <div className="timeline-item" key={idx}>
          <div className="timeline-dot" />
          <div className="timeline-header">
            <div className="timeline-month">{monthLabel(r.month)}</div>
            <div className="timeline-avg">avg {r.avgScore}/5</div>
          </div>
          <div className="bar-group">
            <Bar label="Output" value={Number(r.outputQuality)} />
            <Bar label="Attendance" value={Number(r.attendance)} />
            <Bar label="Teamwork" value={Number(r.teamwork)} />
          </div>
          {r.comment && <div className="timeline-comment">{r.comment}</div>}
        </div>
      ))}
    </div>
  );
}
