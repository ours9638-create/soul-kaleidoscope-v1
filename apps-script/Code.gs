const CONFIG = {
  APP_VERSION: '0.1.0',
  FORMULA_SPREADSHEET_ID: '12Ddaw4FoMJ4eOFcQ8N-xi2LSiOC0mi4ab877E6sknKQ',
  CONTENT_SPREADSHEET_ID: '1nsUEuPIfeIClQe4RBcWGkRjh9ExT7pT0CMkX6Hp7cEg',
  CASE_SHEET_NAME: '個案資料表',
  OUTPUT_SHEET_NAME: '輸出紀錄',
  REPORT_FOLDER_NAME: '靈魂萬花筒_v1_輸出'
};

const CASE_HEADERS = [
  'caseId', 'createdAt', 'serviceId', 'displayName', 'solarDate', 'lunarDate', 'birthTime', 'queryDate',
  'usageScenario', 'productType', 'selectedOils', 'solarMain', 'lunarMain', 'solarBloom', 'lunarBloom',
  'horses', 'solarSupport', 'lunarSupport', 'yearFlow', 'annualPosition', 'versionMode',
  'serviceOutputStatus', 'status'
];

const OUTPUT_HEADERS = [
  'token', 'createdAt', 'caseId', 'serviceId', 'displayName', 'reportUrl', 'svgUrl', 'reportType', 'status'
];

function doGet(e) {
  const parameter = e && e.parameter ? e.parameter : {};
  const action = parameter.action || 'admin';
  if (action === 'health') return jsonResponse(healthCheck_());
  if (action === 'setup') return jsonResponse(setupWorkbook_());
  if (action === 'case') return jsonResponse(getCaseById_(parameter.id));
  if (action === 'report') return htmlReportResponse_(parameter.token);
  return HtmlService.createTemplateFromFile('Admin').evaluate()
    .setTitle('靈魂萬花筒 v1 後台')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  const body = parseBody_(e);
  if (body.action === 'setup-workbook') return jsonResponse(setupWorkbook_());
  if (body.action === 'calculate-case') return jsonResponse(calculateAndSaveCase(body.payload || body));
  if (body.action === 'save-and-generate-report') return jsonResponse(saveAndGenerateReport_(body.payload || body));
  if (body.action === 'generate-report') return jsonResponse(generateReport_(body.caseId, body.payload));
  return jsonResponse({ ok: false, error: 'unknown action' }, 400);
}

function setupWorkbook() {
  return setupWorkbook_();
}

function calculateAndSaveCase(payload) {
  const serviceCase = buildServiceCase_(payload || {});
  ensureWorkbook_();
  const sheet = getSheet_(CONFIG.CASE_SHEET_NAME);
  const writeState = saveCaseRowIfNeeded_(sheet, serviceCase);
  if (writeState.duplicateCaseWarning) {
    serviceCase.duplicateCaseWarning = writeState.duplicateCaseWarning;
  }
  return serviceCase;
}

function saveAndGenerateReport_(payload) {
  const serviceCase = buildServiceCase_(payload || {});
  ensureWorkbook_();
  const caseSheet = getSheet_(CONFIG.CASE_SHEET_NAME);
  const writeState = saveCaseRowIfNeeded_(caseSheet, serviceCase);
  const delivery = createDeliveryFiles_(serviceCase);
  if (writeState.duplicateCaseWarning) {
    delivery.duplicateCaseWarning = writeState.duplicateCaseWarning;
  }
  return delivery;
}

function generateReport_(caseId, payload) {
  const found = payload ? { ok: true, serviceCase: buildServiceCase_(payload) } : getCaseById_(caseId);
  const serviceCase = found.serviceCase || found.case;
  if (!serviceCase) throw new Error('case not found');
  return createDeliveryFiles_(serviceCase);
}

function healthCheck_() {
  return {
    ok: true,
    app: 'soul-kaleidoscope-v1',
    appVersion: CONFIG.APP_VERSION,
    contentSpreadsheetId: CONFIG.CONTENT_SPREADSHEET_ID,
    caseSheetName: CONFIG.CASE_SHEET_NAME,
    outputSheetName: CONFIG.OUTPUT_SHEET_NAME,
    reportFolderName: CONFIG.REPORT_FOLDER_NAME
  };
}

function setupWorkbook_() {
  ensureWorkbook_();
  const folder = getOrCreateFolder_(CONFIG.REPORT_FOLDER_NAME);
  return {
    ok: true,
    appVersion: CONFIG.APP_VERSION,
    contentSpreadsheetId: CONFIG.CONTENT_SPREADSHEET_ID,
    sheets: [
      getSheetState_(CONFIG.CASE_SHEET_NAME, CASE_HEADERS),
      getSheetState_(CONFIG.OUTPUT_SHEET_NAME, OUTPUT_HEADERS)
    ],
    reportFolderName: CONFIG.REPORT_FOLDER_NAME,
    reportFolderUrl: folder.getUrl()
  };
}

function createDeliveryFiles_(serviceCase) {
  const result = serviceCase.result;
  const checklist = result ? buildImageChecklist_('soul-kaleidoscope', result) : null;
  const svg = checklist ? renderChecklistSvg_(checklist) : '';
  const report = buildServiceReport_(serviceCase.serviceId, {
    serviceCase,
    result,
    checklist,
    oilProfile: serviceCase.oilProfile
  });
  const token = Utilities.getUuid().replace(/-/g, '');
  const folder = getOrCreateFolder_(CONFIG.REPORT_FOLDER_NAME);
  const reportFile = folder.createFile(`${serviceCase.displayName}_${serviceCase.id}_report.md`, report, MimeType.PLAIN_TEXT);
  const svgFile = svg
    ? folder.createFile(`${serviceCase.displayName}_${serviceCase.id}_checklist.svg`, svg, 'image/svg+xml')
    : null;

  const sheet = getSheet_(CONFIG.OUTPUT_SHEET_NAME);
  appendObjectRow_(sheet, OUTPUT_HEADERS, {
    token,
    createdAt: new Date(),
    caseId: serviceCase.id,
    serviceId: serviceCase.serviceId,
    displayName: serviceCase.displayName,
    reportUrl: reportFile.getUrl(),
    svgUrl: svgFile ? svgFile.getUrl() : '',
    reportType: serviceCase.serviceId,
    status: 'created'
  });

  return {
    ok: true,
    caseId: serviceCase.id,
    serviceId: serviceCase.serviceId,
    token,
    reportUrl: reportFile.getUrl(),
    svgUrl: svgFile ? svgFile.getUrl() : ''
  };
}

function getCaseById_(id) {
  const sheet = getSheet_(CONFIG.CASE_SHEET_NAME);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return { ok: false, error: 'case not found' };
  const headers = values[0];
  const row = values.slice(1).find((item) => item[headers.indexOf('caseId')] === id);
  if (!row) return { ok: false, error: 'case not found' };
  const record = objectFromRow_(headers, row);
  const serviceCase = buildServiceCase_({
    id: record.caseId,
    serviceId: record.serviceId || 'soul-number-reading',
    displayName: record.displayName,
    solarDate: normalizeSheetDate_(record.solarDate),
    lunarDate: normalizeSheetDate_(record.lunarDate),
    birthTime: normalizeSheetTime_(record.birthTime, record.caseId),
    queryDate: normalizeSheetDate_(record.queryDate),
    usageScenario: record.usageScenario,
    productType: record.productType,
    selectedOils: record.selectedOils
  });
  return {
    ok: true,
    case: serviceCase,
    result: serviceCase.result
  };
}

function htmlReportResponse_(token) {
  const sheet = getSheet_(CONFIG.OUTPUT_SHEET_NAME);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return HtmlService.createHtmlOutput('<h1>報告不存在或連結已失效</h1>');
  const headers = values[0];
  const row = values.slice(1).find((item) => item[headers.indexOf('token')] === token);
  if (!row) return HtmlService.createHtmlOutput('<h1>報告不存在或連結已失效</h1>');
  const record = objectFromRow_(headers, row);
  return HtmlService.createHtmlOutput(`
    <main style="font-family: system-ui, sans-serif; max-width: 760px; margin: 40px auto; line-height: 1.7;">
      <h1>${escapeHtml_(record.displayName)}｜靈魂萬花筒報告</h1>
      <p>這是只讀交付頁。請使用下方連結查看報告與校對圖。</p>
      <p><a href="${record.reportUrl}" target="_blank">報告文字檔</a></p>
      ${record.svgUrl ? '<p><a href="' + record.svgUrl + '" target="_blank">SVG 校對圖</a></p>' : ''}
    </main>
  `);
}

function ensureWorkbook_() {
  const caseSheet = getSheet_(CONFIG.CASE_SHEET_NAME);
  ensureSheetHeaders_(caseSheet, CASE_HEADERS);
  const outputSheet = getSheet_(CONFIG.OUTPUT_SHEET_NAME);
  ensureSheetHeaders_(outputSheet, OUTPUT_HEADERS);
}

function getSheet_(name) {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.CONTENT_SPREADSHEET_ID);
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

function buildServiceCase_(payload) {
  const serviceId = normalizeServiceId_(payload.serviceId);
  const result = serviceNeedsNumber_(serviceId) ? calculateCase_(payload) : null;
  const oilProfile = normalizeOilProfile_(payload, result);
  const displayName = result ? result.displayName : (payload.displayName || oilProfile.displayName || '精油產品');
  return {
    id: result ? result.id : (payload.id || createOilCaseId_(displayName)),
    serviceId,
    displayName,
    input: payload,
    result,
    oilProfile,
    status: 'calculated'
  };
}

function normalizeServiceId_(serviceId) {
  const selected = serviceId || 'soul-number-reading';
  if (selected === 'soul-number-reading') return selected;
  if (selected === 'essential-oil-product') return selected;
  if (selected === 'soul-number-with-oil') return selected;
  throw new Error('unknown serviceId: ' + selected);
}

function serviceNeedsNumber_(serviceId) {
  return serviceId !== 'essential-oil-product';
}

function normalizeOilProfile_(payload, result) {
  return {
    displayName: payload.displayName || (result ? result.displayName : '精油產品'),
    usageScenario: payload.usageScenario || '',
    productType: payload.productType || '',
    selectedOils: normalizeOilList_(payload.selectedOils)
  };
}

function normalizeOilList_(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value).split(/[、,，/]/).map(function(item) {
    return item.trim();
  }).filter(Boolean);
}

function buildCaseRow_(serviceCase) {
  const result = serviceCase.result;
  return {
    caseId: serviceCase.id,
    createdAt: new Date(),
    serviceId: serviceCase.serviceId,
    displayName: serviceCase.displayName,
    solarDate: result ? result.input.solarDate.raw : '',
    lunarDate: result ? result.input.lunarDate.raw : '',
    birthTime: result ? result.input.birthTime.raw : '',
    queryDate: result ? result.input.queryDate.raw : '',
    usageScenario: serviceCase.oilProfile.usageScenario,
    productType: serviceCase.oilProfile.productType,
    selectedOils: serviceCase.oilProfile.selectedOils.join('、'),
    solarMain: result ? result.solar.mainDestiny.chain : '',
    lunarMain: result ? result.lunar.mainDestiny.chain : '',
    solarBloom: result ? result.solar.sunMoonBloom.chain : '',
    lunarBloom: result ? result.lunar.sunMoonBloom.chain : '',
    horses: result ? result.horseNumbers.map(function(item) { return item.value; }).join('/') : '',
    solarSupport: result ? result.supportNumbers.solar : '',
    lunarSupport: result ? result.supportNumbers.lunar : '',
    yearFlow: result ? result.annual.afterBirthday.yearFlow.chain : '',
    annualPosition: result ? result.annual.afterBirthday.position : '',
    versionMode: result ? result.versionMode : '',
    serviceOutputStatus: serviceCase.serviceId,
    status: serviceCase.status
  };
}

function saveCaseRowIfNeeded_(sheet, serviceCase) {
  ensureSheetHeaders_(sheet, CASE_HEADERS);
  const matches = findExistingCaseRows_(sheet, serviceCase.id, serviceCase.serviceId);
  if (matches.length > 0) {
    return {
      skipped: true,
      duplicateCaseWarning: {
        message: 'duplicate case row skipped',
        caseId: serviceCase.id,
        serviceId: serviceCase.serviceId,
        existingRows: matches
      }
    };
  }
  appendObjectRow_(sheet, CASE_HEADERS, buildCaseRow_(serviceCase));
  return { skipped: false };
}

function findExistingCaseRows_(sheet, caseId, serviceId) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  const caseIdIndex = headers.indexOf('caseId');
  const serviceIdIndex = headers.indexOf('serviceId');
  if (caseIdIndex === -1) return [];
  return values.slice(1).reduce(function(rows, row, index) {
    const caseMatches = row[caseIdIndex] === caseId;
    const serviceMatches = serviceIdIndex === -1 || row[serviceIdIndex] === serviceId;
    if (caseMatches && serviceMatches) rows.push(index + 2);
    return rows;
  }, []);
}

function buildServiceReport_(serviceId, context) {
  if (serviceId === 'soul-number-reading') {
    return buildReportDraft_(context.result, context.checklist);
  }
  if (serviceId === 'essential-oil-product') {
    return buildOilReport_(context.oilProfile);
  }
  if (serviceId === 'soul-number-with-oil') {
    return [
      buildReportDraft_(context.result, context.checklist),
      '',
      buildOilReport_(context.oilProfile, true)
    ].join('\n');
  }
  throw new Error('unknown service report: ' + serviceId);
}

function buildOilReport_(oilProfile, combined) {
  const oils = oilProfile.selectedOils.length ? oilProfile.selectedOils.join('、') : '待確認';
  const lines = [
    '# ' + (oilProfile.displayName || '精油產品') + '｜精油產品建議',
    '',
    '## 精油產品建議',
    '- 使用情境：' + (oilProfile.usageScenario || '待確認'),
    '- 產品型態：' + (oilProfile.productType || '待確認'),
    '- 建議精油：' + oils,
    '',
    '## 安全提醒',
    '- 精油內容作為日常支持與產品建議，不作為醫療用途。',
    '- 不寫治療、治癒、保證改善。',
    '- 孕婦、嬰幼兒、慢性病、用藥中或皮膚敏感者，使用前需先確認安全限制。'
  ];
  if (combined) {
    lines.push('', '## 與數字盤的關係', '- 精油只作為支持層，不反推數字公式。');
  }
  return lines.join('\n');
}

function ensureSheetHeaders_(sheet, requiredHeaders) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(requiredHeaders);
    return;
  }
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].filter(String);
  const missing = requiredHeaders.filter(function(header) {
    return headers.indexOf(header) === -1;
  });
  if (missing.length === 0) return;
  sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
}

function getSheetState_(name, requiredHeaders) {
  const sheet = getSheet_(name);
  const headerCount = sheet.getLastColumn();
  const headers = headerCount > 0 ? sheet.getRange(1, 1, 1, headerCount).getValues()[0].filter(String) : [];
  const missingHeaders = requiredHeaders.filter(function(header) {
    return headers.indexOf(header) === -1;
  });
  return {
    name,
    rowCount: sheet.getLastRow(),
    headerCount: headers.length,
    missingHeaders
  };
}

function appendObjectRow_(sheet, headers, data) {
  ensureSheetHeaders_(sheet, headers);
  const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  sheet.appendRow(currentHeaders.map(function(header) {
    return Object.prototype.hasOwnProperty.call(data, header) ? data[header] : '';
  }));
}

function objectFromRow_(headers, row) {
  return headers.reduce(function(record, header, index) {
    record[header] = row[index];
    return record;
  }, {});
}

function calculateCase_(input) {
  const normalized = normalizeInput_(input);
  const solar = buildCalendarResult_('solar', normalized.solarDate, normalized.birthTime);
  const lunar = buildCalendarResult_('lunar', normalized.lunarDate, normalized.birthTime);
  const solarBase = buildBaseNumbers_(normalized.solarDate);
  const lunarBase = buildBaseNumbers_(normalized.lunarDate);
  const horseNumbers = buildHorseNumbers_(solarBase);
  const birthdayState = getBirthdayState_(normalized.solarDate, normalized.queryDate);

  return {
    id: normalized.id || createCaseId_(normalized),
    displayName: normalized.displayName,
    input: normalized,
    versionMode: birthdayState.hasBirthdayPassed ? 'after_birthday_only' : 'before_and_after_birthday',
    solar,
    lunar,
    horseNumbers,
    supportNumbers: {
      solar: buildSupportNumber_(solarBase),
      lunar: buildSupportNumber_(lunarBase)
    },
    annual: buildAnnualState_(normalized, birthdayState)
  };
}

function normalizeInput_(input) {
  return {
    id: input.id,
    displayName: input.displayName || '未命名個案',
    solarDate: parseDate_(input.solarDate),
    lunarDate: parseDate_(input.lunarDate),
    birthTime: parseTime_(input.birthTime || '00:00'),
    queryDate: parseDate_(input.queryDate || Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd'))
  };
}

function parseDate_(value) {
  const parts = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!parts) throw new Error('date must use YYYY-MM-DD');
  return { raw: parts[0], year: parts[1], month: parts[2], day: parts[3] };
}

function parseTime_(value) {
  const parts = String(value).match(/^(\d{2}):(\d{2})$/);
  if (!parts) throw new Error('time must use HH:mm');
  return { raw: parts[0], hour: parts[1], minute: parts[2] };
}

function normalizeSheetDate_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, 'Asia/Taipei', 'yyyy-MM-dd');
  }
  return String(value || '').trim();
}

function normalizeSheetTime_(value, caseId) {
  const caseTime = String(caseId || '').match(/-(\d{2})-(\d{2})$/);
  if (caseTime) return caseTime[1] + ':' + caseTime[2];
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, 'Asia/Taipei', 'HH:mm');
  }
  const text = String(value || '').trim();
  const parts = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  return parts ? parts[1].padStart(2, '0') + ':' + parts[2] : text;
}

function reduceNumber_(value) {
  const digits = String(value).replace(/\D/g, '').split('').map(Number);
  let current = digits.reduce((sum, digit) => sum + digit, 0);
  const chain = [current];
  while (current >= 10) {
    current = String(current).split('').map(Number).reduce((sum, digit) => sum + digit, 0);
    chain.push(current);
  }
  return { chain: chain.join('/'), final: current, sum: chain[0] };
}

function chainFromSum_(sum) {
  return reduceNumber_(String(sum));
}

function buildCalendarResult_(kind, date, time) {
  return {
    kind,
    date: date.raw,
    mainDestiny: reduceNumber_(date.year + date.month + date.day),
    sunMoonBloom: chainFromSum_(Number(date.month) + Number(date.day))
  };
}

function buildBaseNumbers_(date) {
  return {
    year: reduceNumber_(date.year).final,
    month: reduceNumber_(date.month).final,
    day: reduceNumber_(date.day).final
  };
}

function buildHorseNumbers_(base) {
  const first = Math.abs(base.month - base.day);
  const second = Math.abs(base.day - base.year);
  return [
    { key: 'horseOne', label: '木馬一', period: '40前', value: first },
    { key: 'horseTwo', label: '木馬二', period: '36-40', value: second },
    { key: 'horseThree', label: '木馬三', period: '終其一生', value: Math.abs(first - second) },
    { key: 'horseFour', label: '木馬四', period: '41後', value: Math.abs(base.month - base.year) }
  ];
}

function buildSupportNumber_(base) {
  const first = chainFromSum_(base.month + base.day).final;
  const second = chainFromSum_(base.day + base.year).final;
  return chainFromSum_(first + second).final;
}

function getBirthdayState_(solarDate, queryDate) {
  return {
    hasBirthdayPassed: `${queryDate.month}-${queryDate.day}` >= `${solarDate.month}-${solarDate.day}`,
    queryYear: Number(queryDate.year),
    birthYear: Number(solarDate.year)
  };
}

function buildAnnualState_(input, birthdayState) {
  const afterBirthday = buildAnnualVersion_(input.solarDate, birthdayState.queryYear, birthdayState.birthYear);
  if (birthdayState.hasBirthdayPassed) return { afterBirthday };
  return {
    beforeBirthday: buildAnnualVersion_(input.solarDate, birthdayState.queryYear - 1, birthdayState.birthYear),
    afterBirthday
  };
}

function buildAnnualVersion_(solarDate, analysisYear, birthYear) {
  return {
    analysisYear,
    yearFlow: reduceNumber_(String(analysisYear) + solarDate.month + solarDate.day),
    position: ((analysisYear - birthYear) % 9) + 1
  };
}

function buildImageChecklist_(templateId, result) {
  const annual = result.annual.afterBirthday;
  return {
    templateId,
    templateName: '靈魂萬花圖',
    displayName: result.displayName,
    positions: {
      centerLeft: { label: '中心左｜陰曆主命數', slot: '中心左', value: result.lunar.mainDestiny.final, chain: result.lunar.mainDestiny.chain },
      centerRight: { label: '中心右｜陽曆主命數', slot: '中心右', value: result.solar.mainDestiny.final, chain: result.solar.mainDestiny.chain },
      bloom: { label: '上方｜日月綻放', slot: '上方主圈', value: result.solar.sunMoonBloom.final, chain: result.solar.sunMoonBloom.chain },
      innerFrequency: { label: '上方副標｜內頻', slot: '上方副標', value: result.lunar.sunMoonBloom.final, chain: result.lunar.sunMoonBloom.chain },
      horseOne: { label: '左上｜木馬一', slot: '左上', value: result.horseNumbers[0].value },
      horseTwo: { label: '右上｜木馬二', slot: '右上', value: result.horseNumbers[1].value },
      horseThree: { label: '左下｜木馬三', slot: '左下', value: result.horseNumbers[2].value },
      horseFour: { label: '右下｜木馬四', slot: '右下', value: result.horseNumbers[3].value },
      lunarSupport: { label: '左側｜陰曆貴人', slot: '左側', value: result.supportNumbers.lunar },
      solarSupport: { label: '右側｜陽曆貴人', slot: '右側', value: result.supportNumbers.solar },
      yearFlow: { label: '下方｜流年', slot: '下方', value: annual.yearFlow.final, chain: annual.yearFlow.chain },
      annualPosition: { label: '最外圈｜今年位格', slot: '最外圈', value: annual.position }
    }
  };
}

function renderChecklistSvg_(checklist) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"><rect width="900" height="900" fill="#0B1020"/><text x="450" y="40" fill="#fff" text-anchor="middle" font-size="28">靈魂萬花圖</text>' +
    Object.keys(checklist.positions).map(function(key, index) {
      const item = checklist.positions[key];
      const x = 130 + (index % 4) * 210;
      const y = 150 + Math.floor(index / 4) * 220;
      const text = item.chain || item.value;
      return '<g><circle cx="' + x + '" cy="' + y + '" r="52" fill="#334155" stroke="#fff"/><text x="' + x + '" y="' + y + '" fill="#fff" text-anchor="middle" font-size="20">' + escapeHtml_(text) + '</text><text x="' + x + '" y="' + (y + 76) + '" fill="#fff" text-anchor="middle" font-size="12">' + escapeHtml_(item.label) + '</text></g>';
    }).join('') +
    '<text x="450" y="875" fill="#CBD5E1" text-anchor="middle" font-size="14">校對版｜只使用數字色，不使用彩油瓶色</text></svg>';
}

function buildReportDraft_(result, checklist) {
  return [
    '# ' + result.displayName + '｜靈魂萬花筒 v1 報告草稿',
    '',
    '## 核心數字',
    '- 陰曆主命數：' + result.lunar.mainDestiny.chain,
    '- 陽曆主命數：' + result.solar.mainDestiny.chain,
    '- 日月綻放：' + result.solar.sunMoonBloom.chain,
    '- 內頻：' + result.lunar.sunMoonBloom.chain,
    '- 木馬：' + result.horseNumbers.map(function(item) { return item.value; }).join(' / '),
    '- 陰曆貴人：' + result.supportNumbers.lunar,
    '- 陽曆貴人：' + result.supportNumbers.solar,
    '',
    '## 出圖核對',
    Object.keys(checklist.positions).map(function(key) {
      const item = checklist.positions[key];
      return '- ' + item.label + '：' + (item.chain || item.value) + '（' + item.slot + '）';
    }).join('\n'),
    '',
    '本報告使用支持、提醒、象徵與練習語氣。靈魂萬花圖是象徵性視覺化，不代表公式本身。'
  ].join('\n');
}

function parseBody_(e) {
  if (e && e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }
  if (e && e.parameter && Object.keys(e.parameter).length) {
    const body = Object.assign({}, e.parameter);
    if (body.payload && typeof body.payload === 'string') {
      body.payload = JSON.parse(body.payload);
    }
    return body;
  }
  return {};
}

function jsonResponse(data, status) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateFolder_(name) {
  const folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}

function createCaseId_(input) {
  return [input.displayName, input.solarDate.raw, input.lunarDate.raw, input.birthTime.raw].join('-').replace(/[^\w\u4e00-\u9fff]+/g, '-');
}

function createOilCaseId_(displayName) {
  return [displayName || '精油產品', Utilities.getUuid().slice(0, 8)].join('-').replace(/[^\w\u4e00-\u9fff]+/g, '-');
}

function escapeHtml_(value) {
  return String(value).replace(/[&<>"']/g, function(char) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
  });
}
