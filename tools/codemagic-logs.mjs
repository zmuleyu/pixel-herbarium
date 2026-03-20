/**
 * Fetch full Codemagic build logs via REST API
 * Bypasses the 50-line UI truncation.
 *
 * Usage:
 *   node tools/codemagic-logs.mjs              → latest build log
 *   node tools/codemagic-logs.mjs <buildId>    → specific build log
 *   node tools/codemagic-logs.mjs --list       → list recent 10 builds
 *
 * Setup:
 *   mkdir -p ~/.codemagic && echo "YOUR_TOKEN" > ~/.codemagic/token
 *   Token: Codemagic Dashboard → User settings → Integrations → Codemagic API
 */
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { URL } from 'url';

const APP_ID     = '69ba556c2217be10dc8b85f8';
const API_BASE   = 'https://api.codemagic.io';
const PROXY_HOST = '127.0.0.1';
const PROXY_PORT = 7897;

function readToken() {
  const tokenPath = homedir() + '/.codemagic/token';
  try {
    return readFileSync(tokenPath, 'utf8').replace(/^\uFEFF/, '').trim();
  } catch {
    console.error(`❌ Token not found at ${tokenPath}`);
    console.error('   Run: mkdir -p ~/.codemagic && echo "YOUR_TOKEN" > ~/.codemagic/token');
    process.exit(1);
  }
}

const TOKEN = readToken();

function proxyFetch(method, path) {
  return new Promise((resolve, reject) => {
    const targetUrl = new URL(`${API_BASE}${path}`);
    const connectOpts = {
      host: PROXY_HOST,
      port: PROXY_PORT,
      method: 'CONNECT',
      path: `${targetUrl.hostname}:443`,
    };
    const connectReq = httpRequest(connectOpts);
    connectReq.on('connect', (_res, socket) => {
      const reqOpts = {
        host: targetUrl.hostname,
        path: targetUrl.pathname + (targetUrl.search || ''),
        method,
        socket,
        agent: false,
        headers: {
          'x-auth-token': TOKEN,
          'Content-Type': 'application/json',
        },
      };
      const req = httpsRequest(reqOpts, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          if (res.statusCode >= 400) {
            reject(new Error(`${method} ${path} → HTTP ${res.statusCode}: ${data.slice(0, 300)}`));
          } else {
            resolve(data);
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
    connectReq.on('error', reject);
    connectReq.end();
  });
}

// Download a full URL (for artefact log files, which may be on S3/CDN)
function downloadUrl(rawUrl) {
  return new Promise((resolve, reject) => {
    const targetUrl = new URL(rawUrl);
    const isHttps = targetUrl.protocol === 'https:';
    if (!isHttps) return reject(new Error('Only HTTPS artefact URLs supported'));

    const connectOpts = {
      host: PROXY_HOST,
      port: PROXY_PORT,
      method: 'CONNECT',
      path: `${targetUrl.hostname}:443`,
    };
    const connectReq = httpRequest(connectOpts);
    connectReq.on('connect', (_res, socket) => {
      const reqOpts = {
        host: targetUrl.hostname,
        path: targetUrl.pathname + (targetUrl.search || ''),
        method: 'GET',
        socket,
        agent: false,
        headers: {},
      };
      const req = httpsRequest(reqOpts, (res) => {
        // Follow redirect (S3 presigned URLs may redirect)
        if (res.statusCode === 301 || res.statusCode === 302) {
          return downloadUrl(res.headers.location).then(resolve).catch(reject);
        }
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.end();
    });
    connectReq.on('error', reject);
    connectReq.end();
  });
}

async function listBuilds() {
  const raw = await proxyFetch('GET', `/builds?appId=${APP_ID}&limit=10`);
  const { builds } = JSON.parse(raw);
  if (!builds || builds.length === 0) {
    console.log('No builds found.');
    return;
  }
  console.log(`\n${'ID'.padEnd(26)} ${'Status'.padEnd(12)} ${'Workflow'.padEnd(40)} Started`);
  console.log('─'.repeat(100));
  for (const b of builds) {
    const id       = b._id || b.id || '?';
    const status   = b.status || '?';
    const workflow = (b.workflowName || b.workflow?.name || '?').slice(0, 38);
    const started  = b.startedAt ? new Date(b.startedAt).toLocaleString('zh-CN') : '?';
    console.log(`${id.padEnd(26)} ${status.padEnd(12)} ${workflow.padEnd(40)} ${started}`);
  }
  console.log();
}

async function fetchLog(buildId) {
  // 1. Get build details
  console.error(`Fetching build ${buildId}...`);
  const raw = await proxyFetch('GET', `/builds/${buildId}`);
  const { build } = JSON.parse(raw);

  if (!build) {
    console.error('❌ Build not found');
    process.exit(1);
  }

  const status   = build.status || '?';
  const workflow = build.workflowName || build.workflow?.name || '?';
  const started  = build.startedAt ? new Date(build.startedAt).toLocaleString('zh-CN') : '?';
  console.error(`\nBuild: ${buildId}`);
  console.error(`Status: ${status} | Workflow: ${workflow} | Started: ${started}\n`);

  // 2. Extract logs from buildActions
  const actions = build.buildActions || [];
  if (actions.length > 0) {
    for (const action of actions) {
      const name    = action.name || '(step)';
      const astatus = action.status || '';
      const logUrl  = action.logUrl || '';
      process.stdout.write(`\n${'═'.repeat(60)}\n`);
      process.stdout.write(`STEP: ${name}  [${astatus}]\n`);
      process.stdout.write(`${'─'.repeat(60)}\n`);
      if (logUrl) {
        // logUrl is a Codemagic API path, fetch with auth token via proxy
        const urlPath = logUrl.replace('https://api.codemagic.io', '');
        try {
          const logText = await proxyFetch('GET', urlPath);
          process.stdout.write(logText + '\n');
        } catch (e) {
          process.stdout.write(`(log fetch failed: ${e.message})\n`);
        }
      } else {
        process.stdout.write('(no logUrl)\n');
      }
    }
    return;
  }

  // 3. Fallback: artefact log file
  const artefacts = build.artefacts || [];
  const logArtefact = artefacts.find(a =>
    (a.name || '').toLowerCase().includes('log') ||
    (a.type || '').toLowerCase().includes('log')
  );
  if (logArtefact) {
    console.error(`Downloading log artefact: ${logArtefact.name}`);
    const logText = await downloadUrl(logArtefact.url);
    process.stdout.write(logText);
    return;
  }

  // 4. Nothing found
  if (build.message) console.error('Build message:', build.message);
  console.error('❌ No logs found. Keys:', Object.keys(build).join(', '));
  process.exit(1);
}

async function getLatestBuildId() {
  const raw = await proxyFetch('GET', `/builds?appId=${APP_ID}&limit=1`);
  const { builds } = JSON.parse(raw);
  if (!builds || builds.length === 0) {
    console.error('❌ No builds found');
    process.exit(1);
  }
  return builds[0]._id || builds[0].id;
}

// ── main ──────────────────────────────────────────────────────────────────────
const arg = process.argv[2];

if (arg === '--list') {
  listBuilds().catch(e => { console.error('❌', e.message); process.exit(1); });
} else {
  const buildId = arg || await getLatestBuildId();
  fetchLog(buildId).catch(e => { console.error('❌', e.message); process.exit(1); });
}
