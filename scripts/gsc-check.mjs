#!/usr/bin/env node
// gsc-check.mjs
//
// Verifies that the Google service-account key used by the Search Console MCP
// server (.mcp.json -> "gsc") actually works, without any npm dependencies:
//
//   1. reads the key file (GSC_CREDENTIALS_FILE or .secrets/gsc-service-account.json)
//   2. signs a JWT with the key and exchanges it for an access token
//   3. calls the Search Console API and lists the properties the account can see
//   4. reports which of the expected properties are missing
//
//   node scripts/gsc-check.mjs                       # check default key + default sites
//   node scripts/gsc-check.mjs teleco.co.il          # check that this site is visible
//   GSC_CREDENTIALS_FILE=/path/key.json node scripts/gsc-check.mjs
//
// Exit codes: 0 all good, 1 auth/API failure, 2 expected property missing, 3 bad key file.

import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";

const KEY_FILE = process.env.GSC_CREDENTIALS_FILE || ".secrets/gsc-service-account.json";
const DEFAULT_SITES = ["teleco.co.il", "מרכזיות-טלפונים.org.il"];
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

const expected = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_SITES;

function fail(code, msg) {
  console.error(`FAIL  ${msg}`);
  process.exit(code);
}

// --- 1. key file -----------------------------------------------------------
let key;
try {
  key = JSON.parse(readFileSync(KEY_FILE, "utf8"));
} catch (e) {
  fail(3, `cannot read ${KEY_FILE}: ${e.message}\n      Run ./scripts/setup-gsc-mcp.sh <downloaded-key.json> first.`);
}
for (const f of ["client_email", "private_key", "token_uri"]) {
  if (typeof key[f] !== "string" || !key[f]) fail(3, `${KEY_FILE} has no "${f}" field — not a service-account key.`);
}
if (key.type !== "service_account") fail(3, `${KEY_FILE} is type "${key.type}", expected "service_account".`);
console.log(`OK    key file ${KEY_FILE}`);
console.log(`      service account: ${key.client_email}`);

// --- 2. JWT -> access token -------------------------------------------------
const b64url = (s) => Buffer.from(s).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
const claims = b64url(JSON.stringify({ iss: key.client_email, scope: SCOPE, aud: key.token_uri, iat: now, exp: now + 300 }));
const signer = createSign("RSA-SHA256");
signer.update(`${header}.${claims}`);
let signature;
try {
  signature = signer.sign(key.private_key, "base64url");
} catch (e) {
  fail(3, `private_key in ${KEY_FILE} is not a valid RSA key: ${e.message}`);
}
const assertion = `${header}.${claims}.${signature}`;

const tokenRes = await fetch(key.token_uri, {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
});
const tokenBody = await tokenRes.json().catch(() => ({}));
if (!tokenRes.ok || !tokenBody.access_token) {
  fail(1, `token exchange failed (${tokenRes.status}): ${tokenBody.error_description || tokenBody.error || "no body"}\n      Common causes: key revoked/deleted in Google Cloud, or clock skew on this machine.`);
}
console.log("OK    access token obtained");

// --- 3. list properties -----------------------------------------------------
const sitesRes = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
  headers: { authorization: `Bearer ${tokenBody.access_token}` },
});
const sitesBody = await sitesRes.json().catch(() => ({}));
if (!sitesRes.ok) {
  const msg = sitesBody.error?.message || "no body";
  fail(1, `Search Console API returned ${sitesRes.status}: ${msg}\n      If 403: enable "Google Search Console API" in the Google Cloud project that owns this key.`);
}
const sites = sitesBody.siteEntry || [];
console.log(`OK    Search Console API reachable — ${sites.length} propert${sites.length === 1 ? "y" : "ies"} visible`);
for (const s of sites) console.log(`      ${s.siteUrl.padEnd(45)} ${s.permissionLevel}`);
if (sites.length === 0) {
  console.log(`      None. Add ${key.client_email} as a user on each property in Search Console.`);
}

// --- 4. expected properties -------------------------------------------------
// A property can be a domain ("sc-domain:example.com") or a URL prefix
// ("https://example.com/"). Match on the bare host, punycode or unicode.
const toHost = (u) => {
  let h = u.replace(/^sc-domain:/, "");
  try { if (/^https?:\/\//.test(h)) h = new URL(h).hostname; } catch { /* keep as is */ }
  try { h = new URL(`http://${h}`).hostname; } catch { /* keep as is */ }
  return h.replace(/^www\./, "").toLowerCase();
};
const visible = new Set(sites.map((s) => toHost(s.siteUrl)));
let missing = 0;
for (const site of expected) {
  const host = toHost(site);
  if (visible.has(host)) {
    console.log(`OK    ${site} is visible`);
  } else {
    missing++;
    console.error(`FAIL  ${site} is NOT visible to ${key.client_email}`);
    console.error(`      Search Console -> property -> Settings -> Users and permissions -> Add user (Full or Restricted).`);
  }
}
if (missing) process.exit(2);
console.log("\nAll good. In VS Code, open the Claude Code prompt and run /mcp — 'gsc' should be connected.");
