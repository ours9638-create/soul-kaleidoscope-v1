import { LUNAR_CALENDAR_1940_2035 } from './lunar-calendar-data.js';

const SOLAR_DATE_RANGE = {
  start: '1940-01-01',
  end: '2035-12-31'
};

export function solarToLunarDate(solarDate) {
  const value = LUNAR_CALENDAR_1940_2035[solarDate];
  if (!value) return null;
  const isLeapMonth = value.endsWith('L');
  const raw = isLeapMonth ? value.slice(0, -1) : value;
  return {
    raw,
    isLeapMonth,
    source: 'lunar-calendar-1940-2035'
  };
}

export function getSupportedSolarDateRange() {
  return { ...SOLAR_DATE_RANGE };
}
