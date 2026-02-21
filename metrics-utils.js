/**
 * Pure metrics utilities (used by app.js in browser and by tests in Node).
 * Browser: loaded before app.js, attached to window.MetricsUtils.
 * Node: module.exports for tests.
 */

function getWeekStart(isoDateStr) {
  const d = new Date(isoDateStr + 'T12:00:00Z');
  const day = d.getUTCDay();
  const toMonday = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - toMonday);
  return d.toISOString().slice(0, 10);
}

function last12Weeks() {
  const weeks = [];
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const thisMonday = getWeekStart(today);
  const m = new Date(thisMonday + 'T12:00:00Z');
  for (let i = 11; i >= 0; i--) {
    const d = new Date(m);
    d.setUTCDate(d.getUTCDate() - 7 * i);
    weeks.push(d.toISOString().slice(0, 10));
  }
  return weeks;
}

function median(arr) {
  if (!arr || arr.length === 0) return 0;
  const a = arr.filter((x) => x != null && !Number.isNaN(x)).sort((x, y) => x - y);
  if (a.length === 0) return 0;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

function levelFromMetrics(leadTimeH, ttfrH, reviewCycles) {
  const leadOk = leadTimeH < 12;
  const leadHigh = leadTimeH < 24;
  const ttfrOk = ttfrH < 1;
  const ttfrHigh = ttfrH < 4;
  const cycleOk = reviewCycles != null && reviewCycles <= 1.2;
  if (leadOk && ttfrOk && cycleOk) return 'elite';
  if (leadHigh && ttfrHigh) return 'high';
  return 'low';
}

function metricLevelForValue(metricId, value) {
  if (value == null || Number.isNaN(value)) return null;
  switch (metricId) {
    case 'cycleTime':
      if (value < 8) return 'elite';
      if (value < 24) return 'high';
      return 'low';
    case 'leadTime':
      if (value < 12) return 'elite';
      if (value < 24) return 'high';
      return 'low';
    case 'ttfr':
      if (value < 1) return 'elite';
      if (value < 4) return 'high';
      return 'low';
    case 'reviewCycles':
      if (value <= 1.1) return 'elite';
      if (value <= 1.2) return 'high';
      return 'low';
    case 'changeFailureRate':
      return null;
    default:
      return null;
  }
}

function formatHours(h) {
  if (h == null || Number.isNaN(h)) return '—';
  if (h < 1) return Math.round(h * 60) + ' min';
  if (h < 24) return (Math.round(h * 10) / 10) + ' h';
  return (Math.round((h / 24) * 10) / 10) + ' d';
}

function formatReviewCycles(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return (Math.round(n * 10) / 10).toString();
}

function sizeBucket(lines) {
  if (lines <= 9) return 0;
  if (lines <= 29) return 1;
  if (lines <= 99) return 2;
  if (lines <= 499) return 3;
  return 4;
}

// Weeks between two dates (Mondays). Optional: use for custom date range.
function getWeeksInRange(fromDateStr, toDateStr) {
  const from = new Date(fromDateStr + 'T12:00:00Z');
  const to = new Date(toDateStr + 'T12:00:00Z');
  const weeks = [];
  let m = new Date(getWeekStart(fromDateStr) + 'T12:00:00Z');
  const end = new Date(getWeekStart(toDateStr) + 'T12:00:00Z');
  while (m <= end) {
    weeks.push(m.toISOString().slice(0, 10));
    m.setUTCDate(m.getUTCDate() + 7);
  }
  return weeks;
}

if (typeof window !== 'undefined') {
  window.MetricsUtils = {
    getWeekStart,
    last12Weeks,
    getWeeksInRange,
    median,
    levelFromMetrics,
    metricLevelForValue,
    formatHours,
    formatReviewCycles,
    sizeBucket,
  };
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getWeekStart,
    last12Weeks,
    getWeeksInRange,
    median,
    levelFromMetrics,
    metricLevelForValue,
    formatHours,
    formatReviewCycles,
    sizeBucket,
  };
}
