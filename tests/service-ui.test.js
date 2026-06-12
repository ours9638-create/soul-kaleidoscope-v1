import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../web/index.html', import.meta.url), 'utf8');
const appJs = fs.readFileSync(new URL('../web/app.js', import.meta.url), 'utf8');
const deploymentConfig = fs.readFileSync(new URL('../web/deployment-config.js', import.meta.url), 'utf8');

test('PWA defaults to soul number service', () => {
  assert.match(html, /name="serviceId"/);
  assert.match(html, /value="soul-number-reading" selected/);
});

test('PWA has oil fields grouped separately from number fields', () => {
  assert.match(html, /id="oilFields"/);
  assert.match(html, /name="usageScenario"/);
  assert.match(html, /name="productType"/);
  assert.match(html, /name="selectedOils"/);
});

test('PWA toggles oil fields based on selected service', () => {
  assert.match(appJs, /function updateServiceFields/);
  assert.match(appJs, /essential-oil-product/);
  assert.match(appJs, /soul-number-with-oil/);
});

test('PWA clears required birthday fields for oil-only service', () => {
  assert.match(appJs, /numberFields\.querySelectorAll\('input'\)/);
  assert.match(appJs, /input\.required = numberSelected/);
});

test('PWA sends one request that saves and generates delivery links', () => {
  assert.match(appJs, /save-and-generate-report/);
  assert.match(appJs, /data\.reportUrl/);
  assert.match(appJs, /data\.svgUrl/);
});

test('PWA can save and reuse the Apps Script URL locally', () => {
  assert.match(html, /id="saveApiUrlButton"/);
  assert.match(appJs, /soulKaleidoscope\.appsScriptApiUrl/);
  assert.match(appJs, /function restoreApiUrl/);
  assert.match(appJs, /function saveApiUrl/);
  assert.match(appJs, /DEPLOYMENT_CONFIG\.appsScriptApiUrl/);
  assert.match(appJs, /window\.localStorage\.setItem/);
});

test('PWA ships with the verified Apps Script Web App URL', () => {
  assert.match(deploymentConfig, /script\.google\.com\/macros\/s\/AKfycbyBWz4po4qAiJtTannRhFFYc0ShBLWaO_FART2ndulub0fLlN0eaFBwot-wlMHgXgxd\/exec/);
  assert.doesNotMatch(deploymentConfig, /oauthcallback|accounts\.google\.com|script\.google\.com\/u\/0\/home\/projects/);
});

test('PWA can run a backend setup check before sending cases', () => {
  assert.match(html, /id="checkBackendButton"/);
  assert.match(appJs, /setup-workbook/);
  assert.match(appJs, /appVersion/);
  assert.match(appJs, /missingHeaders/);
  assert.match(appJs, /reportFolderUrl/);
});

test('PWA posts to Apps Script without JSON preflight headers', () => {
  assert.doesNotMatch(appJs, /Content-Type': 'application\/json/);
  assert.match(appJs, /Content-Type': 'text\/plain;charset=utf-8/);
});
