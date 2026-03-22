export function getDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OWL Dashboard</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a0f;color:#e0e0f0;font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;font-size:13px}
a{color:#00fff5;text-decoration:none}
.wrap{max-width:1200px;margin:0 auto;padding:0 20px}
nav{background:#12121a;border-bottom:1px solid #2a2a3e;padding:12px 0;position:sticky;top:0;z-index:10}
nav .wrap{display:flex;align-items:center;gap:24px}
nav .logo{color:#00fff5;font-size:16px;font-weight:700;letter-spacing:1px}
nav .tabs{display:flex;gap:4px}
nav .tab{padding:6px 14px;border-radius:6px;cursor:pointer;color:#8888aa;transition:all .15s}
nav .tab:hover{color:#e0e0f0;background:#1a1a2e}
nav .tab.active{color:#00fff5;background:#1a1a2e}
.refresh{margin-left:auto;padding:5px 12px;background:#1a1a2e;border:1px solid #2a2a3e;border-radius:6px;color:#8888aa;cursor:pointer;font-family:inherit;font-size:12px}
.refresh:hover{color:#00fff5;border-color:#00fff5}
main{padding:24px 0}
.panel{display:none}
.panel.active{display:block}
.card{background:#1a1a2e;border:1px solid #2a2a3e;border-radius:8px;padding:16px;margin-bottom:16px}
.card h3{color:#00fff5;font-size:13px;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
.stat{text-align:center;padding:12px}
.stat .val{font-size:24px;color:#00fff5;font-weight:700}
.stat .lbl{color:#8888aa;font-size:11px;margin-top:4px;text-transform:uppercase}
table{width:100%;border-collapse:collapse}
th{text-align:left;color:#8888aa;font-size:11px;text-transform:uppercase;letter-spacing:.5px;padding:8px 10px;border-bottom:1px solid #2a2a3e}
td{padding:8px 10px;border-bottom:1px solid #1a1a2e;font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
tr:hover td{background:#12121a}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}
.badge.ok{background:#39ff1422;color:#39ff14}
.badge.error{background:#ff00e522;color:#ff00e5}
.badge.active{background:#00fff522;color:#00fff5}
.badge.pending{background:#f5ff0022;color:#f5ff00}
.badge.triggered{background:#ff660022;color:#ff6600}
.filters{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}
.filters input,.filters select{background:#12121a;border:1px solid #2a2a3e;border-radius:4px;padding:6px 10px;color:#e0e0f0;font-family:inherit;font-size:12px}
.filters input:focus,.filters select:focus{outline:none;border-color:#00fff5}
.period-btns{display:flex;gap:8px;margin-bottom:16px}
.period-btn{padding:8px 20px;background:#1a1a2e;border:1px solid #2a2a3e;border-radius:6px;color:#8888aa;cursor:pointer;font-family:inherit;font-size:12px}
.period-btn:hover,.period-btn.active{color:#00fff5;border-color:#00fff5}
.empty{color:#555570;text-align:center;padding:32px}
.loading{color:#8888aa;text-align:center;padding:20px}
.wallet-card{margin-bottom:8px}
.wallet-card .name{color:#00fff5;font-weight:700;margin-bottom:6px}
.wallet-card .chain-row{display:flex;justify-content:space-between;padding:3px 0;color:#8888aa;font-size:12px}
.wallet-card .chain-row .chain-name{color:#e0e0f0}
.config-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #2a2a3e}
.config-row:last-child{border:none}
.config-row .key{color:#8888aa}
.config-row .value{color:#e0e0f0}
</style>
</head>
<body>
<nav><div class="wrap">
  <span class="logo">OWL</span>
  <div class="tabs">
    <div class="tab active" data-tab="portfolio">Portfolio</div>
    <div class="tab" data-tab="activity">Activity</div>
    <div class="tab" data-tab="alerts">Alerts</div>
    <div class="tab" data-tab="tunnels">Tunnels</div>
    <div class="tab" data-tab="reports">Reports</div>
    <div class="tab" data-tab="config">Config</div>
  </div>
  <button class="refresh" onclick="refreshActive()">Refresh</button>
</div></nav>

<main><div class="wrap">
  <div id="portfolio" class="panel active"><div class="loading">Loading portfolio...</div></div>
  <div id="activity" class="panel"></div>
  <div id="alerts" class="panel"></div>
  <div id="tunnels" class="panel"></div>
  <div id="reports" class="panel"></div>
  <div id="config" class="panel"></div>
</div></main>

<script>
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
let activeTab = 'portfolio';

// tabs
$$('.tab').forEach(t => t.addEventListener('click', () => {
  $$('.tab').forEach(x => x.classList.remove('active'));
  $$('.panel').forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  const tab = t.dataset.tab;
  $('#' + tab).classList.add('active');
  activeTab = tab;
  loaders[tab]();
}));

function refreshActive() { loaders[activeTab](); }

async function api(path) {
  try { const r = await fetch(path); return await r.json(); }
  catch(e) { return { error: e.message }; }
}

function badge(text, cls) { return '<span class="badge ' + cls + '">' + text + '</span>'; }
function esc(s) { return String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function timeAgo(ts) {
  if (!ts) return '';
  const d = Date.now() - new Date(ts).getTime();
  if (d < 60000) return Math.floor(d/1000) + 's ago';
  if (d < 3600000) return Math.floor(d/60000) + 'm ago';
  if (d < 86400000) return Math.floor(d/3600000) + 'h ago';
  return Math.floor(d/86400000) + 'd ago';
}

// portfolio
async function loadPortfolio() {
  const el = $('#portfolio');
  el.innerHTML = '<div class="loading">Loading wallets and balances...</div>';
  const [wallets, portfolio] = await Promise.all([api('/api/wallets'), api('/api/portfolio')]);
  let html = '';
  if (wallets.error) { el.innerHTML = '<div class="empty">Could not load wallets: ' + esc(wallets.error) + '</div>'; return; }
  if (!wallets.length) { el.innerHTML = '<div class="empty">No wallets found</div>'; return; }
  const pMap = {};
  if (portfolio.wallets) portfolio.wallets.forEach(w => { pMap[w.name] = w.holdings; });
  html += '<div class="grid">';
  wallets.forEach(w => {
    html += '<div class="card wallet-card"><div class="name">' + esc(w.name) + '</div>';
    html += '<div style="color:#555570;font-size:11px;margin-bottom:8px">' + esc(w.type) + ' wallet</div>';
    const holdings = pMap[w.name] || [];
    if (holdings.length) {
      holdings.forEach(h => {
        html += '<div class="chain-row"><span class="chain-name">' + esc(h.chain) + '</span><span>' + esc(h.raw) + '</span></div>';
      });
    } else {
      const chains = Object.keys(w.addresses || {}).filter(c => !c.includes('sepolia') && !c.includes('amoy') && !c.includes('devnet'));
      chains.forEach(c => {
        html += '<div class="chain-row"><span class="chain-name">' + esc(c) + '</span><span style="color:#555570">--</span></div>';
      });
    }
    html += '</div>';
  });
  html += '</div>';
  el.innerHTML = html;
}

// activity
async function loadActivity() {
  const el = $('#activity');
  const params = new URLSearchParams();
  const f = el.querySelector('.filters');
  if (f) {
    ['tool','wallet','chain','status'].forEach(k => {
      const v = f.querySelector('[name='+k+']')?.value;
      if (v) params.set(k, v);
    });
  }
  params.set('limit', '100');
  const [entries, stats] = await Promise.all([api('/api/ledger?' + params), api('/api/ledger/stats')]);
  let html = '<div class="card"><h3>Stats</h3><div class="grid">';
  html += '<div class="stat"><div class="val">' + (stats.total||0) + '</div><div class="lbl">Total Ops</div></div>';
  html += '<div class="stat"><div class="val">' + (stats.errors||0) + '</div><div class="lbl">Errors</div></div>';
  const toolCount = stats.by_tool ? Object.keys(stats.by_tool).length : 0;
  html += '<div class="stat"><div class="val">' + toolCount + '</div><div class="lbl">Tools Used</div></div>';
  html += '</div></div>';
  html += '<div class="card"><h3>Activity Feed</h3>';
  html += '<div class="filters">';
  html += '<input name="tool" placeholder="Filter tool" onchange="loadActivity()">';
  html += '<input name="wallet" placeholder="Filter wallet" onchange="loadActivity()">';
  html += '<input name="chain" placeholder="Filter chain" onchange="loadActivity()">';
  html += '<select name="status" onchange="loadActivity()"><option value="">All status</option><option value="ok">ok</option><option value="error">error</option></select>';
  html += '</div>';
  if (!entries.length) { html += '<div class="empty">No ledger entries</div>'; }
  else {
    html += '<table><tr><th>Time</th><th>Tool</th><th>Wallet</th><th>Chain</th><th>Status</th></tr>';
    entries.forEach(e => {
      const st = e.status === 'ok' ? badge('ok','ok') : badge('error','error');
      html += '<tr><td title="' + esc(e.timestamp) + '">' + timeAgo(e.timestamp) + '</td><td>' + esc(e.tool) + '</td><td>' + esc(e.wallet) + '</td><td>' + esc(e.chain) + '</td><td>' + st + '</td></tr>';
    });
    html += '</table>';
  }
  html += '</div>';
  el.innerHTML = html;
}

// alerts
async function loadAlerts() {
  const el = $('#alerts');
  const [rules, history] = await Promise.all([api('/api/alerts'), api('/api/alerts/history')]);
  let html = '<div class="card"><h3>Active Rules</h3>';
  if (!rules.length) { html += '<div class="empty">No alerts configured</div>'; }
  else {
    html += '<table><tr><th>Token</th><th>Chain</th><th>Condition</th><th>Value</th><th>Channel</th><th>Status</th></tr>';
    rules.forEach(r => {
      const st = r.triggered_at ? badge('triggered','triggered') : badge('active','active');
      html += '<tr><td>' + esc(r.token) + '</td><td>' + esc(r.chain) + '</td><td>' + esc(r.condition_type) + '</td><td>' + r.condition_value + '</td><td>' + esc((r.channels||[]).join(', ')) + '</td><td>' + st + '</td></tr>';
    });
    html += '</table>';
  }
  html += '</div>';
  html += '<div class="card"><h3>Trigger History</h3>';
  if (!history.length) { html += '<div class="empty">No alerts triggered yet</div>'; }
  else {
    html += '<table><tr><th>Time</th><th>Message</th></tr>';
    history.forEach(h => {
      html += '<tr><td>' + timeAgo(h.triggered_at) + '</td><td>' + esc(h.message) + '</td></tr>';
    });
    html += '</table>';
  }
  html += '</div>';
  el.innerHTML = html;
}

// tunnels
async function loadTunnels() {
  const el = $('#tunnels');
  const data = await api('/api/tunnels');
  let html = '<div class="card"><h3>Tunnels</h3>';
  if (!data.tunnels || !data.tunnels.length) { html += '<div class="empty">No active tunnels</div>'; }
  else {
    html += '<table><tr><th>Name</th><th>Wallet</th><th>Port</th><th>Peers</th><th>Created</th></tr>';
    data.tunnels.forEach(t => {
      html += '<tr><td>' + esc(t.name) + '</td><td>' + esc(t.wallet) + '</td><td>' + t.port + '</td><td>' + (t.peers||[]).length + '</td><td>' + timeAgo(t.created_at) + '</td></tr>';
    });
    html += '</table>';
  }
  html += '</div>';
  html += '<div class="card"><h3>Proposals</h3>';
  if (!data.proposals || !data.proposals.length) { html += '<div class="empty">No proposals</div>'; }
  else {
    html += '<table><tr><th>Peer</th><th>Operation</th><th>Status</th><th>Created</th></tr>';
    data.proposals.forEach(p => {
      const cls = p.status === 'executed' ? 'ok' : p.status === 'pending' ? 'pending' : p.status === 'rejected' ? 'error' : 'active';
      html += '<tr><td>' + esc(p.peer) + '</td><td>' + esc(p.operation) + '</td><td>' + badge(p.status, cls) + '</td><td>' + timeAgo(p.created_at) + '</td></tr>';
    });
    html += '</table>';
  }
  html += '</div>';
  el.innerHTML = html;
}

// reports
let currentPeriod = 'daily';
async function loadReports() {
  const el = $('#reports');
  let html = '<div class="period-btns">';
  ['daily','weekly','monthly'].forEach(p => {
    html += '<button class="period-btn' + (p===currentPeriod?' active':'') + '" onclick="switchPeriod(\\'' + p + '\\')">' + p.charAt(0).toUpperCase()+p.slice(1) + '</button>';
  });
  html += '</div>';
  html += '<div id="report-content"><div class="loading">Loading report...</div></div>';
  el.innerHTML = html;
  const data = await api('/api/reports/' + currentPeriod);
  const rc = el.querySelector('#report-content');
  if (data.error) { rc.innerHTML = '<div class="empty">' + esc(data.error) + '</div>'; return; }
  let rh = '<div class="card"><h3>' + currentPeriod + ' Report</h3>';
  rh += '<div class="grid">';
  const s = data.summary || {};
  rh += '<div class="stat"><div class="val">' + (s.total_operations||0) + '</div><div class="lbl">Operations</div></div>';
  rh += '<div class="stat"><div class="val">' + (s.write_operations||0) + '</div><div class="lbl">Writes</div></div>';
  rh += '<div class="stat"><div class="val">' + (s.read_operations||0) + '</div><div class="lbl">Reads</div></div>';
  rh += '<div class="stat"><div class="val">' + (s.errors||0) + '</div><div class="lbl">Errors</div></div>';
  rh += '</div>';
  const b = data.breakdown || {};
  if (b.swaps || b.transfers || b.bridges) {
    rh += '<div style="margin-top:12px"><span style="color:#8888aa">Breakdown:</span> ';
    rh += 'Swaps: ' + (b.swaps||0) + '  Transfers: ' + (b.transfers||0) + '  Bridges: ' + (b.bridges||0);
    rh += '</div>';
  }
  if (data.by_chain && Object.keys(data.by_chain).length) {
    rh += '<div style="margin-top:8px"><span style="color:#8888aa">By chain:</span> ';
    rh += Object.entries(data.by_chain).map(([c,n]) => c + ': ' + n).join('  ');
    rh += '</div>';
  }
  rh += '</div>';
  if (data.recent_writes && data.recent_writes.length) {
    rh += '<div class="card"><h3>Recent Writes</h3><table><tr><th>Time</th><th>Tool</th><th>Wallet</th><th>Chain</th><th>Status</th></tr>';
    data.recent_writes.forEach(w => {
      const st = w.status === 'ok' ? badge('ok','ok') : badge('error','error');
      rh += '<tr><td>' + timeAgo(w.timestamp) + '</td><td>' + esc(w.tool) + '</td><td>' + esc(w.wallet) + '</td><td>' + esc(w.chain) + '</td><td>' + st + '</td></tr>';
    });
    rh += '</table></div>';
  }
  rc.innerHTML = rh;
}
function switchPeriod(p) { currentPeriod = p; loadReports(); }

// config
async function loadConfig() {
  const el = $('#config');
  const data = await api('/api/config');
  let html = '<div class="card"><h3>Agent</h3>';
  if (data.agent) {
    html += '<div class="config-row"><span class="key">Provider</span><span class="value">' + esc(data.agent.provider) + '</span></div>';
    html += '<div class="config-row"><span class="key">Model</span><span class="value">' + esc(data.agent.model) + '</span></div>';
    html += '<div class="config-row"><span class="key">API Key</span><span class="value">' + esc(data.agent.apiKey) + '</span></div>';
  } else { html += '<div class="empty">No agent configured</div>'; }
  html += '</div>';
  html += '<div class="card"><h3>Notification Channels</h3>';
  if (data.channels) {
    if (data.channels.telegram) {
      html += '<div class="config-row"><span class="key">Telegram</span><span class="value">Chat: ' + esc(data.channels.telegram.chatId) + '</span></div>';
    }
    if (data.channels.webhook) {
      html += '<div class="config-row"><span class="key">Webhook</span><span class="value">' + esc(data.channels.webhook.url) + '</span></div>';
    }
    if (!data.channels.telegram && !data.channels.webhook) {
      html += '<div class="empty">No channels configured</div>';
    }
  } else { html += '<div class="empty">No channels configured</div>'; }
  html += '</div>';
  el.innerHTML = html;
}

const loaders = { portfolio: loadPortfolio, activity: loadActivity, alerts: loadAlerts, tunnels: loadTunnels, reports: loadReports, config: loadConfig };

// init
loadPortfolio();

// auto refresh
setInterval(() => { if (activeTab === 'portfolio') loadPortfolio(); }, 30000);
setInterval(() => { if (activeTab === 'activity') loadActivity(); if (activeTab === 'alerts') loadAlerts(); }, 10000);
</script>
</body>
</html>`;
}
