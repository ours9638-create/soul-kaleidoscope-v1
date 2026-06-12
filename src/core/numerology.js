const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{2}):(\d{2})$/;

export function calculateCase(input) {
  const normalized = normalizeInput(input);
  const solar = buildCalendarResult('solar', normalized.solarDate, normalized.birthTime);
  const lunar = buildCalendarResult('lunar', normalized.lunarDate, normalized.birthTime);
  const solarBase = buildBaseNumbers(normalized.solarDate);
  const lunarBase = buildBaseNumbers(normalized.lunarDate);
  const horseNumbers = buildHorseNumbers(solarBase);
  const supportNumbers = {
    solar: buildSupportNumber(solarBase),
    lunar: buildSupportNumber(lunarBase)
  };
  const birthdayState = getBirthdayState(normalized.solarDate, normalized.queryDate);
  const annual = buildAnnualState(normalized, birthdayState);

  return {
    id: normalized.id ?? createCaseId(normalized),
    displayName: normalized.displayName,
    input: normalized,
    versionMode: birthdayState.hasBirthdayPassed ? 'after_birthday_only' : 'before_and_after_birthday',
    solar,
    lunar,
    horseNumbers,
    supportNumbers,
    annual,
    sourcePolicy: {
      formulaSource: 'Google Sheets: 靈魂數字_可驗算公式表',
      contentSource: 'Google Sheets: 靈魂數字整合系統_分類資料庫_光頻幾何圖輸出更新',
      imageRuleSource: '靈魂萬花圖_出圖規格書_v1'
    }
  };
}

export function reduceNumber(value) {
  const digits = String(value).replace(/\D/g, '').split('').map(Number);
  if (digits.length === 0) return { chain: '', final: 0, sum: 0 };
  const chain = [];
  let current = digits.reduce((sum, digit) => sum + digit, 0);
  chain.push(current);
  while (current >= 10) {
    current = String(current).split('').map(Number).reduce((sum, digit) => sum + digit, 0);
    chain.push(current);
  }
  return {
    chain: chain.join('/'),
    final: current,
    sum: chain[0]
  };
}

export function chainFromSum(sum) {
  const parts = [sum];
  let current = sum;
  while (current >= 10) {
    current = String(current).split('').map(Number).reduce((acc, digit) => acc + digit, 0);
    parts.push(current);
  }
  return {
    chain: parts.join('/'),
    final: current,
    sum
  };
}

function normalizeInput(input) {
  if (!input || typeof input !== 'object') throw new Error('case input is required');
  const solarDate = parseDate(input.solarDate, 'solarDate');
  const lunarDate = parseDate(input.lunarDate, 'lunarDate');
  const birthTime = parseTime(input.birthTime ?? '00:00');
  const queryDate = parseDate(input.queryDate ?? new Date().toISOString().slice(0, 10), 'queryDate');

  return {
    id: input.id,
    displayName: input.displayName || '未命名個案',
    solarDate,
    lunarDate,
    birthTime,
    queryDate
  };
}

function parseDate(value, field) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) {
    throw new Error(`${field} must use YYYY-MM-DD`);
  }
  const [, year, month, day] = value.match(DATE_RE);
  return { raw: value, year, month, day };
}

function parseTime(value) {
  if (typeof value !== 'string' || !TIME_RE.test(value)) {
    throw new Error('birthTime must use HH:mm');
  }
  const [, hour, minute] = value.match(TIME_RE);
  return { raw: value, hour, minute };
}

function buildCalendarResult(kind, date, time) {
  const mainDestiny = reduceNumber(`${date.year}${date.month}${date.day}`);
  const sunMoonSum = Number(date.month) + Number(date.day);
  const sunMoonBloom = chainFromSum(sunMoonSum);
  const stage = buildStageNumbers(date, time);

  return {
    kind,
    date: date.raw,
    mainDestiny,
    sunMoonBloom,
    stage
  };
}

function buildStageNumbers(date, time) {
  const sources = [
    ['year', date.year],
    ['month', date.month],
    ['day', date.day],
    ['hour', time.hour],
    ['minute', time.minute]
  ];
  let previous = 0;
  return sources.map(([phase, source]) => {
    const digits = source.split('').map(Number);
    const value = previous + digits.reduce((sum, digit) => sum + digit, 0);
    previous = value;
    return {
      phase,
      source,
      chain: chainFromSum(value).chain,
      final: chainFromSum(value).final
    };
  });
}

function buildBaseNumbers(date) {
  return {
    year: reduceNumber(date.year).final,
    month: reduceNumber(date.month).final,
    day: reduceNumber(date.day).final
  };
}

function buildHorseNumbers(base) {
  const first = Math.abs(base.month - base.day);
  const second = Math.abs(base.day - base.year);
  const third = Math.abs(first - second);
  const fourth = Math.abs(base.month - base.year);
  return [
    { key: 'horseOne', label: '木馬一', period: '40前', value: first },
    { key: 'horseTwo', label: '木馬二', period: '36-40', value: second },
    { key: 'horseThree', label: '木馬三', period: '終其一生', value: third },
    { key: 'horseFour', label: '木馬四', period: '41後', value: fourth }
  ];
}

function buildSupportNumber(base) {
  const first = chainFromSum(base.month + base.day).final;
  const second = chainFromSum(base.day + base.year).final;
  return chainFromSum(first + second).final;
}

function getBirthdayState(solarDate, queryDate) {
  const birthMonthDay = `${solarDate.month}-${solarDate.day}`;
  const queryMonthDay = `${queryDate.month}-${queryDate.day}`;
  return {
    hasBirthdayPassed: queryMonthDay >= birthMonthDay,
    queryYear: Number(queryDate.year),
    birthYear: Number(solarDate.year)
  };
}

function buildAnnualState(input, birthdayState) {
  const afterYear = birthdayState.queryYear;
  const beforeYear = birthdayState.queryYear - 1;
  const afterBirthday = buildAnnualVersion(input.solarDate, afterYear, birthdayState.birthYear);
  const beforeBirthday = buildAnnualVersion(input.solarDate, beforeYear, birthdayState.birthYear);

  return birthdayState.hasBirthdayPassed
    ? { afterBirthday }
    : { beforeBirthday, afterBirthday };
}

function buildAnnualVersion(solarDate, analysisYear, birthYear) {
  const yearFlow = reduceNumber(`${analysisYear}${solarDate.month}${solarDate.day}`);
  const ageCount = analysisYear - birthYear + 1;
  const position = ((ageCount - 1) % 9) + 1;
  return {
    analysisYear,
    yearFlow,
    position,
    label: `${analysisYear}生日後版`
  };
}

function createCaseId(input) {
  return [
    input.displayName,
    input.solarDate.raw,
    input.lunarDate.raw,
    input.birthTime.raw
  ].join('|').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase();
}
