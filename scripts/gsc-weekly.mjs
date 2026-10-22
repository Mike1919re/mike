#!/usr/bin/env node
// gsc-weekly.mjs — weekly Google Search Console report, no npm dependencies.
//
// Pulls the last 28 days (and the 28 days before them) for every site in
// gsc-weekly.config.json, then writes a Markdown report with:
//   * totals and week-over-period deltas
//   * top queries / top pages
//   * "important pages" (config regexes) with their best queries
//   * quick wins: queries at position 4–20 with impressions but low CTR
//   * declining pages: lost clicks vs the previous 28 days
//   * cannibalization: one query ranking with several pages
//   * device split
//
//   node scripts/gsc-weekly.mjs                     # -> reports/gsc/YYYY-MM-DD.md
//   node scripts/gsc-weekly.mjs --out path.md       # custom output
//   node scripts/gsc-weekly.mjs --json              # also write the raw tables as JSON
//   node scripts/gsc-weekly.mjs --fixture f.json    # offline: read API rows from a file
//
// Key: GSC_CREDENTIALS_FILE or .secrets/gsc-service-account.json (see docs/gsc-mcp.md).
// Exit codes: 0 ok, 1 auth/API failure, 3 bad key or config.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createSign } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const flag = (name) => args.includes(name);

const CONFIG = JSON.parse(readFileSync(resolve(ROOT, "gsc-weekly.config.json"), "utf8"));
const KEY_FILE = process.env.GSC_CREDENTIALS_FILE || resolve(ROOT, ".secrets/gsc-service-account.json");
const FIXTURE = opt("--fixture");
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const API = "https://www.googleapis.com/webmasters/v3";

const fail = (code, msg) => { console.error(`FAIL  ${msg}`); process.exit(code); };
const log = (msg) => console.error(msg);

// ---------------------------------------------------------------- dates
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x; };
const today = new Date(`${iso(new Date())}T00:00:00Z`);
const curEnd = addDays(today, -CONFIG.window.lagDays);
const curStart = addDays(curEnd, -(CONFIG.window.days - 1));
const prevEnd = addDays(curStart, -1);
const prevStart = addDays(prevEnd, -(CONFIG.window.days - 1));
const CUR = { startDate: iso(curStart), endDate: iso(curEnd) };
const PREV = { startDate: iso(prevStart), endDate: iso(prevEnd) };

// ---------------------------------------------------------------- auth
let token = null;
async function getToken() {
  if (token) return token;
  let key;
  try { key = JSON.parse(readFileSync(KEY_FILE, "utf8")); }
  catch (e) { fail(3, `cannot read key ${KEY_FILE}: ${e.message}`); }
  if (key.type !== "service_account" || !key.private_key || !key.client_email || !key.token_uri) {
    fail(3, `${KEY_FILE} is not a service-account key`);
  }
  const b64 = (s) => Buffer.from(s).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64(JSON.stringify({
    iss: key.client_email, scope: SCOPE, aud: key.token_uri, iat: now, exp: now + 3000,
  }))}`;
  const signer = createSign("RSA-SHA256"); signer.update(unsigned);
  const assertion = `${unsigned}.${signer.sign(key.private_key, "base64url")}`;
  const res = await fetch(key.token_uri, {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) fail(1, `token exchange failed (${res.status}): ${body.error_description || body.error || ""}`);
  token = body.access_token;
  return token;
}

async function api(path, init = {}) {
  const t = await getToken();
  const res = await fetch(`${API}${path}`, { ...init, headers: { authorization: `Bearer ${t}`, "content-type": "application/json", ...(init.headers || {}) } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) fail(1, `${path} -> ${res.status}: ${body.error?.message || JSON.stringify(body)}`);
  return body;
}

// ---------------------------------------------------------------- data access
const toHost = (u) => {
  let h = u.replace(/^sc-domain:/, "");
  try { if (/^https?:\/\//.test(h)) h = new URL(h).hostname; } catch { /* keep */ }
  try { h = new URL(`http://${h}`).hostname; } catch { /* keep */ }
  return h.replace(/^www\./, "").toLowerCase();
};

let fixture = null;
if (FIXTURE) {
  fixture = JSON.parse(readFileSync(FIXTURE, "utf8"));
  log(`using fixture ${FIXTURE} (no API calls)`);
}

async function listSites() {
  if (fixture) return fixture.sites;
  return (await api("/sites")).siteEntry || [];
}

// Query all rows (paginated, 25k per page) for a dimension set and period.
async function query(siteUrl, { startDate, endDate }, dimensions, extra = {}) {
  if (fixture) {
    const k = `${toHost(siteUrl)}|${startDate}|${endDate}|${dimensions.join(",")}`;
    return (fixture.queries[k] || []).map((r) => ({ ...r }));
  }
  const rows = [];
  for (let startRow = 0; ; startRow += 25000) {
    const body = await api(`/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      method: "POST",
      body: JSON.stringify({ startDate, endDate, dimensions, rowLimit: 25000, startRow, dataState: "final", type: "web", ...extra }),
    });
    const page = body.rows || [];
    rows.push(...page);
    if (page.length < 25000) break;
  }
  return rows;
}

// ---------------------------------------------------------------- analysis
const sum = (rows, f) => rows.reduce((a, r) => a + (r[f] || 0), 0);
const pct = (a, b) => (b ? ((a - b) / b) * 100 : a ? 100 : 0);
const fmt = (n, d = 0) => Number(n).toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
const fmtPct = (n) => `${n >= 0 ? "+" : ""}${fmt(n, 1)}%`;
const ctrPct = (r) => (r.impressions ? (r.clicks / r.impressions) * 100 : 0);
const esc = (s) => String(s).replace(/\|/g, "\\|");
const trimUrl = (u) => u.replace(/^https?:\/\/(www\.)?[^/]+/, "") || "/";

// Expected CTR by position (industry-wide averages; used only to size the gap).
const expectedCtr = (pos) => {
  const table = [0, 28, 15, 11, 8, 7, 5, 4, 3.5, 3, 2.5];
  if (pos <= 10) return table[Math.max(1, Math.round(pos))];
  return pos <= 20 ? 1.5 : 0.8;
};

function analyzeSite(site, cur, prev, importantRes) {
  const host = site.host;
  const totals = {
    clicks: sum(cur.byDate, "clicks"), impressions: sum(cur.byDate, "impressions"),
    prevClicks: sum(prev.byDate, "clicks"), prevImpressions: sum(prev.byDate, "impressions"),
  };
  totals.ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
  totals.prevCtr = totals.prevImpressions ? (totals.prevClicks / totals.prevImpressions) * 100 : 0;
  const wpos = (rows) => { const imp = sum(rows, "impressions"); return imp ? rows.reduce((a, r) => a + r.position * r.impressions, 0) / imp : 0; };
  totals.position = wpos(cur.byDate); totals.prevPosition = wpos(prev.byDate);

  const topQueries = [...cur.byQuery].sort((a, b) => b.clicks - a.clicks).slice(0, CONFIG.limits.topQueries);
  const topPages = [...cur.byPage].sort((a, b) => b.clicks - a.clicks).slice(0, CONFIG.limits.topPages);

  // Important pages: config regexes OR top-5 by clicks.
  const important = cur.byPage.filter((r) => importantRes.some((re) => re.test(r.keys[0])));
  for (const r of topPages.slice(0, 5)) if (!important.includes(r)) important.push(r);
  const prevPageMap = new Map(prev.byPage.map((r) => [r.keys[0], r]));
  const importantRows = important.map((r) => {
    const p = prevPageMap.get(r.keys[0]);
    const qs = cur.byQueryPage.filter((x) => x.keys[1] === r.keys[0]).sort((a, b) => b.impressions - a.impressions).slice(0, 5);
    return { ...r, prev: p, queries: qs };
  }).sort((a, b) => b.clicks - a.clicks);

  // Quick wins.
  const qw = CONFIG.quickWins;
  const quickWins = cur.byQueryPage
    .filter((r) => r.position >= qw.positionMin && r.position <= qw.positionMax && r.impressions >= qw.minImpressions)
    .map((r) => {
      const exp = expectedCtr(r.position);
      const gapClicks = Math.max(0, Math.round((exp / 100) * r.impressions - r.clicks));
      return { ...r, ctr: ctrPct(r), expectedCtr: exp, gapClicks };
    })
    .filter((r) => r.ctr < r.expectedCtr)
    .sort((a, b) => b.gapClicks - a.gapClicks)
    .slice(0, CONFIG.limits.quickWins);

  // Declines.
  const d = CONFIG.decline;
  const curPageMap = new Map(cur.byPage.map((r) => [r.keys[0], r]));
  const declines = prev.byPage
    .filter((p) => p.clicks >= d.minClicksPrev)
    .map((p) => { const c = curPageMap.get(p.keys[0]) || { clicks: 0, impressions: 0, position: 0 }; return { page: p.keys[0], prev: p, cur: c, dropPct: pct(c.clicks, p.clicks) }; })
    .filter((x) => x.dropPct <= -d.minDropPct)
    .sort((a, b) => (a.cur.clicks - a.prev.clicks) - (b.cur.clicks - b.prev.clicks))
    .slice(0, CONFIG.limits.declines);

  // Cannibalization.
  const c = CONFIG.cannibalization;
  const byQ = new Map();
  for (const r of cur.byQueryPage) { const k = r.keys[0]; if (!byQ.has(k)) byQ.set(k, []); byQ.get(k).push(r); }
  const cannibal = [];
  for (const [q, rows] of byQ) {
    const imp = sum(rows, "impressions");
    if (imp < c.minImpressions) continue;
    const strong = rows.filter((r) => (r.impressions / imp) * 100 >= c.minSharePct);
    if (strong.length >= 2) cannibal.push({ query: q, impressions: imp, clicks: sum(rows, "clicks"), pages: strong.sort((a, b) => b.impressions - a.impressions) });
  }
  cannibal.sort((a, b) => b.impressions - a.impressions);

  const devices = cur.byDevice.map((r) => ({ device: r.keys[0], ...r, ctr: ctrPct(r) }));

  return { host, label: site.label, totals, topQueries, topPages, importantRows, quickWins, declines, cannibal: cannibal.slice(0, CONFIG.limits.cannibalization), devices };
}

// ---------------------------------------------------------------- report
function renderSite(a) {
  const out = [];
  const t = a.totals;
  out.push(`## ${a.label} — ${a.host}`, "");
  out.push(`| מדד | 28 ימים אחרונים | 28 ימים קודמים | שינוי |`, `|---|---:|---:|---:|`);
  out.push(`| קליקים | ${fmt(t.clicks)} | ${fmt(t.prevClicks)} | ${fmtPct(pct(t.clicks, t.prevClicks))} |`);
  out.push(`| חשיפות | ${fmt(t.impressions)} | ${fmt(t.prevImpressions)} | ${fmtPct(pct(t.impressions, t.prevImpressions))} |`);
  out.push(`| CTR | ${fmt(t.ctr, 2)}% | ${fmt(t.prevCtr, 2)}% | ${fmtPct(pct(t.ctr, t.prevCtr))} |`);
  out.push(`| מיקום ממוצע | ${fmt(t.position, 1)} | ${fmt(t.prevPosition, 1)} | ${fmt(t.position - t.prevPosition, 1)} |`, "");

  out.push(`### עמודים חשובים`, "");
  if (!a.importantRows.length) out.push("_אין נתונים._", "");
  else {
    out.push(`| עמוד | קליקים | Δ | חשיפות | CTR | מיקום | שאילתות מובילות |`, `|---|---:|---:|---:|---:|---:|---|`);
    for (const r of a.importantRows) {
      const delta = r.prev ? fmtPct(pct(r.clicks, r.prev.clicks)) : "חדש";
      const qs = r.queries.map((q) => `${esc(q.keys[0])} (${fmt(q.position, 1)})`).join("; ");
      out.push(`| ${esc(trimUrl(r.keys[0]))} | ${fmt(r.clicks)} | ${delta} | ${fmt(r.impressions)} | ${fmt(ctrPct(r), 1)}% | ${fmt(r.position, 1)} | ${qs} |`);
    }
    out.push("");
  }

  out.push(`### Quick wins — מיקום ${CONFIG.quickWins.positionMin}–${CONFIG.quickWins.positionMax}, ≥${CONFIG.quickWins.minImpressions} חשיפות, CTR נמוך מהצפוי`, "");
  if (!a.quickWins.length) out.push("_לא נמצאו._", "");
  else {
    out.push(`| שאילתה | עמוד | חשיפות | קליקים | CTR | CTR צפוי | מיקום | קליקים פוטנציאליים |`, `|---|---|---:|---:|---:|---:|---:|---:|`);
    for (const r of a.quickWins) out.push(`| ${esc(r.keys[0])} | ${esc(trimUrl(r.keys[1]))} | ${fmt(r.impressions)} | ${fmt(r.clicks)} | ${fmt(r.ctr, 1)}% | ${fmt(r.expectedCtr, 1)}% | ${fmt(r.position, 1)} | +${fmt(r.gapClicks)} |`);
    out.push("");
  }

  out.push(`### עמודים בירידה — ≥${CONFIG.decline.minDropPct}% פחות קליקים מהתקופה הקודמת`, "");
  if (!a.declines.length) out.push("_אין ירידות משמעותיות._", "");
  else {
    out.push(`| עמוד | קליקים קודם | קליקים עכשיו | שינוי | מיקום קודם | מיקום עכשיו |`, `|---|---:|---:|---:|---:|---:|`);
    for (const r of a.declines) out.push(`| ${esc(trimUrl(r.page))} | ${fmt(r.prev.clicks)} | ${fmt(r.cur.clicks)} | ${fmtPct(r.dropPct)} | ${fmt(r.prev.position, 1)} | ${r.cur.position ? fmt(r.cur.position, 1) : "—"} |`);
    out.push("");
  }

  out.push(`### קניבליזציה — שאילתה אחת, כמה עמודים`, "");
  if (!a.cannibal.length) out.push("_לא נמצאה._", "");
  else {
    out.push(`| שאילתה | חשיפות | קליקים | עמודים מתחרים (מיקום) |`, `|---|---:|---:|---|`);
    for (const r of a.cannibal) out.push(`| ${esc(r.query)} | ${fmt(r.impressions)} | ${fmt(r.clicks)} | ${r.pages.map((p) => `${esc(trimUrl(p.keys[1]))} (${fmt(p.position, 1)})`).join("; ")} |`);
    out.push("");
  }

  out.push(`### שאילתות מובילות`, "");
  out.push(`| שאילתה | קליקים | חשיפות | CTR | מיקום |`, `|---|---:|---:|---:|---:|`);
  for (const r of a.topQueries) out.push(`| ${esc(r.keys[0])} | ${fmt(r.clicks)} | ${fmt(r.impressions)} | ${fmt(ctrPct(r), 1)}% | ${fmt(r.position, 1)} |`);
  out.push("");

  out.push(`### מכשירים`, "");
  out.push(`| מכשיר | קליקים | חשיפות | CTR | מיקום |`, `|---|---:|---:|---:|---:|`);
  for (const r of a.devices) out.push(`| ${r.device} | ${fmt(r.clicks)} | ${fmt(r.impressions)} | ${fmt(r.ctr, 1)}% | ${fmt(r.position, 1)} |`);
  out.push("");
  return out.join("\n");
}

// ---------------------------------------------------------------- main
const sites = await listSites();
const visible = new Map(sites.map((s) => [toHost(s.siteUrl), s.siteUrl]));
const analyses = [];
const missing = [];
for (const site of CONFIG.sites) {
  const siteUrl = visible.get(toHost(site.host));
  if (!siteUrl) { missing.push(site.host); log(`skip ${site.host}: not visible to the service account`); continue; }
  log(`fetching ${site.host} (${siteUrl}) ${CUR.startDate}..${CUR.endDate}`);
  const fetchPeriod = async (p) => ({
    byDate: await query(siteUrl, p, ["date"]),
    byQuery: await query(siteUrl, p, ["query"]),
    byPage: await query(siteUrl, p, ["page"]),
    byQueryPage: await query(siteUrl, p, ["query", "page"]),
    byDevice: await query(siteUrl, p, ["device"]),
  });
  const cur = await fetchPeriod(CUR);
  const prev = await fetchPeriod(PREV);
  const importantRes = (site.importantPages || []).map((s) => new RegExp(s, "iu"));
  analyses.push(analyzeSite(site, cur, prev, importantRes));
}
if (!analyses.length) fail(1, `no configured site is visible. Missing: ${missing.join(", ")}`);

const outPath = opt("--out") || resolve(ROOT, "reports/gsc", `${CUR.endDate}.md`);
mkdirSync(dirname(outPath), { recursive: true });
const header = [
  `# דוח Search Console שבועי — ${iso(today)}`, "",
  `תקופה: ${CUR.startDate} עד ${CUR.endDate} (28 ימים, נתונים סופיים). השוואה: ${PREV.startDate} עד ${PREV.endDate}.`, "",
  missing.length ? `> נכסים שלא נראים ל-Service Account ולא נכללו: ${missing.join(", ")}` : "", "",
];
writeFileSync(outPath, [...header, ...analyses.map(renderSite)].join("\n"));
log(`report written: ${outPath}`);
if (flag("--json")) {
  const j = outPath.replace(/\.md$/, ".json");
  writeFileSync(j, JSON.stringify({ period: CUR, previous: PREV, sites: analyses }, null, 2));
  log(`data written: ${j}`);
}
console.log(outPath);
