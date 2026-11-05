const test = require('tape');
const textile = require('../src');
// ported from borgar/textile-js next-version

test('minimal case 1', function (t) {
  const tx = '; a';
  t.is(
    textile.convert(tx),
    '<dl>\n\t<dt>a</dt>\n</dl>',
    tx
  );
  t.end();
});


test('minimal case 2', function (t) {
  const tx = ': b';
  t.is(
    textile.convert(tx),
    '<dl>\n\t<dd>b</dd>\n</dl>',
    tx
  );
  t.end();
});


test('minimal case 3', function (t) {
  const tx = '; a\n: b';
  t.is(
    textile.convert(tx),
    '<dl>\n\t<dt>a</dt>\n\t<dd>b</dd>\n</dl>',
    tx
  );
  t.end();
});

test('minimal case 3', function (t) {
  const tx = `;(foo). a
g
d
:(bar) b
c`;
  t.is(
    textile.convert(tx),
    `<dl class="foo">
\t<dt>a<br />
g<br />
d</dt>
\t<dd class="bar">b<br />
c</dd>
</dl>`,
    tx
  );
  t.end();
});


test('classes 1', function (t) {
  const tx = `;(first) Item 1
;(second) Item 2`;
  t.is(
    textile.convert(tx),
    `<dl class="first">
\t<dt>Item 1</dt>
\t<dt class="second">Item 2</dt>
</dl>`,
    tx
  );
  t.end();
});


test('classes 2', function (t) {
  const tx = `; Item 1
;(second) Item 2`;
  t.is(
    textile.convert(tx),
    `<dl>
\t<dt>Item 1</dt>
\t<dt class="second">Item 2</dt>
</dl>`,
    tx
  );
  t.end();
});


test('classes 3', function (t) {
  const tx = `;(class#id).
;(first) Item 1
; Item 2`;
  t.is(
    textile.convert(tx),
    `<dl class="class" id="id">
\t<dt class="first">Item 1</dt>
\t<dt>Item 2</dt>
</dl>`,
    tx
  );
  t.end();
});


test('classes 4', function (t) {
  const tx = `;(class#id).
;(first) Item 1
;(foo#bar).
;(second) Item 2
;(third) Item 3`;
  t.is(
    textile.convert(tx),
    `<dl class="class" id="id">
\t<dt class="first">Item 1</dt>
\t<dt class="second">Item 2</dt>
\t<dt class="third">Item 3</dt>
</dl>`,
    tx
  );
  t.end();
});


test('a colon inside an item does not start a new item', function (t) {
  t.is(textile.convert(': Time: 10am\n: *bold* "l":http://x'),
    '<dl>\n\t<dd>Time: 10am</dd>\n\t<dd><strong>bold</strong> <a href="http://x">l</a></dd>\n</dl>');
  t.end();
});


test('list between paragraphs', function (t) {
  t.is(textile.convert('intro\n\n; t\n: d\n\nafter'),
    '<p>intro</p>\n<dl>\n\t<dt>t</dt>\n\t<dd>d</dd>\n</dl>\n<p>after</p>');
  t.is(textile.convert('; t\n: d\n\n\n\nh2. x'),
    '<dl>\n\t<dt>t</dt>\n\t<dd>d</dd>\n</dl>\n<h2>x</h2>');
  t.end();
});


test('not a list', function (t) {
  t.is(textile.convert(';no space'), '<p>;no space</p>');
  t.is(textile.convert(': '), '<p>: </p>');
  t.end();
});


test('line numbers', function (t) {
  t.is(textile.convert('intro\n\n; term\n: def *b*\ncont\n: two\n\nend', { showOriginalLineNumber: true }),
    '<p data-line="0">intro</p>\n<dl>\n\t<dt data-line="2">term</dt>\n\t<dd data-line="3">def <strong>b</strong><br />\ncont</dd>\n\t<dd data-line="5">two</dd>\n</dl>\n<p data-line="7">end</p>');
  t.end();
});
