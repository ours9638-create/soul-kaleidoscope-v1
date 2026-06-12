import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FREE_FIRST_STACK,
  getRecommendedStack,
  getUsageSavingRules,
  getUpgradeTriggers
} from '../src/core/resource-plan.js';

test('recommends Google Sheets and Apps Script for v1 backend', () => {
  const stack = getRecommendedStack({ stage: 'v1', operatorMode: 'owner_only' });

  assert.equal(stack.backend.primary, FREE_FIRST_STACK.appsScript.name);
  assert.equal(stack.database.primary, FREE_FIRST_STACK.googleSheets.name);
  assert.equal(stack.mobile.primary, 'PWA');
  assert.equal(stack.avoid.includes('Native iOS/Android app'), true);
});

test('usage saving rules prioritize local calculation and batching', () => {
  const rules = getUsageSavingRules();

  assert.ok(rules.some((rule) => rule.includes('前端先本機計算')));
  assert.ok(rules.some((rule) => rule.includes('批次寫入')));
  assert.ok(rules.some((rule) => rule.includes('SVG 校對版')));
});

test('upgrade triggers prevent premature paid migration', () => {
  const triggers = getUpgradeTriggers();

  assert.ok(triggers.some((trigger) => trigger.includes('連續 30 天')));
  assert.ok(triggers.some((trigger) => trigger.includes('Google Sheets')));
  assert.ok(triggers.some((trigger) => trigger.includes('客人自助登入')));
});
