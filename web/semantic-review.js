const elements = {
  file: document.querySelector('#jsonFile'),
  loadStatus: document.querySelector('#loadStatus'),
  workspace: document.querySelector('#workspace'),
  exportCard: document.querySelector('#exportCard'),
  prev: document.querySelector('#prevButton'),
  next: document.querySelector('#nextButton'),
  currentIndex: document.querySelector('#currentIndex'),
  totalCount: document.querySelector('#totalCount'),
  module: document.querySelector('#moduleLabel'),
  version: document.querySelector('#versionLabel'),
  item: document.querySelector('#itemLabel'),
  itemStatus: document.querySelector('#itemStatus'),
  title: document.querySelector('#title'),
  guard: document.querySelector('#guardBox'),
  candidate: document.querySelector('#candidateText'),
  originalSection: document.querySelector('#originalSection'),
  original: document.querySelector('#originalText'),
  revision: document.querySelector('#revision'),
  note: document.querySelector('#note'),
  saveStatus: document.querySelector('#saveStatus'),
  reviewed: document.querySelector('#reviewedCount'),
  pending: document.querySelector('#pendingCount'),
  exportButton: document.querySelector('#exportButton')
};

const decisionButtons = [...document.querySelectorAll('[data-decision]')];
let pkg = null;
let items = [];
let index = 0;
let storageKey = '';

function fail(message) {
  elements.loadStatus.textContent = message;
  elements.workspace.classList.add('hidden');
  elements.exportCard.classList.add('hidden');
}

function inferModule(data) {
  if (data?.module) return data.module;
  const keys = Object.keys(data?.records || {});
  if (keys.length && keys.every(key => /^[1-9]x[1-9]$/.test(key))) return 'annual';
  return null;
}

function normalizeAnnual(data) {
  const keys = Object.keys(data.records || {}).filter(key => /^[1-9]x[1-9]$/.test(key));
  if (!keys.length) throw new Error('年度 JSON 找不到合法的 annual × position 紀錄。');
  keys.sort((a,b) => {
    const [aa,ap] = a.split('x').map(Number);
    const [ba,bp] = b.split('x').map(Number);
    return aa - ba || ap - bp;
  });
  return keys.map(key => {
    const record = data.records[key];
    return {
      id: key,
      title: `流年 ${record.annual ?? key.split('x')[0]} × 位格 ${record.position ?? key.split('x')[1]}`,
      candidateText: record.revision || record.original?.text || '',
      originalText: [record.original?.text, record.original?.annualText, record.original?.positionText].filter(Boolean).join('\n\n'),
      guard: record.guard || '',
      decision: mapIncomingDecision(record.decision),
      revision: record.revision || '',
      note: record.reason || record.reviewNote || ''
    };
  });
}

function normalizeMainDestiny(data) {
  const rows = Object.entries(data.records || {}).map(([key,record]) => ({ key, record }));
  if (!rows.length) throw new Error('主命數 JSON 沒有 records。');
  for (const {record} of rows) {
    if (record.module && record.module !== 'mainDestiny') throw new Error('JSON 混入不同 module。');
    if (!Number.isInteger(Number(record.number)) || Number(record.number) < 1 || Number(record.number) > 9) {
      throw new Error('主命數 number 必須是 1～9。');
    }
    if (!['core-mature','core-shadow'].includes(record.context)) throw new Error('目前只支援 core-mature / core-shadow。');
  }
  rows.sort((a,b) => Number(a.record.number) - Number(b.record.number) ||
    (a.record.context === 'core-mature' ? -1 : 1));
  return rows.map(({key,record}) => ({
    id: record.reviewId || key,
    title: `主命數 ${record.number}｜${record.context === 'core-mature' ? '成熟發揮' : '失衡提醒'}`,
    candidateText: record.candidateText || '',
    originalText: '',
    guard: record.guard || record.sourceAlignment || '',
    decision: mapIncomingDecision(record.decision),
    revision: record.revision || '',
    note: record.reviewNote || ''
  }));
}

function mapIncomingDecision(value) {
  if (value === 'approve' || value === 'keep') return 'approve';
  if (value === 'revise') return 'revise';
  if (value === 'hold' || value === 'reject') return 'hold';
  return null;
}

function storageKeyFor(module, version) {
  return `soulKaleidoscope.semanticReview.${module}.${version || 'unversioned'}`;
}

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '{}');
  } catch {
    return {};
  }
}

function writeSaved(saved) {
  localStorage.setItem(storageKey, JSON.stringify(saved));
}

function current() { return items[index]; }

function render() {
  const item = current();
  if (!item) return;
  const saved = loadSaved()[item.id] || {};
  const decision = saved.decision ?? item.decision ?? null;
  elements.currentIndex.textContent = String(index + 1);
  elements.totalCount.textContent = String(items.length);
  elements.module.textContent = pkg.module;
  elements.version.textContent = pkg.candidateVersion || '未標示';
  elements.item.textContent = item.id;
  elements.title.textContent = item.title;
  elements.candidate.textContent = item.candidateText;
  elements.revision.value = saved.revision ?? item.revision ?? '';
  elements.note.value = saved.note ?? item.note ?? '';
  elements.itemStatus.textContent = decision ? ({approve:'通過',revise:'修改',hold:'暫緩'}[decision]) : '待審';
  if (item.originalText) {
    elements.original.textContent = item.originalText;
    elements.originalSection.classList.remove('hidden');
  } else {
    elements.originalSection.classList.add('hidden');
  }
  if (item.guard) {
    elements.guard.textContent = `Guard：${item.guard}`;
    elements.guard.classList.remove('hidden');
  } else {
    elements.guard.classList.add('hidden');
  }
  decisionButtons.forEach(button => button.classList.toggle('active', button.dataset.decision === decision));
  elements.prev.disabled = index === 0;
  elements.next.disabled = index === items.length - 1;
  elements.saveStatus.textContent = '';
  updateCounts();
}

function updateCounts() {
  const saved = loadSaved();
  let reviewed = 0;
  for (const item of items) {
    if (saved[item.id]?.decision || item.decision) reviewed += 1;
  }
  elements.reviewed.textContent = String(reviewed);
  elements.pending.textContent = String(items.length - reviewed);
}

function saveDecision(decision) {
  const item = current();
  const revision = elements.revision.value.trim();
  const note = elements.note.value.trim();
  if (decision === 'revise' && !revision) {
    elements.saveStatus.textContent = '選「修改」時必須填修改文字。';
    return;
  }
  const saved = loadSaved();
  saved[item.id] = {
    decision,
    revision: decision === 'revise' ? revision : '',
    note,
    updatedAt: new Date().toISOString()
  };
  writeSaved(saved);
  render();
  elements.saveStatus.textContent = '已保存在這個瀏覽器。';
}

function buildExport() {
  const saved = loadSaved();
  const copy = structuredClone(pkg.raw);
  copy.reviewPackageType = copy.reviewPackageType || (pkg.module === 'annual' ? 'annual-review' : 'semantic-phrase-review');
  copy.module = pkg.module;
  copy.status = 'local-review';
  copy.canonicalAdopted = false;
  copy.runtimeEligible = false;
  let reviewedCount = 0;
  for (const item of items) {
    const result = saved[item.id];
    if (!result) continue;
    reviewedCount += 1;
    const target = copy.records[item.id] || Object.values(copy.records).find(r => (r.reviewId || '') === item.id);
    if (!target) continue;
    target.decision = result.decision;
    if (pkg.module === 'annual') {
      target.revision = result.decision === 'revise' ? result.revision : (target.revision || '');
      target.reason = result.note;
    } else {
      target.revision = result.decision === 'revise' ? result.revision : null;
      target.reviewNote = result.note;
    }
    target.updatedAt = result.updatedAt;
  }
  copy.reviewedCount = reviewedCount;
  copy.pendingCount = items.length - reviewedCount;
  copy.exportedAt = new Date().toISOString();
  return copy;
}

elements.file.addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.schemaVersion !== 1) throw new Error('只支援 schemaVersion 1。');
    if (!data.records || typeof data.records !== 'object') throw new Error('JSON 缺少 records。');
    const module = inferModule(data);
    if (!['annual','mainDestiny'].includes(module)) throw new Error('目前只支援 annual 或 mainDestiny。');
    const normalized = module === 'annual' ? normalizeAnnual(data) : normalizeMainDestiny(data);
    pkg = { raw: data, module, candidateVersion: data.candidateVersion || 'unversioned' };
    items = normalized;
    index = 0;
    storageKey = storageKeyFor(module, pkg.candidateVersion);
    elements.loadStatus.textContent = `已載入 ${module}｜${items.length} 則；本機保存空間與其他模組分離。`;
    elements.workspace.classList.remove('hidden');
    elements.exportCard.classList.remove('hidden');
    render();
  } catch (error) {
    fail(`無法載入：${error.message}`);
  }
});

elements.prev.addEventListener('click', () => { if (index > 0) { index -= 1; render(); } });
elements.next.addEventListener('click', () => { if (index < items.length - 1) { index += 1; render(); } });
decisionButtons.forEach(button => button.addEventListener('click', () => saveDecision(button.dataset.decision)));

elements.exportButton.addEventListener('click', () => {
  if (!pkg) return;
  const payload = JSON.stringify(buildExport(), null, 2);
  const blob = new Blob([payload], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${pkg.module}-review-${pkg.candidateVersion}-export.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});
