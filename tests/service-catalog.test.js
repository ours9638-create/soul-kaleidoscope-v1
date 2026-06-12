import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildServiceWorkflow,
  getServiceDefinition,
  listServices
} from '../src/core/service-catalog.js';

test('service catalog lists number, oil, and combined services', () => {
  const services = listServices();
  const ids = services.map((service) => service.id);

  assert.deepEqual(ids, [
    'soul-number-reading',
    'essential-oil-product',
    'soul-number-with-oil'
  ]);
});

test('soul number reading is the primary service', () => {
  const service = getServiceDefinition('soul-number-reading');

  assert.equal(service.isPrimary, true);
  assert.equal(service.canStandalone, true);
  assert.deepEqual(service.canCombineWith, ['essential-oil-product']);
  assert.ok(service.requiredInputs.includes('solarDate'));
  assert.ok(service.outputs.includes('靈魂萬花圖 SVG 校對版'));
});

test('essential oil product can stand alone with safety boundaries', () => {
  const service = getServiceDefinition('essential-oil-product');

  assert.equal(service.isPrimary, false);
  assert.equal(service.canStandalone, true);
  assert.equal(service.requiresSoulNumberResult, false);
  assert.ok(service.requiredInputs.includes('usageScenario'));
  assert.ok(service.riskNotes.some((note) => note.includes('不寫治療')));
});

test('combined workflow requires number result before oil suggestion', () => {
  const workflow = buildServiceWorkflow('soul-number-with-oil');

  assert.equal(workflow.serviceId, 'soul-number-with-oil');
  assert.deepEqual(workflow.steps.map((step) => step.id), [
    'calculate-soul-number',
    'build-image-checklist',
    'build-oil-suggestion',
    'build-combined-report'
  ]);
  assert.ok(workflow.guardrails.some((rule) => rule.includes('精油不得反推數字公式')));
});
