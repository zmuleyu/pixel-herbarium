/**
 * ASC metadata push via proxy (workaround for Node.js fetch not honoring HTTPS_PROXY)
 * Patches all calls through http://127.0.0.1:7897
 */
import { createSign } from 'crypto';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { URL } from 'url';

const KEY_ID      = 'XJHT7346H7';
const ISSUER_ID   = 'd25809ce-3341-4b28-851e-b82de0e92d63';
const APP_ID      = '6760695082';
const PRIVATE_KEY = readFileSync(homedir() + '/.appstoreconnect/AuthKey_XJHT7346H7.p8', 'utf8');

const PROXY_HOST = '127.0.0.1';
const PROXY_PORT = 7897;
const ASC_BASE   = 'https://api.appstoreconnect.apple.com/v1';

function makeJWT() {
  const header  = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' })).toString('base64url');
  const now     = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ iss: ISSUER_ID, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' })).toString('base64url');
  const sign    = createSign('SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign({ key: PRIVATE_KEY, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `${header}.${payload}.${sig}`;
}

function proxyFetch(method, path, body) {
  return new Promise((resolve, reject) => {
    const targetUrl = new URL(`${ASC_BASE}${path}`);
    const connectOpts = {
      host: PROXY_HOST,
      port: PROXY_PORT,
      method: 'CONNECT',
      path: `${targetUrl.hostname}:443`,
    };
    const connectReq = httpRequest(connectOpts);
    connectReq.on('connect', (res, socket) => {
      const bodyStr = body ? JSON.stringify(body) : null;
      const reqOpts = {
        host: targetUrl.hostname,
        path: targetUrl.pathname + (targetUrl.search || ''),
        method,
        socket,
        agent: false,
        headers: {
          'Authorization': `Bearer ${makeJWT()}`,
          'Content-Type': 'application/json',
          ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
        },
      };
      const req = httpsRequest(reqOpts, (res2) => {
        let data = '';
        res2.on('data', c => data += c);
        res2.on('end', () => {
          if (res2.statusCode >= 400) {
            reject(new Error(`${method} ${path} → ${res2.statusCode}: ${data.slice(0, 400)}`));
          } else {
            resolve(data ? JSON.parse(data) : null);
          }
        });
      });
      req.on('error', reject);
      if (bodyStr) req.write(bodyStr);
      req.end();
    });
    connectReq.on('error', reject);
    connectReq.end();
  });
}

async function asc(method, path, body) {
  await new Promise(r => setTimeout(r, 3000));
  return proxyFetch(method, path, body);
}

async function main() {
  console.log('── Step 1: get app info localizations ──');
  const appInfos = await asc('GET', `/apps/${APP_ID}/appInfos`);
  const liveInfo = appInfos.data.find(i => i.attributes.appStoreState !== 'DEVELOPER_REMOVED') ?? appInfos.data[0];
  console.log('appInfo id:', liveInfo.id, '| state:', liveInfo.attributes.appStoreState);

  const locs = await asc('GET', `/appInfos/${liveInfo.id}/appInfoLocalizations`);
  const jaLoc = locs.data.find(l => l.attributes.locale === 'ja' || l.attributes.locale === 'ja-JP');
  console.log('ja localization id:', jaLoc?.id, '| locale:', jaLoc?.attributes?.locale);

  console.log('\n── Step 2: PATCH appInfoLocalization (privacyPolicyUrl) ──');
  const patch2 = await asc('PATCH', `/appInfoLocalizations/${jaLoc.id}`, {
    data: {
      type: 'appInfoLocalizations',
      id: jaLoc.id,
      attributes: { privacyPolicyUrl: 'https://pixel-herbarium.com/privacy-policy' },
    },
  });
  console.log('✅ privacyPolicyUrl:', patch2.data.attributes.privacyPolicyUrl);

  console.log('\n── Step 3: get app store versions ──');
  const vers = await asc('GET', `/apps/${APP_ID}/appStoreVersions?filter[appStoreState]=PREPARE_FOR_SUBMISSION,WAITING_FOR_REVIEW,IN_REVIEW,DEVELOPER_REJECTED,READY_FOR_SALE&fields[appStoreVersions]=state,versionString`);
  let ver = vers.data[0];
  if (!ver) {
    const allVers = await asc('GET', `/apps/${APP_ID}/appStoreVersions?fields[appStoreVersions]=state,versionString`);
    ver = allVers.data[0];
  }
  console.log('version id:', ver.id, '| state:', ver.attributes?.state ?? ver.attributes?.appStoreState);

  const verLocs = await asc('GET', `/appStoreVersions/${ver.id}/appStoreVersionLocalizations`);
  const jaVerLoc = verLocs.data.find(l => l.attributes.locale === 'ja' || l.attributes.locale === 'ja-JP');
  console.log('ja version localization id:', jaVerLoc?.id);

  console.log('\n── Step 4: PATCH version localization (supportUrl + marketingUrl) ──');
  const patch4 = await asc('PATCH', `/appStoreVersionLocalizations/${jaVerLoc.id}`, {
    data: {
      type: 'appStoreVersionLocalizations',
      id: jaVerLoc.id,
      attributes: {
        supportUrl:  'https://pixel-herbarium.com/support',
        marketingUrl:'https://pixel-herbarium.com/',
      },
    },
  });
  console.log('✅ supportUrl:   ', patch4.data.attributes.supportUrl);
  console.log('✅ marketingUrl: ', patch4.data.attributes.marketingUrl);
  console.log('\n🎉 All done.');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
