export function scoreColor(score) {
  if (score >= 4) return 'var(--good)';
  if (score >= 3) return 'var(--warn)';
  return 'var(--bad)';
}

export function average(a, b, c) {
  return Math.round(((Number(a) + Number(b) + Number(c)) / 3) * 10) / 10;
}

export function monthLabel(monthStr) {
  // monthStr expected as 'YYYY-MM'
  if (!monthStr) return '';
  const [y, m] = monthStr.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function currentMonthValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
