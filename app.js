const { createApp } = Vue;

const METRIC_DEFS = [
  { id: 'cycleTime', name: 'Cycle Time', definition: 'From first commit to deployment.', elite: '< 8 h', high: '8 - 24 h', impact: 'Speed to market.' },
  { id: 'leadTime', name: 'Lead Time for PR', definition: 'From PR creation to merge.', elite: '< 12 h', high: '< 24 h', impact: 'Agility and response to bugs.' },
  { id: 'ttfr', name: 'Time to First Review (TTFR)', definition: 'Time until first human or AI review comment.', elite: '< 1 h', high: '< 4 h', impact: 'Maintains flow state.' },
  { id: 'reviewCycles', name: 'Review Cycles', definition: 'Times the PR goes back to the author for changes.', elite: '1.1 cycles', high: '1.2 cycles', impact: 'Clarity of requirements and quality.' },
  { id: 'changeFailureRate', name: 'Change Failure Rate', definition: '% of deploys that cause incidents.', elite: '0 - 15%', high: '15 - 20%', impact: 'Stability and confidence.' },
];

const PR_SIZE_LABELS = [
  { key: 'xs', label: 'XS (0-9)', class: 'xs' },
  { key: 's', label: 'S (10-29)', class: 's' },
  { key: 'm', label: 'M (30-99)', class: 'm' },
  { key: 'l', label: 'L (100-499)', class: 'l' },
  { key: 'xl', label: 'XL+ (500+)', class: 'xl' },
];

function mockMetricValue(def, level) {
  switch (def.id) {
    case 'cycleTime': return level === 'elite' ? '6.2 h' : level === 'high' ? '18 h' : '32 h';
    case 'leadTime': return level === 'elite' ? '8 h' : level === 'high' ? '20 h' : '2.1 d';
    case 'ttfr': return level === 'elite' ? '45 min' : level === 'high' ? '2.5 h' : '8 h';
    case 'reviewCycles': return level === 'elite' ? '1.1' : level === 'high' ? '1.3' : '2.0';
    case 'changeFailureRate': return level === 'elite' ? '12%' : level === 'high' ? '18%' : '24%';
    default: return '—';
  }
}

function mockPrSizes(seed = 0) {
  const bases = [[18, 28, 32, 16, 6], [12, 22, 38, 20, 8], [25, 30, 28, 12, 5]];
  return bases[Math.abs(seed) % bases.length];
}

// Valores numéricos para gráficos (horas)
function mockNumericValue(metricId, level, weekIndex) {
  const base = level === 'elite' ? 0.7 : level === 'high' ? 1.2 : 2;
  const trend = 1 + (weekIndex * 0.01);
  switch (metricId) {
    case 'cycleTime': return Math.round((6 + base * 8) * trend * 10) / 10;
    case 'leadTime': return Math.round((8 + base * 6) * trend * 10) / 10;
    case 'ttfr': return Math.round((1 + base * 2) * trend * 10) / 10;
    default: return 0;
  }
}

// Metrics utils: use window.MetricsUtils if loaded (metrics-utils.js), else inline
var getWeekStart, last12Weeks, getWeeksInRange, median, sizeBucket, levelFromMetrics, metricLevelForValue, formatHours, formatReviewCycles;
if (typeof window !== 'undefined' && window.MetricsUtils) {
  var _u = window.MetricsUtils;
  getWeekStart = _u.getWeekStart;
  last12Weeks = _u.last12Weeks;
  getWeeksInRange = _u.getWeeksInRange;
  median = _u.median;
  sizeBucket = _u.sizeBucket;
  levelFromMetrics = _u.levelFromMetrics;
  metricLevelForValue = _u.metricLevelForValue;
  formatHours = _u.formatHours;
  formatReviewCycles = _u.formatReviewCycles;
  getWeeksInRange = _u.getWeeksInRange;
} else {
  getWeeksInRange = function(fromDateStr, toDateStr) {
    let m = new Date(getWeekStart(fromDateStr) + 'T12:00:00Z');
    const end = new Date(getWeekStart(toDateStr) + 'T12:00:00Z');
    const weeks = [];
    while (m <= end) {
      weeks.push(m.toISOString().slice(0, 10));
      m.setUTCDate(m.getUTCDate() + 7);
    }
    return weeks;
  };
  getWeekStart = function(isoDateStr) {
    const d = new Date(isoDateStr + 'T12:00:00Z');
    const day = d.getUTCDay();
    const toMonday = (day + 6) % 7;
    d.setUTCDate(d.getUTCDate() - toMonday);
    return d.toISOString().slice(0, 10);
  };
  last12Weeks = function() {
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
  };
  median = function(arr) {
    if (!arr || arr.length === 0) return 0;
    const a = arr.filter((x) => x != null && !Number.isNaN(x)).sort((x, y) => x - y);
    if (a.length === 0) return 0;
    const m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  };
  sizeBucket = function(lines) {
    if (lines <= 9) return 0;
    if (lines <= 29) return 1;
    if (lines <= 99) return 2;
    if (lines <= 499) return 3;
    return 4;
  };
  levelFromMetrics = function(leadTimeH, ttfrH, reviewCycles) {
    const leadOk = leadTimeH < 12;
    const leadHigh = leadTimeH < 24;
    const ttfrOk = ttfrH < 1;
    const ttfrHigh = ttfrH < 4;
    const cycleOk = reviewCycles != null && reviewCycles <= 1.2;
    if (leadOk && ttfrOk && cycleOk) return 'elite';
    if (leadHigh && ttfrHigh) return 'high';
    return 'low';
  };
  metricLevelForValue = function(metricId, value) {
    if (value == null || Number.isNaN(value)) return null;
    switch (metricId) {
      case 'cycleTime': if (value < 8) return 'elite'; if (value < 24) return 'high'; return 'low';
      case 'leadTime': if (value < 12) return 'elite'; if (value < 24) return 'high'; return 'low';
      case 'ttfr': if (value < 1) return 'elite'; if (value < 4) return 'high'; return 'low';
      case 'reviewCycles': if (value <= 1.1) return 'elite'; if (value <= 1.2) return 'high'; return 'low';
      case 'changeFailureRate': return null;
      default: return null;
    }
  };
  formatHours = function(h) {
    if (h == null || Number.isNaN(h)) return '—';
    if (h < 1) return Math.round(h * 60) + ' min';
    if (h < 24) return (Math.round(h * 10) / 10) + ' h';
    return (Math.round((h / 24) * 10) / 10) + ' d';
  };
  formatReviewCycles = function(n) {
    if (n == null || Number.isNaN(n)) return '—';
    return (Math.round(n * 10) / 10).toString();
  };
}
const formatHoursGlobal = formatHours;
const formatReviewCyclesGlobal = formatReviewCycles;
function formatCycleTime(h) {
  return formatHours(h);
}

// (last12Weeks, getWeekStart, median, etc. from MetricsUtils or inline above)
function mockTrendData(level) {
  const weeks = last12Weeks();
  return {
    labels: weeks.map(w => w.slice(5)),
    cycleTime: weeks.map((_, i) => mockNumericValue('cycleTime', level, i)),
    leadTime: weeks.map((_, i) => mockNumericValue('leadTime', level, i)),
    ttfr: weeks.map((_, i) => mockNumericValue('ttfr', level, i)),
  };
}

function mockThroughputData() {
  const weeks = last12Weeks();
  return {
    labels: weeks.map(w => w.slice(5)),
    merged: weeks.map((_, i) => 12 + Math.floor(Math.random() * 14) + (i > 6 ? 3 : 0)),
  };
}

function mockFailureRateData(level) {
  const weeks = last12Weeks();
  const base = level === 'elite' ? 10 : level === 'high' ? 16 : 22;
  return {
    labels: weeks.map(w => w.slice(5)),
    data: weeks.map((_, i) => base + (i % 3) * 2),
  };
}

function mockReviewCyclesData(level) {
  const weeks = last12Weeks();
  const base = level === 'elite' ? 1.1 : level === 'high' ? 1.3 : 1.6;
  return {
    labels: weeks.map(w => w.slice(5)),
    data: weeks.map((_, i) => Math.round((base + (i % 5) * 0.05) * 10) / 10),
  };
}

// Desglose cycle time: pickup (espera 1ª revisión), revisión, post-aprobación (time to resolve)
function mockCycleBreakdown(level) {
  if (level === 'elite') return { pickup: 25, review: 50, resolve: 25 };
  if (level === 'high') return { pickup: 40, review: 40, resolve: 20 };
  return { pickup: 55, review: 30, resolve: 15 };
}

// Distribución cycle time: % PRs en 0-12h, 12-24h, 24-48h, 48h+
function mockCycleDistribution(level) {
  if (level === 'elite') return [45, 35, 15, 5];
  if (level === 'high') return [30, 35, 25, 10];
  return [15, 25, 30, 30];
}

// PRs abiertas mock (por repo)
function mockOpenPrsCount(repoName, seed) {
  const s = (seed || 0) % 5;
  return s === 0 ? 6 : s === 1 ? 12 : s === 2 ? 4 : s === 3 ? 18 : 8;
}

// --- Real metrics from GitHub (formulas) ---
// Lead Time (h) = (merged_at - created_at) / 3600000
// TTFR (h) = (first_review_at - created_at) / 3600000  (first human/IA review)
// Review cycles = 1 + count(CHANGES_REQUESTED)
// PR size buckets: XS 0-9, S 10-29, M 30-99, L 100-499, XL+ 500+ (additions+deletions)
// Cycle time distribution: % of PRs by lead time in 0-12h, 12-24h, 24-48h, 48h+
// (median, sizeBucket, levelFromMetrics, metricLevelForValue, formatHours, formatReviewCycles from MetricsUtils or inline above)

// Last activity: "Last activity: 2 months ago" (English)
function formatRelativeTime(isoDateStr) {
  if (!isoDateStr) return '';
  const d = new Date(isoDateStr);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  if (diffDays < 1) return 'Last activity: today';
  if (diffDays === 1) return 'Last activity: 1 day ago';
  if (diffDays < 7) return 'Last activity: ' + diffDays + ' days ago';
  if (diffWeeks === 1) return 'Last activity: 1 week ago';
  if (diffWeeks < 4) return 'Last activity: ' + diffWeeks + ' weeks ago';
  if (diffMonths === 1) return 'Last activity: 1 month ago';
  if (diffMonths < 12) return 'Last activity: ' + diffMonths + ' months ago';
  if (diffYears === 1) return 'Last activity: 1 year ago';
  return 'Last activity: ' + diffYears + ' years ago';
}

function formatShortDate(isoDateStr) {
  if (!isoDateStr) return '';
  const d = new Date(isoDateStr);
  if (Number.isNaN(d.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return d.getUTCDate() + ' ' + months[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
}

function relativeTimeShort(isoDateStr) {
  if (!isoDateStr) return '';
  const d = new Date(isoDateStr);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  if (diffDays < 1) return 'today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return diffDays + ' days ago';
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 4) return diffWeeks + ' weeks ago';
  if (diffMonths === 1) return '1 month ago';
  if (diffMonths < 12) return diffMonths + ' months ago';
  if (diffYears === 1) return '1 year ago';
  return diffYears + ' years ago';
}

// Fill nulls with previous value (or 0) so trend lines stay visible with sparse real data
function fillNullsForward(arr) {
  if (!arr || !arr.length) return arr || [];
  const out = [];
  let last = 0;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (v != null && !Number.isNaN(v)) {
      last = v;
      out.push(Math.round(v * 10) / 10);
    } else {
      out.push(last);
    }
  }
  return out;
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  layout: { padding: { left: 24, right: 24, top: 20, bottom: 20 } },
  plugins: { legend: { position: 'bottom' } },
};

createApp({
  data() {
    return {
      orgName: 'monokera-tech',
      githubToken: '',
      repos: [],
      loadingRepos: false,
      loadingMetrics: false,
      reposError: '',
      tokenHint: '',
      module: 'resumen',
      vistaProyecto: 'comparativa', // 'comparativa' | 'individual'
      selectedRepo: '',
      contributorsScope: 'org', // 'org' or repo name for per-repo contributors
      contributorsFilter: '',
      contributorsPage: 1,
      contributorsPageSize: 15,
      aggregateLevel: null, // only set after real metrics loaded
      projectLevels: {},
      aggregatePrPcts: null, // only set after real metrics loaded
      projectPrPcts: {},
      charts: {},
      realMetrics: {
        loaded: false,
        loading: false,
        error: null,
        byRepo: {},
        global: null,
        repoErrors: [], // { name, message } for repos that failed to load
      },
      repoLastCommits: {}, // { [repoName]: { date: iso, sha } } from REST API
      metricDefs: METRIC_DEFS,
      dateFrom: '',
      dateTo: '',
      prsPerRepoLimit: 1000, // max merged PRs fetched per repo (with pagination)
    };
  },
  computed: {
    repoErrorsSummary() {
      const errs = this.realMetrics.repoErrors || [];
      if (!errs.length) return null;
      const firstMsg = errs[0].message || 'Unknown error';
      const names = errs.map((e) => e.name);
      const maxShow = 8;
      const listText = names.length <= maxShow ? names.join(', ') : names.slice(0, maxShow).join(', ') + ', and ' + (names.length - maxShow) + ' more';
      return { message: firstMsg, listText, count: names.length };
    },
    healthStatus() {
      return this.aggregateLevel;
    },
    healthLabel() {
      const l = this.aggregateLevel;
      if (l == null) return 'No data';
      return l === 'elite' ? 'Elite' : l === 'high' ? 'High' : 'Needs improvement';
    },
    summaryKpis() {
      const g = this.realMetrics.loaded && this.realMetrics.global ? this.realMetrics.global : null;
      return METRIC_DEFS.map((def) => {
        let value;
        let level = null;
        if (def.id === 'changeFailureRate') {
          value = 'No data (deploy data required)';
        } else if (g) {
          if (def.id === 'cycleTime' || def.id === 'leadTime') {
            value = formatHours(g.leadTimeMedianH);
            level = metricLevelForValue(def.id, g.leadTimeMedianH);
          } else if (def.id === 'ttfr') {
            value = formatHours(g.ttfrMedianH);
            level = metricLevelForValue(def.id, g.ttfrMedianH);
          } else if (def.id === 'reviewCycles') {
            value = formatReviewCycles(g.reviewCyclesMedian);
            level = metricLevelForValue(def.id, g.reviewCyclesMedian);
          } else {
            value = formatHours(g.leadTimeMedianH);
            level = metricLevelForValue(def.id, g.leadTimeMedianH);
          }
        } else {
          value = 'No data';
        }
        const dataNote = def.id === 'cycleTime' && g ? 'Same value as Lead Time (GitHub does not provide commit→deploy).' : null;
        return { ...def, value, level, dataNote };
      });
    },
    resumenRecomendacion() {
      const g = this.realMetrics.loaded && this.realMetrics.global ? this.realMetrics.global : null;
      if (!g || this.aggregateLevel == null) return 'Load metrics to see data and recommendations.';
      const lead = g.leadTimeMedianH;
      const ttfr = g.ttfrMedianH;
      const cycles = g.reviewCyclesMedian;
      const xlPct = ((this.aggregatePrPcts && this.aggregatePrPcts[4]) || 0) + ((this.aggregatePrPcts && this.aggregatePrPcts[3]) || 0);
      const issues = [];
      if (ttfr != null && ttfr >= 4) issues.push('TTFR above 4h (current median ' + formatHours(ttfr) + ')');
      else if (ttfr != null && ttfr >= 1) issues.push('TTFR could improve toward &lt; 1h (current ' + formatHours(ttfr) + ')');
      if (lead != null && lead >= 24) issues.push('Lead Time above 24h (' + formatHours(lead) + ')');
      else if (lead != null && lead >= 12) issues.push('Lead Time could improve toward &lt; 12h (' + formatHours(lead) + ')');
      if (cycles != null && cycles > 1.2) issues.push('Review cycles above 1.2 (median ' + formatReviewCycles(cycles) + ')');
      if (xlPct > 25) issues.push('High % of large PRs (L+XL: ' + xlPct + '%)');
      if (issues.length === 0) return 'Metrics in or near target range. Keep size limits (&lt; 200 LOC), low TTFR, and peer review.';
      if (issues.length === 1) return 'Focus: ' + issues[0] + '. Set review SLA and CODEOWNERS to improve.';
      return 'Priorities: ' + issues.slice(0, 3).join('; ') + '. Review reviewer assignment and PR size.';
    },
    aggregateMetrics() {
      const g = this.realMetrics.loaded && this.realMetrics.global ? this.realMetrics.global : null;
      return METRIC_DEFS.map((def) => {
        let value;
        let level = null;
        if (def.id === 'changeFailureRate') {
          value = 'No data (deploy data required)';
        } else if (g) {
          if (def.id === 'cycleTime' || def.id === 'leadTime') {
            value = formatHours(g.leadTimeMedianH);
            level = metricLevelForValue(def.id, g.leadTimeMedianH);
          } else if (def.id === 'ttfr') {
            value = formatHours(g.ttfrMedianH);
            level = metricLevelForValue(def.id, g.ttfrMedianH);
          } else if (def.id === 'reviewCycles') {
            value = formatReviewCycles(g.reviewCyclesMedian);
            level = metricLevelForValue(def.id, g.reviewCyclesMedian);
          } else {
            value = formatHours(g.leadTimeMedianH);
            level = metricLevelForValue(def.id, g.leadTimeMedianH);
          }
        } else {
          value = 'No data';
        }
        const dataNote = def.id === 'cycleTime' && g ? 'Same value as Lead Time (GitHub does not provide commit→deploy).' : null;
        return { ...def, value, level, dataNote };
      });
    },
    aggregatePrSizes() {
      const pcts = this.aggregatePrPcts;
      return PR_SIZE_LABELS.map((p, i) => ({ ...p, percent: (pcts && pcts[i]) ?? 0 }));
    },
    tokenHint() {
      if (this.reposError && this.orgName.toLowerCase().includes('monokera') && !this.githubToken)
        return 'If the organization or repos are private, create a Personal Access Token (scope repo and read:org) and enter it above.';
      return '';
    },
    lastActivityText() {
      const g = this.realMetrics.loaded && this.realMetrics.global ? this.realMetrics.global : null;
      const at = g && g.lastActivityAt ? g.lastActivityAt : null;
      return at ? formatRelativeTime(at) : '';
    },
    trendHasData() {
      const g = this.realMetrics.loaded && this.realMetrics.global ? this.realMetrics.global : null;
      if (!g) return false;
      const throughput = g.throughputByWeek || [];
      if (throughput.some((v) => v > 0)) return true;
      const lead = g.trendLeadTime || [];
      return lead.some((v) => v != null && v > 0);
    },
    individualTrendAllZeros() {
      if (!this.selectedRepo || !this.realMetrics.loaded) return false;
      const r = this.realMetrics.byRepo[this.selectedRepo];
      if (!r || !this.projectDataStatus(this.selectedRepo).hasData) return false;
      const lead = (r.trendLeadTime || []).filter((v) => v != null && v > 0);
      const ttfr = (r.trendTtfr || []).filter((v) => v != null && v > 0);
      return lead.length === 0 && ttfr.length === 0;
    },
    getWeekList() {
      const from = (this.dateFrom || '').trim();
      const to = (this.dateTo || '').trim();
      if (from && to && typeof getWeeksInRange === 'function') {
        try {
          const w = getWeeksInRange(from, to);
          if (w && w.length > 0) return w;
        } catch (e) {}
      }
      return last12Weeks();
    },
    weekCount() {
      const list = this.getWeekList;
      return (list && list.length) ? list.length : 12;
    },
    weekCountLabel() {
      const n = this.weekCount;
      const hasRange = !!(this.dateFrom || '').trim() && !!(this.dateTo || '').trim();
      if (n === 12 && !hasRange) return 'last 12 weeks';
      return hasRange ? 'selected period (' + n + ' weeks)' : 'last ' + n + ' weeks';
    },
    leadTimeByRepo() {
      const real = this.realMetrics.loaded && this.realMetrics.byRepo;
      return this.repos.map((r) => {
        const raw = real && real[r.name] ? real[r.name].leadTimeMedianH : 0;
        const val = typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? raw : 0;
        return { name: r.name, value: val };
      });
    },
    contributorsList() {
      if (!this.realMetrics.loaded || !this.realMetrics.byRepo) return [];
      const scope = this.contributorsScope;
      const repos = scope === 'org' ? Object.keys(this.realMetrics.byRepo) : (scope ? [scope] : []);
      const merged = {};
      for (const repoName of repos) {
        const repo = this.realMetrics.byRepo[repoName];
        if (!repo) continue;
        const byAuthor = repo.byAuthor || {};
        const byReviewer = repo.byReviewer || {};
        for (const [login, a] of Object.entries(byAuthor)) {
          if (!merged[login]) merged[login] = { login, mergedPrs: 0, leadTimes: [], ttfrList: [], cyclesList: [], sizeBuckets: [0, 0, 0, 0, 0], reviewCount: 0, asFirstReviewer: 0, changesRequested: 0 };
          merged[login].mergedPrs += (a.leadTimes && a.leadTimes.length) || 0;
          (a.leadTimes || []).forEach((v) => merged[login].leadTimes.push(v));
          (a.ttfrList || []).forEach((v) => merged[login].ttfrList.push(v));
          (a.cyclesList || []).forEach((v) => merged[login].cyclesList.push(v));
          for (let i = 0; i < 5; i++) merged[login].sizeBuckets[i] += (a.sizeBuckets && a.sizeBuckets[i]) || 0;
        }
        for (const [login, r] of Object.entries(byReviewer)) {
          if (!merged[login]) merged[login] = { login, mergedPrs: 0, leadTimes: [], ttfrList: [], cyclesList: [], sizeBuckets: [0, 0, 0, 0, 0], reviewCount: 0, asFirstReviewer: 0, changesRequested: 0 };
          merged[login].reviewCount += r.reviewCount || 0;
          merged[login].asFirstReviewer += r.asFirstReviewer || 0;
          merged[login].changesRequested += r.changesRequested || 0;
        }
      }
      return Object.values(merged)
        .map((c) => {
          const totalSize = c.sizeBuckets.reduce((a, b) => a + b, 0);
          const sizePcts = totalSize ? c.sizeBuckets.map((b) => Math.round((b / totalSize) * 100)) : [0, 0, 0, 0, 0];
          const collaborationRatio = c.reviewCount > 0 ? (c.mergedPrs / c.reviewCount).toFixed(1) : (c.mergedPrs ? '—' : '—');
          return {
            login: c.login,
            mergedPrs: c.mergedPrs,
            medianLeadTimeH: c.leadTimes.length ? median(c.leadTimes) : null,
            medianTtfrH: c.ttfrList.length ? median(c.ttfrList) : null,
            medianCycles: c.cyclesList.length ? median(c.cyclesList) : null,
            sizePcts,
            reviewCount: c.reviewCount,
            asFirstReviewer: c.asFirstReviewer,
            changesRequested: c.changesRequested,
            collaborationRatio,
          };
        })
        .filter((c) => c.mergedPrs > 0 || c.reviewCount > 0)
        .sort((a, b) => (b.mergedPrs + b.reviewCount) - (a.mergedPrs + a.reviewCount));
    },
    contributorsFiltered() {
      const list = this.contributorsList;
      const q = (this.contributorsFilter || '').trim().toLowerCase();
      const filtered = !q ? list : list.filter((c) => (c.login || '').toLowerCase().includes(q));
      return filtered.map((c) => ({ ...c, originalIndex: list.findIndex((x) => x.login === c.login) + 1 }));
    },
    contributorsTotalPages() {
      const n = this.contributorsFiltered.length;
      const size = Math.max(1, this.contributorsPageSize);
      return Math.max(1, Math.ceil(n / size));
    },
    contributorsPageClamped() {
      const total = this.contributorsTotalPages;
      const p = parseInt(this.contributorsPage, 10);
      if (!Number.isFinite(p) || p < 1) return 1;
      return p > total ? total : p;
    },
    contributorsPaginated() {
      const list = this.contributorsFiltered;
      const size = Math.max(1, this.contributorsPageSize);
      const page = this.contributorsPageClamped;
      const start = (page - 1) * size;
      return list.slice(start, start + size);
    },
    chartByRepoHeight() {
      const n = this.leadTimeByRepo.length;
      if (!n) return { height: '400px', minHeight: '400px' };
      const px = n > 50 ? 16 : n > 30 ? 20 : 26;
      const h = n * px;
      return { height: h + 'px', minHeight: h + 'px' };
    },
    recomendacionesOrg() {
      const g = this.realMetrics.loaded && this.realMetrics.global ? this.realMetrics.global : null;
      if (!g || this.aggregateLevel == null) return [{ text: 'No data yet.', action: 'Load metrics to see recommendations.', priority: 'low' }];
      const recs = [];
      const lead = g.leadTimeMedianH;
      const ttfr = g.ttfrMedianH;
      const cycles = g.reviewCyclesMedian;
      const xlPct = ((this.aggregatePrPcts && this.aggregatePrPcts[4]) || 0) + ((this.aggregatePrPcts && this.aggregatePrPcts[3]) || 0);
      if (ttfr != null && ttfr >= 4) {
        recs.push({ text: 'TTFR above 4h (median ' + formatHours(ttfr) + ').', action: 'Set review SLA (e.g. first review in &lt; 48h) and clear queues per team.', priority: 'high' });
      } else if (ttfr != null && ttfr >= 1) {
        recs.push({ text: 'TTFR is ' + formatHours(ttfr) + '; elite target is &lt; 1h.', action: 'Review CODEOWNERS and review queues to reduce wait time.', priority: 'medium' });
      }
      if (lead != null && lead >= 24) {
        recs.push({ text: 'Lead Time above 24h (median ' + formatHours(lead) + ').', action: 'Smaller PRs and faster reviews; aim for &lt; 24h to merge.', priority: 'high' });
      } else if (lead != null && lead >= 12) {
        recs.push({ text: 'Lead Time is ' + formatHours(lead) + '; elite target is &lt; 12h.', action: 'Reduce PR size and review cycles to reach elite.', priority: 'medium' });
      }
      if (cycles != null && cycles > 1.2) {
        recs.push({ text: 'Review cycles median is ' + formatReviewCycles(cycles) + ' (target ≤1.2).', action: 'Clear requirements and feedback to reduce back-and-forth.', priority: 'medium' });
      }
      if (xlPct > 25) {
        recs.push({ text: 'Many large PRs: L+XL represent ' + xlPct + '% of PRs.', action: 'Soft limit 200 LOC; promote stacked or smaller PRs.', priority: 'high' });
      } else if (xlPct > 20) {
        recs.push({ text: 'PR size: ' + xlPct + '% of PRs are L or XL.', action: 'Encourage PRs &lt; 200 LOC where possible.', priority: 'medium' });
      }
      if (this.aggregateLevel !== 'elite') {
        recs.push({ text: 'Elite benchmarks: Lead &lt; 12h, TTFR &lt; 1h, Review cycles ~1.1.', action: 'Use trends and radar to see which metric to improve first.', priority: 'medium' });
      }
      if (recs.length === 0) {
        return [{ text: 'Metrics in target range. Keep current practices.', action: 'Keep monitoring trends.', priority: 'low' }];
      }
      return recs;
    },
  },
  watch: {
    leadTimeByRepo: {
      handler() {
        if (this.module !== 'proyectos') return;
        this.$nextTick(() => this.drawChartByRepo());
      },
      deep: true,
    },
    module(n) {
      if (n === 'tendencias' || n === 'proyectos' || n === 'calidad') {
        this.$nextTick(() => setTimeout(() => this.initChartsForModule(n), 80));
      }
    },
    contributorsFilter() {
      this.contributorsPage = 1;
    },
    contributorsScope() {
      this.contributorsPage = 1;
    },
    vistaProyecto() {
      if (this.module !== 'proyectos') return;
      if (this.vistaProyecto === 'individual' && this.selectedRepo) {
        this.$nextTick(() => this.drawIndividualCharts());
        this.fetchLastCommit(this.selectedRepo);
      } else if (this.vistaProyecto === 'comparativa' && this.repos.length) {
        this.$nextTick(() => setTimeout(() => this.drawChartByRepo(), 50));
      }
    },
    selectedRepo() {
      if (this.module === 'proyectos' && this.vistaProyecto === 'individual' && this.selectedRepo) {
        this.$nextTick(() => this.drawIndividualCharts());
        this.fetchLastCommit(this.selectedRepo);
      }
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.initChartsForModule('resumen');
      if (this.module === 'tendencias') this.initChartsForModule('tendencias');
      if (this.module === 'calidad') this.initChartsForModule('calidad');
    });
  },
  methods: {
    initChartsForModule(mod) {
      if (mod === 'tendencias') {
        this.drawChartTrend();
        this.drawChartThroughput();
      }
      if (mod === 'proyectos' && this.repos.length) {
        this.drawChartByRepo();
        if (this.vistaProyecto === 'individual' && this.selectedRepo) this.drawIndividualCharts();
      }
      if (mod === 'calidad') {
        this.drawChartFailureRate();
        this.drawChartReviewCycles();
        this.drawChartCycleBreakdownOrg();
        this.drawChartCycleDistOrg();
      }
    },
    drawIndividualCharts() {
      const refs = ['chartIndividualTrend', 'chartCycleBreakdown', 'chartCycleDist', 'chartIndividualThroughput', 'chartRadar'];
      refs.forEach((refName) => {
        try {
          const ch = this.charts[refName];
          if (ch) ch.destroy();
        } catch (_) {}
        this.charts[refName] = null;
      });
      if (!this.selectedRepo || typeof this.selectedRepo !== 'string') return;
      if (this.realMetrics.loaded && !this.projectDataStatus(this.selectedRepo).hasData) return;
      const self = this;
      setTimeout(() => {
        self.$nextTick(() => {
          const fns = [
            () => self.drawChartIndividualTrend(),
            () => self.drawChartCycleBreakdown(),
            () => self.drawChartCycleDist(),
            () => self.drawChartIndividualThroughput(),
            () => self.drawChartRadar(),
          ];
          fns.forEach((fn) => {
            try {
              fn();
            } catch (e) {
              console.warn('Chart draw error:', e);
            }
          });
        });
      }, 150);
    },
    destroyChart(refName) {
      const ch = this.charts[refName];
      if (!ch) return;
      try {
        const canvas = ch.canvas;
        if (canvas && typeof document !== 'undefined' && document.body && document.body.contains(canvas)) {
          ch.destroy();
        }
      } catch (_) {}
      this.charts[refName] = null;
    },
    drawChartTrend() {
      const el = this.$refs.chartTrend;
      if (!el || typeof el.getContext !== 'function') return;
      this.destroyChart('chartTrend');
      const weeks = (this.realMetrics.weekList && this.realMetrics.weekList.length) ? this.realMetrics.weekList : last12Weeks();
      const labels = weeks.map((w) => w.slice(5));
      const n = labels.length;
      let cycleData, leadData, ttfrData;
      if (this.realMetrics.loaded && this.realMetrics.global) {
        const g = this.realMetrics.global;
        const rawLead = (g.trendLeadTime || []).slice(0, n).map((v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null));
        const rawTtfr = (g.trendTtfr || []).slice(0, n).map((v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null));
        const pad = (arr) => (arr.length >= n ? arr : [...arr, ...Array(n - arr.length).fill(null)]);
        leadData = fillNullsForward(pad(rawLead));
        ttfrData = fillNullsForward(pad(rawTtfr));
        // With real data we only have Lead Time (PR creation→merge). Cycle Time (commit→deploy) is not available from GitHub, so we show only Lead Time + TTFR to avoid two identical lines.
        cycleData = null;
      }
      if (!leadData || leadData.length !== n) {
        cycleData = cycleData || Array(n).fill(0);
        leadData = Array(n).fill(0);
        ttfrData = Array(n).fill(0);
      }
      if (cycleData === null) cycleData = leadData.slice();
      const useRealData = this.realMetrics.loaded && this.realMetrics.global && this.realMetrics.global.trendLeadTime;
      const datasets = useRealData
        ? [
            { label: 'Lead Time (h)', data: leadData, borderColor: '#3fb950', backgroundColor: 'transparent', tension: 0.3, spanGaps: true },
            { label: 'TTFR (h)', data: ttfrData, borderColor: '#d29922', backgroundColor: 'transparent', tension: 0.3, spanGaps: true },
          ]
        : [
            { label: 'Cycle Time (h)', data: cycleData, borderColor: '#58a6ff', backgroundColor: 'transparent', tension: 0.3, spanGaps: true },
            { label: 'Lead Time (h)', data: leadData, borderColor: '#3fb950', backgroundColor: 'transparent', tension: 0.3, spanGaps: true },
            { label: 'TTFR (h)', data: ttfrData, borderColor: '#d29922', backgroundColor: 'transparent', tension: 0.3, spanGaps: true },
          ];
      const maxY = Math.max(10, ...[cycleData, leadData, ttfrData].flat().filter((v) => typeof v === 'number' && v > 0));
      this.charts.chartTrend = new Chart(el, {
        type: 'line',
        data: { labels, datasets },
        options: {
          ...chartOptions,
          scales: {
            x: { ticks: { padding: 14, maxRotation: 45, maxTicksLimit: 20, autoSkip: true } },
            y: { beginAtZero: true, suggestedMax: maxY, ticks: { padding: 12 } },
          },
        },
      });
    },
    drawChartThroughput() {
      const el = this.$refs.chartThroughput;
      if (!el || typeof el.getContext !== 'function') return;
      this.destroyChart('chartThroughput');
      const weeks = (this.realMetrics.weekList && this.realMetrics.weekList.length) ? this.realMetrics.weekList : last12Weeks();
      const labels = weeks.map((w) => w.slice(5));
      const n = labels.length;
      let merged;
      if (this.realMetrics.loaded && this.realMetrics.global && this.realMetrics.global.throughputByWeek) {
        const raw = this.realMetrics.global.throughputByWeek;
        merged = raw.slice(0, n).map((v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0));
        if (merged.length < n) merged = [...merged, ...Array(n - merged.length).fill(0)];
      } else {
        merged = Array(n).fill(0);
      }
      const maxMerged = Math.max(5, ...(merged || []).filter((v) => typeof v === 'number' && v > 0));
      this.charts.chartThroughput = new Chart(el, {
        type: 'bar',
        data: {
          labels,
          datasets: [{ label: 'Merged PRs', data: merged, backgroundColor: 'rgba(88, 166, 255, 0.7)', borderColor: '#58a6ff', borderWidth: 1 }],
        },
        options: {
          ...chartOptions,
          scales: {
            x: { ticks: { padding: 14, maxRotation: 45, maxTicksLimit: 20, autoSkip: true } },
            y: { beginAtZero: true, suggestedMax: maxMerged, ticks: { padding: 12 } },
          },
        },
      });
    },
    drawChartByRepo() {
      if (this.vistaProyecto !== 'comparativa') return;
      const el = this.$refs.chartByRepo;
      if (!el || typeof el.getContext !== 'function') return;
      this.destroyChart('chartByRepo');
      const data = this.leadTimeByRepo;
      if (!data.length) return;
      const colors = ['#3fb950', '#58a6ff', '#d29922', '#a371f7', '#f85149'];
      const getColor = (i) => colors[i % colors.length];
      const barHeight = data.length > 50 ? 14 : data.length > 30 ? 18 : 24;
      try {
      this.charts.chartByRepo = new Chart(el, {
        type: 'bar',
        data: {
          labels: data.map((d) => (d.name && d.name.length > 32 ? d.name.slice(0, 29) + '…' : d.name || '')),
          datasets: [{
            label: 'Lead Time (h)',
            data: data.map((d) => (typeof d.value === 'number' && Number.isFinite(d.value) && d.value >= 0 ? d.value : 0)),
            backgroundColor: data.map((_, i) => getColor(i) + '99'),
            borderColor: data.map((_, i) => getColor(i)),
            borderWidth: 1,
            maxBarThickness: barHeight,
            barPercentage: 0.85,
            categoryPercentage: 0.75,
          }],
        },
        options: {
          ...chartOptions,
          indexAxis: 'y',
          layout: { padding: { left: 8, right: 24, top: 8, bottom: 8 } },
          scales: {
            x: { beginAtZero: true, title: { display: true, text: 'Hours' } },
            y: {
              ticks: { maxRotation: 0, autoSkip: false, font: { size: data.length > 60 ? 10 : 12 }, padding: 4 },
            },
          },
        },
      });
      } catch (e) { console.warn('chartByRepo', e); }
    },
    drawChartFailureRate() {
      const el = this.$refs.chartFailureRate;
      if (!el || typeof el.getContext !== 'function') return;
      this.destroyChart('chartFailureRate');
      const weeks = last12Weeks();
      const labels = weeks.map((w) => w.slice(5));
      const dataArr = labels.map(() => 0);
      this.charts.chartFailureRate = new Chart(el, {
        type: 'line',
        data: {
          labels,
          datasets: [{ label: 'Change Failure Rate (%)', data: dataArr, borderColor: '#f85149', backgroundColor: 'rgba(248, 81, 73, 0.1)', fill: true, tension: 0.3 }],
        },
        options: { ...chartOptions, scales: { y: { min: 0, max: 30 } } },
      });
    },
    drawChartReviewCycles() {
      const el = this.$refs.chartReviewCycles;
      if (!el || typeof el.getContext !== 'function') return;
      this.destroyChart('chartReviewCycles');
      const weeks = (this.realMetrics.weekList && this.realMetrics.weekList.length) ? this.realMetrics.weekList : last12Weeks();
      const labels = weeks.map((w) => w.slice(5));
      const g = this.realMetrics.loaded && this.realMetrics.global ? this.realMetrics.global : null;
      const medianVal = g && typeof g.reviewCyclesMedian === 'number' && Number.isFinite(g.reviewCyclesMedian) ? Math.round(g.reviewCyclesMedian * 10) / 10 : 0;
      const dataArr = labels.map(() => medianVal);
      this.charts.chartReviewCycles = new Chart(el, {
        type: 'line',
        data: {
          labels,
          datasets: [{ label: 'Review cycles (median)', data: dataArr, borderColor: '#a371f7', backgroundColor: 'rgba(163, 113, 247, 0.1)', fill: true, tension: 0.3 }],
        },
        options: {
          ...chartOptions,
          scales: {
            x: { ticks: { padding: 14, maxRotation: 45, maxTicksLimit: 20, autoSkip: true } },
            y: { min: 0.8, max: 2.2, ticks: { padding: 12 } },
          },
        },
      });
    },
    drawChartCycleBreakdownOrg() {
      const el = this.$refs.chartCycleBreakdownOrg;
      if (!el || typeof el.getContext !== 'function') return;
      this.destroyChart('chartCycleBreakdownOrg');
      const dist = this.realMetrics.loaded && this.realMetrics.global && this.realMetrics.global.cycleDist;
      const data = dist && dist.length >= 4
        ? [dist[3] || 0, (dist[2] || 0) + (dist[1] || 0), dist[0] || 0]
        : [0, 0, 0];
      this.charts.chartCycleBreakdownOrg = new Chart(el, {
        type: 'doughnut',
        data: {
          labels: ['Wait for 1st review (pickup)', 'In review', 'Post-approval'],
          datasets: [{ data, backgroundColor: ['#d29922', '#58a6ff', '#3fb950'], borderWidth: 0 }],
        },
        options: { ...chartOptions },
      });
    },
    drawChartCycleDistOrg() {
      const el = this.$refs.chartCycleDistOrg;
      if (!el || typeof el.getContext !== 'function') return;
      this.destroyChart('chartCycleDistOrg');
      const raw = (this.realMetrics.loaded && this.realMetrics.global && this.realMetrics.global.cycleDist) || [0, 0, 0, 0];
      const d = raw.map((v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0));
      this.charts.chartCycleDistOrg = new Chart(el, {
        type: 'bar',
        data: {
          labels: ['0-12h', '12-24h', '24-48h', '48h+'],
          datasets: [{ label: '% PRs', data: d, backgroundColor: ['#3fb950', '#58a6ff', '#d29922', '#f85149'], borderWidth: 0 }],
        },
        options: { ...chartOptions, scales: { y: { beginAtZero: true, max: 60 } } },
      });
    },
    drawChartIndividualTrend() {
      const el = this.$refs.chartIndividualTrend;
      if (!el || typeof el.getContext !== 'function') return;
      if (typeof document !== 'undefined' && document.body && !document.body.contains(el)) return;
      const weeks = (this.realMetrics.weekList && this.realMetrics.weekList.length) ? this.realMetrics.weekList : last12Weeks();
      const labels = weeks.map((w) => w.slice(5));
      const n = labels.length;
      const r = this.realMetrics.loaded && this.realMetrics.byRepo[this.selectedRepo];
      let cycleData, leadData, ttfrData;
      if (r && (r.trendLeadTime || r.trendTtfr)) {
        const rawLead = (r.trendLeadTime || []).slice(0, n).map((v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null));
        const rawTtfr = (r.trendTtfr || []).slice(0, n).map((v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null));
        const pad = (arr) => (arr.length >= n ? arr : [...arr, ...Array(n - arr.length).fill(null)]);
        leadData = fillNullsForward(pad(rawLead));
        ttfrData = fillNullsForward(pad(rawTtfr));
        cycleData = null;
      }
      if (!leadData || leadData.length !== n) {
        cycleData = Array(n).fill(0);
        leadData = Array(n).fill(0);
        ttfrData = Array(n).fill(0);
      }
      if (cycleData === null) cycleData = leadData.slice();
      const useRealData = this.realMetrics.loaded && this.realMetrics.byRepo[this.selectedRepo] && (this.realMetrics.byRepo[this.selectedRepo].trendLeadTime || []).length > 0;
      const datasets = useRealData
        ? [
            { label: 'Lead Time (h)', data: leadData, borderColor: '#3fb950', backgroundColor: 'transparent', tension: 0.3, spanGaps: true },
            { label: 'TTFR (h)', data: ttfrData, borderColor: '#d29922', backgroundColor: 'transparent', tension: 0.3, spanGaps: true },
          ]
        : [
            { label: 'Cycle Time (h)', data: cycleData, borderColor: '#58a6ff', backgroundColor: 'transparent', tension: 0.3, spanGaps: true },
            { label: 'Lead Time (h)', data: leadData, borderColor: '#3fb950', backgroundColor: 'transparent', tension: 0.3, spanGaps: true },
            { label: 'TTFR (h)', data: ttfrData, borderColor: '#d29922', backgroundColor: 'transparent', tension: 0.3, spanGaps: true },
          ];
      try {
        this.charts.chartIndividualTrend = new Chart(el, {
          type: 'line',
          data: { labels, datasets },
          options: {
            ...chartOptions,
            scales: {
              x: { ticks: { padding: 14, maxRotation: 45, maxTicksLimit: 20, autoSkip: true } },
              y: { beginAtZero: true, ticks: { padding: 12 } },
            },
          },
        });
      } catch (e) { console.warn('chartIndividualTrend', e); }
    },
    drawChartCycleBreakdown() {
      const el = this.$refs.chartCycleBreakdown;
      if (!el || typeof el.getContext !== 'function') return;
      if (typeof document !== 'undefined' && document.body && !document.body.contains(el)) return;
      const r = this.realMetrics.loaded && this.realMetrics.byRepo[this.selectedRepo];
      const raw = (r && r.cycleBreakdown && r.cycleBreakdown.length >= 3) ? r.cycleBreakdown : [0, 0, 0];
      const data = raw.slice(0, 3).map((v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v * 10) / 10 : 0));
      try {
        this.charts.chartCycleBreakdown = new Chart(el, {
          type: 'doughnut',
          data: {
            labels: ['Wait for 1st review (h)', 'In review (h)', 'Post-approval (h)'],
            datasets: [{ data, backgroundColor: ['#d29922', '#58a6ff', '#3fb950'], borderWidth: 0 }],
          },
          options: { ...chartOptions },
        });
      } catch (e) { console.warn('chartCycleBreakdown', e); }
    },
    drawChartCycleDist() {
      const el = this.$refs.chartCycleDist;
      if (!el || typeof el.getContext !== 'function') return;
      if (typeof document !== 'undefined' && document.body && !document.body.contains(el)) return;
      const r = this.realMetrics.loaded && this.realMetrics.byRepo[this.selectedRepo];
      const rawD = (r && r.cycleDist) || [0, 0, 0, 0];
      const d = rawD.map((v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0));
      try {
        this.charts.chartCycleDist = new Chart(el, {
          type: 'bar',
          data: {
            labels: ['0-12h', '12-24h', '24-48h', '48h+'],
            datasets: [{ label: '% PRs', data: d, backgroundColor: ['#3fb950', '#58a6ff', '#d29922', '#f85149'], borderWidth: 0 }],
          },
          options: { ...chartOptions, scales: { y: { beginAtZero: true, max: 60 } } },
        });
      } catch (e) { console.warn('chartCycleDist', e); }
    },
    drawChartIndividualThroughput() {
      const el = this.$refs.chartIndividualThroughput;
      if (!el || typeof el.getContext !== 'function') return;
      if (typeof document !== 'undefined' && document.body && !document.body.contains(el)) return;
      const weeks = (this.realMetrics.weekList && this.realMetrics.weekList.length) ? this.realMetrics.weekList : last12Weeks();
      const labels = weeks.map((w) => w.slice(5));
      const n = labels.length;
      const r = this.realMetrics.loaded && this.realMetrics.byRepo[this.selectedRepo];
      const rawMerged = r && r.throughputByWeek && r.throughputByWeek.length ? r.throughputByWeek.slice(0, n) : [];
      let merged = rawMerged.length ? rawMerged.map((v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0)) : [];
      if (merged.length < n) merged = [...merged, ...Array(n - merged.length).fill(0)];
      try {
        this.charts.chartIndividualThroughput = new Chart(el, {
          type: 'bar',
          data: {
            labels,
            datasets: [{ label: 'Merged PRs', data: merged, backgroundColor: 'rgba(88, 166, 255, 0.7)', borderColor: '#58a6ff', borderWidth: 1 }],
          },
          options: { ...chartOptions, scales: { y: { beginAtZero: true } } },
        });
      } catch (e) { console.warn('chartIndividualThroughput', e); }
    },
    drawChartRadar() {
      const el = this.$refs.chartRadar;
      if (!el || typeof el.getContext !== 'function') return;
      if (typeof document !== 'undefined' && document.body && !document.body.contains(el)) return;
      const r = this.realMetrics.loaded && this.realMetrics.byRepo[this.selectedRepo];
      const eliteScores = [100, 100, 100, 100, 100];
      let projectScores;
      if (r) {
        const score = (v, elite, high) => {
          if (v == null || Number.isNaN(v)) return 50;
          if (v <= elite) return Math.min(100, 95 + (1 - v / elite) * 5);
          if (v <= high) return Math.max(0, 70 - ((v - elite) / (high - elite)) * 25);
          return Math.max(0, 45 - (v - high) * 2);
        };
        projectScores = [
          Math.round(score(r.leadTimeMedianH, 8, 24)),
          Math.round(score(r.leadTimeMedianH, 12, 24)),
          Math.round(score(r.ttfrMedianH, 1, 4)),
          Math.round(score(r.reviewCyclesMedian, 1.1, 1.2)),
          50,
        ].map((s) => (Number.isFinite(s) ? s : 0));
      } else {
        projectScores = [0, 0, 0, 0, 0];
      }
      try {
        this.charts.chartRadar = new Chart(el, {
          type: 'radar',
          data: {
            labels: ['Cycle Time', 'Lead Time', 'TTFR', 'Review Cycles', 'CFR'],
            datasets: [
              { label: 'Elite target', data: eliteScores, borderColor: '#3fb950', backgroundColor: 'rgba(63, 185, 80, 0.1)', borderWidth: 2, pointRadius: 0 },
              { label: 'This project', data: projectScores, borderColor: '#58a6ff', backgroundColor: 'rgba(88, 166, 255, 0.2)', borderWidth: 2 },
            ],
          },
          options: { ...chartOptions, scales: { r: { min: 0, max: 100 } } },
        });
      } catch (e) { console.warn('chartRadar', e); }
    },
    mockOpenPrs(repoName) {
      const idx = this.repos.findIndex((r) => r.name === repoName);
      return mockOpenPrsCount(repoName, idx);
    },
    wipStatus(repoName) {
      const n = this.getOpenPrs(repoName);
      return n <= 10 ? 'ok' : 'high';
    },
    wipRecomendacion(repoName) {
      const n = this.getOpenPrs(repoName);
      return n > 10 ? 'Above recommended limit. Reduce WIP (close or prioritize PRs) to improve review time.' : 'Within recommended range. Elite teams usually keep &lt; 10 open PRs per repo.';
    },
    recomendacionesProyecto(repoName) {
      const r = this.realMetrics.loaded && this.realMetrics.byRepo[repoName];
      if (!r) return [{ text: 'No data for this project.', action: 'Load real metrics to see recommendations.', priority: 'low' }];
      const recs = [];
      const lead = r.leadTimeMedianH;
      const ttfr = r.ttfrMedianH;
      const cycles = r.reviewCyclesMedian;
      const openPrs = this.getOpenPrs(repoName);
      const pcts = this.projectPrPcts[repoName] || [];
      const xlPct = (pcts[4] || 0) + (pcts[3] || 0);
      if (ttfr != null && ttfr >= 4) {
        recs.push({ text: 'TTFR is ' + formatHours(ttfr) + ' (target &lt; 4h).', action: 'Assign reviewers in CODEOWNERS; set SLA for first review.', priority: 'high' });
      } else if (ttfr != null && ttfr >= 1) {
        recs.push({ text: 'TTFR is ' + formatHours(ttfr) + '; elite &lt; 1h.', action: 'Review queues and assignment to reduce wait.', priority: 'medium' });
      }
      if (lead != null && lead >= 24) {
        recs.push({ text: 'Lead Time is ' + formatHours(lead) + ' (target &lt; 24h).', action: 'Smaller PRs and faster reviews for this repo.', priority: 'high' });
      } else if (lead != null && lead >= 12) {
        recs.push({ text: 'Lead Time is ' + formatHours(lead) + '; elite &lt; 12h.', action: 'Reduce PR size and review cycles.', priority: 'medium' });
      }
      if (cycles != null && cycles > 1.2) {
        recs.push({ text: 'Review cycles median is ' + formatReviewCycles(cycles) + ' (target ≤1.2).', action: 'Clear feedback and requirements to reduce rework.', priority: 'medium' });
      }
      if (xlPct > 25) {
        recs.push({ text: 'L+XL PRs are ' + xlPct + '% of this repo.', action: 'Promote PRs &lt; 200 LOC and stacked changes.', priority: 'high' });
      }
      if (openPrs > 10) {
        recs.push({ text: 'Open PRs: ' + openPrs + ' (recommended &lt; 10).', action: 'Close or prioritize; limit WIP to improve review time.', priority: 'medium' });
      }
      if (recs.length === 0) {
        return [{ text: 'Project metrics in range.', action: 'Keep monitoring.', priority: 'low' }];
      }
      recs.push({ text: 'Use the radar chart to see which dimension to improve first.', action: 'Compare with elite target in Quality / Single project.', priority: 'low' });
      return recs;
    },
    async fetchRealMetrics() {
      const org = (this.orgName || '').trim();
      const token = (this.githubToken || '').trim();
      if (!token) {
        this.realMetrics.error = 'GitHub token is required to load real metrics.';
        return;
      }
      if (!this.repos.length) {
        this.realMetrics.error = 'No projects loaded. Use Load metrics first.';
        return;
      }
      this.realMetrics.loading = true;
      this.realMetrics.error = null;
      this.realMetrics.loaded = false;
      this.realMetrics.byRepo = {};
      this.realMetrics.global = null;
      this.realMetrics.repoErrors = [];
      const prsPerRepoLimit = this.prsPerRepoLimit;
      const query = `query($owner: String!, $name: String!, $cursor: String) {
  repository(owner: $owner, name: $name) {
    name
    pullRequests(first: 100, after: $cursor, states: [MERGED], orderBy: {field: UPDATED_AT, direction: DESC}) {
      pageInfo { hasNextPage, endCursor }
      nodes {
        createdAt
        mergedAt
        additions
        deletions
        author { login }
        reviews(first: 25) { nodes { submittedAt, state, author { login } } }
      }
    }
  }
}`;
      try {
        const weekList = this.getWeekList;
        this.realMetrics.weekList = weekList;
        const byRepo = {};
        const allLeadTimes = [];
        const allTtfr = [];
        const allCycles = [];
        const allSizes = [0, 0, 0, 0, 0];
        const maxRepos = Math.min(this.repos.length, 100);
        const emptyRepoData = () => ({
          leadTimeMedianH: 0,
          ttfrMedianH: 0,
          reviewCyclesMedian: 0,
          prSizePcts: [0, 0, 0, 0, 0],
          openPrs: 0,
          prCount: 0,
          throughputByWeek: weekList.map(() => 0),
          trendLeadTime: weekList.map(() => null),
          trendTtfr: weekList.map(() => null),
          cycleDist: [0, 0, 0, 0],
          cycleBreakdown: [0, 0, 0],
          lastActivityAt: null,
          byAuthor: {},
          byReviewer: {},
        });
        this.repos.forEach((r) => {
          if (r && r.name) byRepo[r.name] = emptyRepoData();
        });
        for (let i = 0; i < maxRepos; i++) {
          const repo = this.repos[i];
          const name = repo.name;
          let allNodes = [];
          let graphqlError = null;
          try {
            let cursor = null;
            do {
              const res = await fetch('https://api.github.com/graphql', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: 'Bearer ' + token,
                },
                body: JSON.stringify({
                  query,
                  variables: { owner: org, name, cursor },
                }),
              });
              const json = await res.json();
              if (json.errors && json.errors.length) {
                graphqlError = json.errors[0].message || 'GraphQL error';
                break;
              }
              const repoData = json.data?.repository;
              if (!repoData?.pullRequests?.nodes) break;
              const nodes = repoData.pullRequests.nodes;
              allNodes = allNodes.concat(nodes);
              const pageInfo = repoData.pullRequests.pageInfo || {};
              if (!pageInfo.hasNextPage || allNodes.length >= prsPerRepoLimit) break;
              cursor = pageInfo.endCursor;
              if (cursor && allNodes.length < prsPerRepoLimit) await new Promise((r) => setTimeout(r, 150));
            } while (cursor);
          } catch (err) {
            graphqlError = err.message || 'Network error';
          }
          if (graphqlError) {
            byRepo[name] = emptyRepoData();
            this.realMetrics.repoErrors.push({ name, message: graphqlError });
            if (i < maxRepos - 1) await new Promise((r) => setTimeout(r, 200));
            continue;
          }
          const prs = allNodes;
          try {
          const leadTimes = [];
          const ttfrList = [];
          const cyclesList = [];
          const sizeCounts = [0, 0, 0, 0, 0];
          const cycleBuckets = [0, 0, 0, 0];
          const weeks = weekList;
          const weekSet = new Set(weeks);
          const mergedByWeek = {};
          const leadByWeek = {};
          const ttfrByWeek = {};
          const byAuthor = {};
          const byReviewer = {};
          for (const pr of prs) {
            const created = new Date(pr.createdAt).getTime();
            const merged = pr.mergedAt ? new Date(pr.mergedAt).getTime() : null;
            if (!merged) continue;
            // Lead Time = merged_at - created_at (hours). Sanitize: no negative, no NaN/Infinity
            let leadH = (merged - created) / (1000 * 60 * 60);
            if (Number.isNaN(leadH) || !Number.isFinite(leadH) || leadH < 0) continue;
            leadTimes.push(leadH);
            allLeadTimes.push(leadH);
            const reviews = pr.reviews?.nodes || [];
            let firstReviewAt = null;
            let firstReviewerLogin = null;
            let changesRequested = 0;
            for (const rev of reviews) {
              if (rev.submittedAt && !firstReviewAt) {
                firstReviewAt = new Date(rev.submittedAt).getTime();
                firstReviewerLogin = rev.author?.login || null;
              }
              if (rev.state === 'CHANGES_REQUESTED') changesRequested++;
              const reviewerLogin = rev.author?.login;
              if (reviewerLogin) {
                byReviewer[reviewerLogin] = byReviewer[reviewerLogin] || { reviewCount: 0, asFirstReviewer: 0, changesRequested: 0 };
                byReviewer[reviewerLogin].reviewCount++;
                if (rev.state === 'CHANGES_REQUESTED') byReviewer[reviewerLogin].changesRequested++;
              }
            }
            if (firstReviewerLogin) {
              byReviewer[firstReviewerLogin] = byReviewer[firstReviewerLogin] || { reviewCount: 0, asFirstReviewer: 0, changesRequested: 0 };
              byReviewer[firstReviewerLogin].asFirstReviewer++;
            }
            // TTFR = first_review_at - created_at (hours)
            let ttfrH = firstReviewAt ? (firstReviewAt - created) / (1000 * 60 * 60) : null;
            if (ttfrH != null) {
              if (!Number.isNaN(ttfrH) && Number.isFinite(ttfrH) && ttfrH >= 0) {
                ttfrList.push(ttfrH);
                allTtfr.push(ttfrH);
              }
            }
            const cycles = Math.max(1, changesRequested + 1);
            cyclesList.push(cycles);
            allCycles.push(cycles);
            const lines = (pr.additions || 0) + (pr.deletions || 0);
            const bucket = sizeBucket(lines);
            sizeCounts[bucket]++;
            allSizes[bucket]++;
            const weekKey = getWeekStart(pr.mergedAt.slice(0, 10));
            if (weekSet.has(weekKey)) {
              mergedByWeek[weekKey] = (mergedByWeek[weekKey] || 0) + 1;
              if (!leadByWeek[weekKey]) leadByWeek[weekKey] = [];
              leadByWeek[weekKey].push(leadH);
              if (ttfrH != null && !Number.isNaN(ttfrH) && ttfrH >= 0) {
                if (!ttfrByWeek[weekKey]) ttfrByWeek[weekKey] = [];
                ttfrByWeek[weekKey].push(ttfrH);
              }
            }
            if (leadH <= 12) cycleBuckets[0]++;
            else if (leadH <= 24) cycleBuckets[1]++;
            else if (leadH <= 48) cycleBuckets[2]++;
            else cycleBuckets[3]++;
            const authorLogin = pr.author?.login;
            if (authorLogin) {
              byAuthor[authorLogin] = byAuthor[authorLogin] || { leadTimes: [], ttfrList: [], cyclesList: [], sizeBuckets: [0, 0, 0, 0, 0] };
              byAuthor[authorLogin].leadTimes.push(leadH);
              if (ttfrH != null && !Number.isNaN(ttfrH) && ttfrH >= 0) byAuthor[authorLogin].ttfrList.push(ttfrH);
              byAuthor[authorLogin].cyclesList.push(cycles);
              byAuthor[authorLogin].sizeBuckets[bucket]++;
            }
          }
          const total = sizeCounts.reduce((a, b) => a + b, 0);
          const prSizePcts = total ? sizeCounts.map((c) => Math.round((c / total) * 100)) : [0, 0, 0, 0, 0];
          const cycleTotal = cycleBuckets.reduce((a, b) => a + b, 0);
          const cycleDist = cycleTotal ? cycleBuckets.map((c) => Math.round((c / cycleTotal) * 100)) : [0, 0, 0, 0];
          const throughputByWeek = weeks.map((w) => mergedByWeek[w] || 0);
          const trendLeadTime = weeks.map((w) => {
            const arr = leadByWeek[w];
            return arr && arr.length ? median(arr) : null;
          });
          const trendTtfr = weeks.map((w) => {
            const arr = ttfrByWeek[w];
            return arr && arr.length ? median(arr) : null;
          });
          let openPrs = 0;
          try {
            const or = await fetch(`https://api.github.com/repos/${encodeURIComponent(org)}/${encodeURIComponent(name)}/pulls?state=open&per_page=1`, {
              headers: { Authorization: 'Bearer ' + token },
            });
            const link = or.headers.get('Link');
            if (link && link.includes('rel="last"')) {
              const m = link.match(/page=(\d+)>; rel="last"/);
              openPrs = m ? parseInt(m[1], 10) : 0;
            } else openPrs = (await or.json()).length;
          } catch (_) {}
          const lastActivityAt = prs.length && prs[0].mergedAt ? prs[0].mergedAt : null;
          const leadMed = median(leadTimes);
          const ttfrMed = median(ttfrList);
          const reviewPlusPost = Math.max(0, (leadMed || 0) - (ttfrMed || 0));
          const cycleBreakdown = [
            Math.round((ttfrMed || 0) * 10) / 10,
            Math.round((reviewPlusPost * 0.5) * 10) / 10,
            Math.round((reviewPlusPost * 0.5) * 10) / 10,
          ];
          byRepo[name] = {
            leadTimeMedianH: leadMed,
            ttfrMedianH: ttfrMed,
            reviewCyclesMedian: median(cyclesList),
            prSizePcts,
            openPrs,
            prCount: prs.length,
            throughputByWeek,
            trendLeadTime,
            trendTtfr,
            cycleDist,
            cycleBreakdown,
            lastActivityAt,
            byAuthor,
            byReviewer,
          };
          } catch (err) {
            byRepo[name] = emptyRepoData();
            this.realMetrics.repoErrors.push({ name, message: err.message || 'Processing error' });
          }
          if (i < maxRepos - 1) await new Promise((r) => setTimeout(r, 200));
        }
        const totalSize = allSizes.reduce((a, b) => a + b, 0);
        const globalPrSizePcts = totalSize ? allSizes.map((c) => Math.round((c / totalSize) * 100)) : [0, 0, 0, 0, 0];
        const globalThroughput = weekList.map(() => 0);
        const trendLeadByWeek = weekList.map(() => []);
        const trendTtfrByWeek = weekList.map(() => []);
        Object.values(byRepo).forEach((r) => {
          r.throughputByWeek.forEach((v, i) => { globalThroughput[i] += (typeof v === 'number' ? v : 0); });
          (r.trendLeadTime || []).forEach((v, i) => {
            if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && i < trendLeadByWeek.length) trendLeadByWeek[i].push(v);
          });
          (r.trendTtfr || []).forEach((v, i) => {
            if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && i < trendTtfrByWeek.length) trendTtfrByWeek[i].push(v);
          });
        });
        const globalTrendLead = trendLeadByWeek.map((arr) => (arr.length ? median(arr) : null));
        const globalTrendTtfr = trendTtfrByWeek.map((arr) => (arr.length ? median(arr) : null));
        const globalCycleDist = [0, 0, 0, 0];
        const repoCount = Object.keys(byRepo).length;
        if (repoCount > 0) {
          for (let k = 0; k < 4; k++) {
            let s = 0;
            Object.values(byRepo).forEach((br) => { s += (br.cycleDist && br.cycleDist[k]) || 0; });
            globalCycleDist[k] = Math.round(s / repoCount);
          }
        }
        this.realMetrics.byRepo = byRepo;
        const globalLastActivity = Object.values(byRepo).reduce((acc, r) => {
          const at = r.lastActivityAt;
          return at && (!acc || at > acc) ? at : acc;
        }, null);
        this.realMetrics.global = {
          leadTimeMedianH: median(allLeadTimes),
          ttfrMedianH: median(allTtfr),
          reviewCyclesMedian: median(allCycles),
          prSizePcts: globalPrSizePcts,
          throughputByWeek: globalThroughput,
          trendLeadTime: globalTrendLead,
          trendTtfr: globalTrendTtfr,
          cycleDist: globalCycleDist,
          lastActivityAt: globalLastActivity,
        };
        this.realMetrics.loaded = true;
        // Validation: warn when a repo has PRs but no data in the selected period (helps debug chart emptiness)
        const nWeeks = (this.realMetrics.weekList && this.realMetrics.weekList.length) || 12;
        Object.entries(byRepo).forEach(([repoName, r]) => {
          if (r.prCount > 0) {
            const throughputSum = (r.throughputByWeek || []).reduce((a, v) => a + (typeof v === 'number' ? v : 0), 0);
            const hasLead = (r.trendLeadTime || []).some((v) => typeof v === 'number' && Number.isFinite(v) && v >= 0);
            if (throughputSum === 0 && !hasLead && typeof console !== 'undefined' && console.warn) {
              console.warn(`[GitHub metrics] Repo "${repoName}" has ${r.prCount} merged PRs but none in the selected period (${nWeeks} weeks); trend/throughput charts will be empty. Try fetching more PRs or check merge dates.`);
            }
          }
        });
        this.aggregateLevel = levelFromMetrics(this.realMetrics.global.leadTimeMedianH, this.realMetrics.global.ttfrMedianH, this.realMetrics.global.reviewCyclesMedian);
        this.aggregatePrPcts = this.realMetrics.global.prSizePcts;
        Object.keys(byRepo).forEach((repoName) => {
          const r = byRepo[repoName];
          this.projectLevels[repoName] = levelFromMetrics(r.leadTimeMedianH, r.ttfrMedianH, r.reviewCyclesMedian);
          this.projectPrPcts[repoName] = r.prSizePcts;
        });
        this.$nextTick(() => {
          setTimeout(() => {
            if (this.module === 'tendencias') this.initChartsForModule('tendencias');
            if (this.module === 'proyectos' && this.vistaProyecto === 'comparativa') this.drawChartByRepo();
            if (this.module === 'calidad') this.initChartsForModule('calidad');
          }, 150);
        });
      } catch (e) {
        this.realMetrics.error = e.message || 'Error loading metrics';
      } finally {
        this.realMetrics.loading = false;
      }
    },
    async loadMetrics() {
      const org = (this.orgName || '').trim();
      if (!org) {
        this.reposError = 'Enter the organization name.';
        return;
      }
      if (!(this.githubToken || '').trim()) {
        this.reposError = '';
        this.realMetrics.error = 'GitHub token is required to load metrics.';
        return;
      }
      this.reposError = '';
      this.realMetrics.error = null;
      this.loadingMetrics = true;
      try {
        await this.loadRepos();
        if (this.reposError) return;
        if (this.repos.length && this.githubToken.trim()) {
          await this.fetchRealMetrics();
        } else if (this.repos.length && !this.githubToken.trim()) {
          this.realMetrics.error = 'Token required to load metrics. Enter token and click Load metrics again.';
        }
      } catch (e) {
        var msg = (e && (e.message || e.toString())) || 'Error loading metrics';
        this.realMetrics.error = msg;
        if (typeof console !== 'undefined' && console.error) console.error('[Load metrics]', e);
      } finally {
        this.loadingMetrics = false;
      }
    },
    async loadRepos() {
      const org = (this.orgName || '').trim();
      if (!org) {
        this.reposError = 'Enter the organization name.';
        return;
      }
      this.reposError = '';
      this.realMetrics.error = null;
      this.loadingRepos = true;
      this.repos = [];
      this.realMetrics.loaded = false;
      this.realMetrics.error = null;
      this.realMetrics.byRepo = {};
      this.realMetrics.global = null;
      this.repoLastCommits = {};
      this.aggregateLevel = null;
      this.aggregatePrPcts = null;
      this.projectLevels = {};
      this.projectPrPcts = {};
      try {
        const headers = {};
        if (this.githubToken.trim()) headers.Authorization = 'Bearer ' + this.githubToken.trim();
        const res = await fetch(`https://api.github.com/orgs/${encodeURIComponent(org)}/repos?per_page=100&sort=full_name`, { headers });
        if (!res.ok) {
          if (res.status === 404) this.reposError = 'Organization not found or no access. If private, use a token.';
          else if (res.status === 401) this.reposError = 'Invalid token or missing permissions (repo and/or read:org).';
          else this.reposError = `Error ${res.status}: ${res.statusText}`;
          return;
        }
        const data = await res.json();
        this.repos = Array.isArray(data) ? data.filter((r) => !r.archived) : [];
        if (this.repos.length > 0) {
          this.selectedRepo = this.repos[0].name;
          // Do not set projectLevels / projectPrPcts here; only real metrics will set them.
        } else this.reposError = 'No repositories found.';
      } catch (e) {
        this.reposError = e.message || 'Error connecting to GitHub.';
      } finally {
        this.loadingRepos = false;
      }
    },
    projectMetrics(repoName) {
      const r = this.realMetrics.loaded && this.realMetrics.byRepo[repoName];
      return METRIC_DEFS.map((def) => {
        let value;
        let level = null;
        if (def.id === 'changeFailureRate') {
          value = 'No data (deploy data required)';
        } else if (r) {
          if (def.id === 'cycleTime' || def.id === 'leadTime') {
            value = formatHours(r.leadTimeMedianH);
            level = metricLevelForValue(def.id, r.leadTimeMedianH);
          } else if (def.id === 'ttfr') {
            value = formatHours(r.ttfrMedianH);
            level = metricLevelForValue(def.id, r.ttfrMedianH);
          } else if (def.id === 'reviewCycles') {
            value = formatReviewCycles(r.reviewCyclesMedian);
            level = metricLevelForValue(def.id, r.reviewCyclesMedian);
          } else {
            value = formatHours(r.leadTimeMedianH);
            level = metricLevelForValue(def.id, r.leadTimeMedianH);
          }
        } else {
          value = 'No data';
        }
        const dataNote = def.id === 'cycleTime' && r ? 'Same value as Lead Time (GitHub does not provide commit→deploy).' : null;
        return { ...def, value, level, dataNote };
      });
    },
    projectPrSizes(repoName) {
      const pcts = this.projectPrPcts[repoName];
      return PR_SIZE_LABELS.map((p, i) => ({ ...p, percent: (pcts && pcts[i]) ?? 0 }));
    },
    getOpenPrs(repoName) {
      const r = this.realMetrics.loaded && this.realMetrics.byRepo[repoName];
      return r && r.openPrs != null ? r.openPrs : 0;
    },
    projectDataStatus(repoName) {
      if (!repoName) return { hasError: false, errorMessage: null, hasData: false, prCount: 0, lastActivityAt: null };
      const err = (this.realMetrics.repoErrors || []).find((e) => e.name === repoName);
      const r = this.realMetrics.loaded && this.realMetrics.byRepo[repoName];
      const prCount = r && r.prCount != null ? r.prCount : 0;
      return {
        hasError: !!err,
        errorMessage: err ? err.message : null,
        hasData: prCount > 0,
        prCount,
        lastActivityAt: r && r.lastActivityAt ? r.lastActivityAt : null,
      };
    },
    projectLastActivityText(repoName) {
      const status = this.projectDataStatus(repoName);
      if (status.hasError) return null;
      if (!status.lastActivityAt) return null;
      const dateStr = formatShortDate(status.lastActivityAt);
      const rel = relativeTimeShort(status.lastActivityAt);
      return dateStr && rel ? dateStr + ' (' + rel + ')' : null;
    },
    formatDateShort(iso) {
      return formatShortDate(iso);
    },
    relativeTimeAgo(iso) {
      return relativeTimeShort(iso);
    },
    formatHours(h) {
      return formatHoursGlobal(h);
    },
    formatReviewCycles(n) {
      return formatReviewCyclesGlobal(n);
    },
    async fetchLastCommit(repoName) {
      const org = (this.orgName || '').trim();
      const token = (this.githubToken || '').trim();
      if (!repoName || !org || !token) return;
      if (this.repoLastCommits[repoName]) return;
      try {
        const res = await fetch(
          `https://api.github.com/repos/${encodeURIComponent(org)}/${encodeURIComponent(repoName)}/commits?per_page=1`,
          { headers: { Authorization: 'Bearer ' + token } }
        );
        if (!res.ok) return;
        const data = await res.json();
        const commit = Array.isArray(data) && data[0] ? data[0] : null;
        if (commit && commit.commit && commit.commit.author && commit.commit.author.date) {
          this.repoLastCommits = { ...this.repoLastCommits, [repoName]: { date: commit.commit.author.date, sha: commit.sha } };
        }
      } catch (_) {}
    },
  },
}).mount('#app');
