/**
 * Unit tests for metrics utilities.
 * Run: node tests/metrics.test.js
 */
const assert = require('assert');
const {
  getWeekStart,
  last12Weeks,
  getWeeksInRange,
  median,
  levelFromMetrics,
  metricLevelForValue,
  formatHours,
  formatReviewCycles,
  sizeBucket,
} = require('../metrics-utils.js');

let passed = 0;
let failed = 0;

function ok(cond, msg) {
  if (cond) {
    passed++;
    console.log('  ✓ ' + msg);
  } else {
    failed++;
    console.log('  ✗ ' + msg);
  }
}

function eq(actual, expected, msg) {
  const same = actual === expected || (Number.isNaN(actual) && Number.isNaN(expected));
  if (same) {
    passed++;
    console.log('  ✓ ' + (msg || `expected ${expected}, got ${actual}`));
  } else {
    failed++;
    console.log('  ✗ ' + (msg || `expected ${expected}, got ${actual}`));
  }
}

console.log('\n--- getWeekStart ---');
const mon = getWeekStart('2025-02-14'); // Friday -> Monday 2025-02-10
ok(mon === '2025-02-10', 'Friday 2025-02-14 -> Monday 2025-02-10');
eq(getWeekStart('2025-02-10'), '2025-02-10', 'Monday stays Monday');
eq(getWeekStart('2025-02-11'), '2025-02-10', 'Tuesday -> same week Monday');

console.log('\n--- last12Weeks ---');
const weeks = last12Weeks();
ok(Array.isArray(weeks), 'returns array');
eq(weeks.length, 12, 'returns 12 weeks');
ok(weeks.every((w) => /^\d{4}-\d{2}-\d{2}$/.test(w)), 'each week is YYYY-MM-DD');
const firstMonday = new Date(weeks[0] + 'T12:00:00Z').getUTCDay();
eq(firstMonday, 1, 'first week is Monday (1)');

console.log('\n--- getWeeksInRange ---');
const range = getWeeksInRange('2025-01-01', '2025-01-31');
ok(Array.isArray(range), 'returns array');
ok(range.length >= 4 && range.length <= 5, 'Jan 2025 has 4-5 Mondays');

console.log('\n--- median ---');
eq(median([]), 0, 'empty -> 0');
eq(median([5]), 5, 'single -> that value');
eq(median([1, 2, 3]), 2, 'odd length');
eq(median([1, 2, 3, 4]), 2.5, 'even length (avg of middle two)');
eq(median([10, 2, 8]), 8, 'unsorted');
eq(median([1, null, 3]), 2, 'ignores null');
eq(median([1, NaN, 3]), 2, 'ignores NaN');

console.log('\n--- levelFromMetrics ---');
eq(levelFromMetrics(8, 0.5, 1.1), 'elite', 'lead<12, ttfr<1, cycles<=1.2 -> elite');
eq(levelFromMetrics(18, 2, 1.2), 'high', 'lead<24, ttfr<4 -> high');
eq(levelFromMetrics(30, 5, 1.5), 'low', 'above high -> low');
eq(levelFromMetrics(10, 2, 1.1), 'high', 'lead ok but ttfr not elite -> high');

console.log('\n--- metricLevelForValue (per-metric colors) ---');
eq(metricLevelForValue('leadTime', 10), 'elite', 'lead 10h < 12 -> elite');
eq(metricLevelForValue('leadTime', 20), 'high', 'lead 20h < 24 -> high');
eq(metricLevelForValue('leadTime', 30), 'low', 'lead 30h -> low');
eq(metricLevelForValue('ttfr', 0.5), 'elite', 'ttfr 0.5h < 1 -> elite');
eq(metricLevelForValue('ttfr', 2), 'high', 'ttfr 2h < 4 -> high');
eq(metricLevelForValue('ttfr', 5), 'low', 'ttfr 5h -> low');
eq(metricLevelForValue('reviewCycles', 1.0), 'elite', 'cycles 1.0 <= 1.1 -> elite');
eq(metricLevelForValue('reviewCycles', 1.2), 'high', 'cycles 1.2 -> high');
eq(metricLevelForValue('reviewCycles', 2), 'low', 'cycles 2 -> low');
eq(metricLevelForValue('cycleTime', 6), 'elite', 'cycle 6h < 8 -> elite');
eq(metricLevelForValue('changeFailureRate', 10), null, 'CFR has no level');
eq(metricLevelForValue('leadTime', null), null, 'null value -> null');
eq(metricLevelForValue('leadTime', NaN), null, 'NaN -> null');

console.log('\n--- formatHours ---');
ok(formatHours(0.5).includes('min'), '0.5h -> minutes');
ok(formatHours(5).includes('h'), '5h -> hours');
ok(formatHours(25).includes('d'), '25h -> days');
eq(formatHours(null), '—', 'null -> —');
eq(formatHours(NaN), '—', 'NaN -> —');

console.log('\n--- formatReviewCycles ---');
eq(formatReviewCycles(1.15), '1.2', 'rounds to 1 decimal');
eq(formatReviewCycles(null), '—', 'null -> —');

console.log('\n--- sizeBucket ---');
eq(sizeBucket(5), 0, 'XS 0-9');
eq(sizeBucket(20), 1, 'S 10-29');
eq(sizeBucket(50), 2, 'M 30-99');
eq(sizeBucket(200), 3, 'L 100-499');
eq(sizeBucket(600), 4, 'XL+ 500+');

console.log('\n--- Summary ---');
console.log('Passed: ' + passed + ', Failed: ' + failed);
process.exit(failed > 0 ? 1 : 0);
