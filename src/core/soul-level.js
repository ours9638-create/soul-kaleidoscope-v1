const PHASES = new Set(['year', 'month', 'day', 'hour', 'minute']);
const TWO_GROUP_PATTERN = /^[●○]{2}\/[●○]$/;

export function resolveSoulLevel(phase, pattern, options = {}) {
  if (!PHASES.has(phase)) throw new Error(`不支援的靈魂等級階段：${phase}`);
  if (!TWO_GROUP_PATTERN.test(pattern)) {
    throw new Error(`靈魂等級標記格式錯誤：${pattern}`);
  }

  const [acquiredPattern, finalPattern] = pattern.split('/');
  const acquiredPassCount = [...acquiredPattern].filter((marker) => marker === '●').length;
  const finalPass = finalPattern === '●';

  if (!finalPass && acquiredPassCount === 0) return 1;
  if (!finalPass && acquiredPassCount === 1) return 2;
  if (!finalPass && acquiredPassCount === 2) return 3;
  if (finalPass && acquiredPassCount === 0) return 4;
  if (finalPass && acquiredPassCount === 1) return 5;
  return options.overConcentrated ? 6 : 7;
}

export function buildSoulLevel({ birthDate, chain, phase }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(birthDate || ''))) {
    throw new Error('生日必須使用 YYYY-MM-DD');
  }
  const groups = String(chain || '').split('/');
  const validChain = (groups.length === 2 || groups.length === 3) &&
    groups.slice(0, -1).every((group) => /^\d{2}$/.test(group)) &&
    /^\d$/.test(groups.at(-1));
  if (!validChain) throw new Error(`主數鏈格式錯誤：${chain}`);

  const birthDigits = birthDate.replace(/-/g, '').slice(0, 8);
  const judgedGroups = [groups[0], groups.at(-1)];
  const pattern = judgedGroups
    .map((group) => [...group].map((digit) => birthDigits.includes(digit) ? '●' : '○').join(''))
    .join('/');

  return {
    level: resolveSoulLevel(phase, pattern, { overConcentrated: hasOverConcentratedDigit(birthDigits) }),
    pattern,
    needsLevelSevenReview: false
  };
}

function hasOverConcentratedDigit(birthDigits) {
  return '123456789'.split('').some((digit) => {
    const matches = birthDigits.match(new RegExp(digit, 'g'));
    return (matches?.length ?? 0) >= 3;
  });
}
