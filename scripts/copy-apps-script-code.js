import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const fileOptions = [
  { flag: '--data', path: 'dist/apps-script/InterpretationData.gs', label: 'InterpretationData.gs', target: 'Apps Script InterpretationData.gs' },
  { flag: '--lunar-data', path: 'dist/apps-script/LunarCalendarData.gs', label: 'LunarCalendarData.gs', target: 'Apps Script LunarCalendarData.gs' },
  { flag: '--admin', path: 'dist/apps-script/Admin.html', label: 'Admin.html', target: 'Apps Script Admin.html' },
  { flag: '--manifest', path: 'dist/apps-script/appsscript.json', label: 'appsscript.json', target: 'Apps Script 專案設定 manifest' }
];
const selected = fileOptions.find((option) => process.argv.includes(option.flag)) || {
  path: 'dist/apps-script/Code.gs',
  label: 'Code.gs',
  target: 'Apps Script 程式碼.gs'
};
const codePath = selected.path;
const code = readFileSync(codePath, 'utf8');
const sha256 = createHash('sha256').update(code).digest('hex');

function copyToClipboard(text) {
  if (process.platform === 'win32') {
    const result = spawnSync(
      'powershell',
      ['-NoProfile', '-Command', 'Set-Clipboard -Value $input'],
      { input: text, encoding: 'utf8' }
    );
    if (result.status !== 0) {
      throw new Error(result.stderr || 'Set-Clipboard failed');
    }
    return;
  }

  if (process.platform === 'darwin') {
    const result = spawnSync('pbcopy', [], { input: text, encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr || 'pbcopy failed');
    return;
  }

  const result = spawnSync('xclip', ['-selection', 'clipboard'], { input: text, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || 'xclip failed');
}

copyToClipboard(code);

console.log(`# Apps Script ${selected.label} copied`);
console.log(`- source: ${codePath}`);
console.log(`- chars: ${code.length}`);
console.log(`- sha256: ${sha256}`);
console.log(`- next: paste into ${selected.target}, then save and deploy.`);
