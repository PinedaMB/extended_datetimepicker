import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const readme = readFileSync(new URL('readme.md', root), 'utf8').replace(/\r\n/g, '\n');
const path = new URL('docs/index.html', root);
const page = readFileSync(path, 'utf8');
const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = text => escape(text).replace(/`([^`]+)`/g, '<code>$1</code>');
const cells = line => line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
let updated = page;
for (const [id, heading] of [['OPTIONS', '## ⚙️ Configurable Options Table'], ['CALLBACKS', '## 🔄 Callbacks / Events']]) {
    const section = readme.split(heading + '\n')[1]?.split('\n## ')[0];
    const rows = section?.match(/^\|.*\|$/gm);
    if (!rows || rows.length < 3) throw new Error(`Missing README table: ${id}`);
    const header = cells(rows[0]).map(cell => `<th scope="col">${inline(cell)}</th>`).join('');
    const body = rows.slice(2).map(row => `<tr>${cells(row).map(cell => `<td>${inline(cell)}</td>`).join('')}</tr>`).join('\n');
    const table = `<table class="table table-striped table-bordered align-middle fs-7"><thead class="table-primary"><tr>${header}</tr></thead><tbody>\n${body}\n</tbody></table>`;
    const start = `<!-- README-TABLE:${id}:START -->`, end = `<!-- README-TABLE:${id}:END -->`;
    const a = updated.indexOf(start), b = updated.indexOf(end);
    if (a < 0 || b <= a) throw new Error(`Missing playground table markers: ${id}`);
    updated = updated.slice(0, a + start.length) + '\n' + table + '\n' + updated.slice(b);
}
if (process.argv.includes('--check')) {
    if (updated !== page) throw new Error('Playground tables are out of date; run npm run docs:sync');
} else writeFileSync(path, updated);
console.log('README and playground tables are synchronized.');
