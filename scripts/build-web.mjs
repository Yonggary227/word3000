// `expo export -p web` 다음에 실행한다.
// dist 안의 모든 파일을 오프라인 저장 목록으로 만든 sw.js를 쓰고, GitHub Pages용 파일을 더한다.
import { createHash } from 'node:crypto';
import { copyFileSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

// 주소에 없는 페이지(/word3000/study 등)를 새로고침해도 앱이 열리도록
copyFileSync(join(dist, 'index.html'), join(dist, '404.html'));
// GitHub Pages가 밑줄(_expo) 폴더를 숨기지 않도록
writeFileSync(join(dist, '.nojekyll'), '');

const skip = new Set(['sw.js', '404.html', '.nojekyll']);
const files = walk(dist)
  .map((f) => relative(dist, f).split(sep).join('/'))
  .filter((f) => !skip.has(f))
  .sort();

const hash = createHash('sha256');
for (const f of files) hash.update(f).update(readFileSync(join(dist, f)));
const version = hash.digest('hex').slice(0, 12);

const template = readFileSync(join(root, 'scripts', 'sw-template.js'), 'utf8');
writeFileSync(
  join(dist, 'sw.js'),
  template.replace('__VERSION__', version).replace('__FILES__', JSON.stringify(files)),
);

console.log(`sw.js: ${files.length}개 파일, 버전 ${version}`);
