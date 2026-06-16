import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const codePath = 'dist/apps-script/Code.gs';
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

console.log('# Apps Script Code.gs copied');
console.log(`- source: ${codePath}`);
console.log(`- chars: ${code.length}`);
console.log(`- sha256: ${sha256}`);
console.log('- next: paste into Apps Script 程式碼.gs, then save and deploy.');
