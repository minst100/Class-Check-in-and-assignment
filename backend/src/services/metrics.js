const metrics = {
  checkInLatencyMs: [],
  dashboardLoadMs: []
};

function recordMetric(metricName, valueMs) {
  if (!metrics[metricName]) return;
  metrics[metricName].push(valueMs);
  if (metrics[metricName].length > 1000) metrics[metricName].shift();
}

function summarize(values, targetMs) {
  const count = values.length;
  const avg = count ? values.reduce((a, b) => a + b, 0) / count : 0;
  const p95 = count ? [...values].sort((a, b) => a - b)[Math.floor(count * 0.95) - 1] || 0 : 0;
  return { count, avg_ms: Number(avg.toFixed(2)), p95_ms: Number(p95.toFixed(2)), target_ms: targetMs, slo_met: avg <= targetMs };
}

function snapshot() {
  return {
    check_in_latency: summarize(metrics.checkInLatencyMs, 2000),
    dashboard_load: summarize(metrics.dashboardLoadMs, 5000)
  };
}

module.exports = { recordMetric, snapshot };
