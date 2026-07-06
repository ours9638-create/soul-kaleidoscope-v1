const APPROVED_ANNUAL_POSITION_CONTENT = Object.freeze({
  '7x2': {
    status: 'approved',
    sectionTitle: '年度流年 × 位格',
    sourceContentId: 'annual-position-scoped-7x2',
    paragraph: '今年的年度流年 × 位格提醒你，把觀察與沉澱放進關係協調中。這不是要你急著做結論，而是先看清楚互動裡的訊號，再決定下一步。'
  },
  '1x9': {
    status: 'approved',
    sectionTitle: '年度流年 × 位格',
    sourceContentId: 'annual-position-scoped-1x9',
    paragraph: '今年站在新舊循環的交界，啟動力需要先經過完成與整理。當你把舊階段收束清楚，新的方向才比較不會帶著未完成的拉扯前進。'
  }
});

export function resolveAnnualPositionReportContentFromCase(caseResult) {
  const annualNumber = caseResult?.activeAnnual?.yearFlow?.final;
  const positionNumber = caseResult?.activeAnnual?.position;
  return resolveAnnualPositionReportContent(annualNumber, positionNumber);
}

export function resolveAnnualPositionReportContent(annualNumber, positionNumber) {
  const key = `${annualNumber}x${positionNumber}`;
  return APPROVED_ANNUAL_POSITION_CONTENT[key] || {
    status: 'pending',
    sectionTitle: '年度流年 × 位格',
    sourceContentId: '',
    paragraph: ''
  };
}
