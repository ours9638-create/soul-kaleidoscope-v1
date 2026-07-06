const DAY_MS = 24 * 60 * 60 * 1000;

function normalizePath(value) {
  return String(value || '').replaceAll('\\', '/').replace(/^\.\//, '').toLowerCase();
}

export function classifyLocalCandidate(candidate, policy, now = new Date()) {
  const normalized = normalizePath(candidate.path);
  const ageMs = now.getTime() - new Date(candidate.modifiedAt).getTime();
  const isManagedDownloadTemp = candidate.rootType === 'managed-download-temp';
  if (!isManagedDownloadTemp && policy.protectedPathFragments.some((part) => normalized.includes(String(part).toLowerCase()))) {
    return { action: 'protected-path', reason: '符合受保護路徑' };
  }
  if (!Number.isFinite(ageMs) || ageMs < policy.recentProtectionHours * 60 * 60 * 1000) {
    return { action: 'protected-recent', reason: '近期仍有更新' };
  }
  if (!candidate.inAutoCleanRoot) {
    return { action: 'report-only', reason: '不在自動清理白名單' };
  }
  if (isManagedDownloadTemp && ageMs >= Number(policy.managedDownloadRetentionHours || 24) * 60 * 60 * 1000) {
    return { action: 'auto-clean', reason: '受控下載暫存已超過保存期限' };
  }
  if (ageMs >= policy.tempRetentionDays * DAY_MS) {
    return { action: 'auto-clean', reason: '白名單暫存已超過保存期限' };
  }
  return { action: 'keep', reason: '仍在保存期限內' };
}

export function classifyCloudCandidate(candidate, policy, now = new Date()) {
  const normalized = normalizePath(candidate.path);
  if (policy.protectedMimeTypes.includes(candidate.mimeType)) {
    return { action: 'report-only', reason: '正式文件類型不自動處理' };
  }
  const isGenerated = policy.autoTrashPathPrefixes.some((prefix) => normalized.startsWith(normalizePath(prefix)));
  if (!isGenerated) {
    return { action: 'report-only', reason: '不在雲端自動處理白名單' };
  }
  const ageMs = now.getTime() - new Date(candidate.updatedAt).getTime();
  if (Number.isFinite(ageMs) && ageMs >= policy.generatedRetentionDays * DAY_MS) {
    return { action: 'auto-trash', reason: '可重建檔案已超過保存期限' };
  }
  return { action: 'keep', reason: '仍在保存期限內' };
}
