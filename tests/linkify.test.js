const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Test the actual frontend helpers without starting the app or any network I/O.
const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const start = source.indexOf('function escapeHtml(str) {');
const end = source.indexOf('\nsearchInputEl.addEventListener', start);
assert.ok(start >= 0 && end > start, 'frontend helper boundaries must exist');
const context = { URL };
vm.createContext(context);
vm.runInContext(source.slice(start, end), context);
const linkify = context.linkifyText;
const anchor = (href, label = href) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;

test('HTTP and HTTPS links stay clickable', () => {
  assert.equal(linkify('http://example.com https://example.com/a'),
    `${anchor('http://example.com')} ${anchor('https://example.com/a')}`);
});
test('www and uppercase HTTP schemes are supported', () => {
  assert.equal(linkify('www.example.com HTTPS://example.com'),
    `${anchor('https://www.example.com', 'www.example.com')} ${anchor('HTTPS://example.com')}`);
});
test('Arabic, English, emoji and line breaks are preserved', () => {
  assert.equal(linkify('أهلاً 🌺 hello\nhttps://example.com/مرحبا'),
    `أهلاً 🌺 hello\n${anchor('https://example.com/مرحبا')}`);
});
test('multiple links preserve surrounding text and query strings', () => {
  assert.equal(linkify('أول https://example.com/?a=1&b=2 ثم www.example.org وآخر'),
    `أول ${anchor('https://example.com/?a=1&amp;b=2')} ثم ${anchor('https://www.example.org', 'www.example.org')} وآخر`);
});
test('double quotes cannot escape href and inject an event attribute', () => {
  assert.equal(linkify('https://example.com/"onmouseover="alert(1)'),
    anchor('https://example.com/&quot;onmouseover=&quot;alert(1)', 'https://example.com/"onmouseover="alert(1)'));
});
test('single quotes in URL are escaped in the attribute context', () => {
  assert.equal(linkify("https://example.com/'onclick='alert(1)"),
    anchor('https://example.com/&#39;onclick=&#39;alert(1)', "https://example.com/'onclick='alert(1)"));
});
test('HTML and script injection are rendered as literal text', () => {
  assert.equal(linkify('<img src=x onerror=alert(1)><script>alert(2)</script>'),
    '&lt;img src=x onerror=alert(1)&gt;&lt;script&gt;alert(2)&lt;/script&gt;');
  assert.equal(linkify('https://example.com/"><svg/onload=alert(1)>'),
    anchor('https://example.com/&quot;&gt;&lt;svg/onload=alert(1)&gt;', 'https://example.com/"&gt;&lt;svg/onload=alert(1)&gt;'));
});
test('javascript, data and other non-HTTP protocols are not linked', () => {
  for (const value of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:msgbox(1)', 'file:///tmp/a']) {
    assert.equal(linkify(value), context.escapeHtml(value));
  }
});
test('invalid HTTP URLs remain plain text', () => {
  for (const value of ['https://', 'http://[invalid', 'https://:bad']) {
    assert.equal(linkify(value), value);
  }
});
test('HTML entity input is not decoded into attributes or double interpreted', () => {
  assert.equal(linkify('https://example.com/&quot;onclick=&quot;alert(1)'),
    anchor('https://example.com/&amp;quot;onclick=&amp;quot;alert(1)'));
});
test('ordinary quotes, ampersands and empty messages remain readable', () => {
  assert.equal(linkify('قال "أهلاً" & مرحبًا'), 'قال "أهلاً" &amp; مرحبًا');
  assert.equal(linkify(''), '');
});
test('both message rendering paths use the shared safe helper', () => {
  assert.equal((source.match(/textEl\.innerHTML = linkifyText\(content\);/g) || []).length, 2);
});
