export default function ScoreInput({ label, value, onChange }) {
  return (
    <div className="score-row">
      <div className="score-label">{label}</div>
      <div className="score-pills">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            className={`score-pill${value === n ? ' active' : ''}`}
            onClick={() => onChange(n)}
            aria-pressed={value === n}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
