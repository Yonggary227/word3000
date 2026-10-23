// dist 폴더 내용을 GitHub의 gh-pages 브랜치로 올린다 (GitHub Pages가 이 브랜치를 웹사이트로 보여준다).
// 먼저 `npm run build:web`으로 dist를 만든 뒤 실행한다.
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
if (!existsSync(join(dist, 'sw.js'))) {
  console.error('dist/sw.js가 없어요. 먼저 npm run build:web 을 실행하세요.');
  process.exit(1);
}

const git = (args, cwd = root) => execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim();
const remote = git(['remote', 'get-url', 'origin']);
const source = git(['rev-parse', '--short', 'HEAD']);

rmSync(join(dist, '.git'), { recursive: true, force: true });
git(['init', '-q', '-b', 'gh-pages'], dist);
git(['add', '-A'], dist);
git(['commit', '-q', '-m', `웹앱 배포 (소스 ${source})`], dist);
git(['push', '-q', '-f', remote, 'gh-pages'], dist);
rmSync(join(dist, '.git'), { recursive: true, force: true });

console.log(`gh-pages 브랜치에 올렸어요 (소스 ${source}).`);
