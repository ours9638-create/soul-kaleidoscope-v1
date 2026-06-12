const NODE_POSITIONS = {
  centerLeft: [340, 450],
  centerRight: [560, 450],
  bloom: [450, 210],
  innerFrequency: [450, 300],
  horseOne: [235, 260],
  horseTwo: [665, 260],
  horseThree: [235, 640],
  horseFour: [665, 640],
  lunarSupport: [130, 450],
  solarSupport: [770, 450],
  yearFlow: [450, 760],
  annualPosition: [450, 80]
};

export function renderChecklistSvg(checklist) {
  const nodes = Object.entries(checklist.positions)
    .map(([key, item]) => renderNode(key, item))
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900" role="img" aria-label="${escapeXml(checklist.templateName)}">
  <rect width="900" height="900" fill="#0B1020"/>
  <circle cx="450" cy="450" r="360" fill="none" stroke="#D9B56C" stroke-width="2" opacity="0.55"/>
  <circle cx="450" cy="450" r="250" fill="none" stroke="#A78BFA" stroke-width="1.5" opacity="0.5"/>
  <circle cx="450" cy="450" r="145" fill="none" stroke="#F9A8D4" stroke-width="1.5" opacity="0.55"/>
  <line x1="130" y1="450" x2="770" y2="450" stroke="#475569" stroke-width="1" opacity="0.55"/>
  <line x1="450" y1="80" x2="450" y2="760" stroke="#475569" stroke-width="1" opacity="0.55"/>
  <text x="450" y="38" fill="#F8FAFC" font-size="28" text-anchor="middle" font-family="Arial, sans-serif">靈魂萬花圖</text>
  <text x="450" y="875" fill="#CBD5E1" font-size="14" text-anchor="middle" font-family="Arial, sans-serif">校對版｜只使用數字色，不使用彩油瓶色</text>
${nodes}
</svg>`;
}

function renderNode(key, item) {
  const [x, y] = NODE_POSITIONS[key] ?? [450, 450];
  const display = item.chain ? `${item.chain}` : String(item.value);
  return `  <g>
    <circle cx="${x}" cy="${y}" r="54" fill="${nodeFill(key)}" stroke="#FFFFFF" stroke-width="1.5" opacity="0.92"/>
    <text x="${x}" y="${y - 4}" fill="#FFFFFF" font-size="21" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700">${escapeXml(display)}</text>
    <text x="${x}" y="${y + 22}" fill="#E2E8F0" font-size="11" text-anchor="middle" font-family="Arial, sans-serif">${escapeXml(item.slot)}</text>
    <text x="${x}" y="${y + 72}" fill="#F8FAFC" font-size="12" text-anchor="middle" font-family="Arial, sans-serif">${escapeXml(item.label)}</text>
  </g>`;
}

function nodeFill(key) {
  if (key.startsWith('horse')) return '#B45309';
  if (key.includes('Support')) return '#2563EB';
  if (key === 'centerLeft') return '#7C3AED';
  if (key === 'centerRight') return '#DB2777';
  if (key === 'bloom' || key === 'innerFrequency') return '#BE185D';
  return '#334155';
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
