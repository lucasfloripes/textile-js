const test = require('tape');
const textile = require('../src');
// empty named blocks must not swallow the next block (borgar/textile-js#9)

test('empty named block at end of input', function (t) {
  t.is(textile.convert('h1.'), '<h1></h1>');
  t.is(textile.convert('h1.\n'), '<h1></h1>');
  t.end();
});


test('empty named block followed by a paragraph', function (t) {
  t.is(textile.convert('h1.\n\nfoo'), '<h1></h1>\n<p>foo</p>');
  t.is(textile.convert('h1.\r\n\r\nfoo'), '<h1></h1>\n<p>foo</p>');
  t.is(textile.convert('h1. \n\nfoo'), '<h1></h1>\n<p>foo</p>');
  t.is(textile.convert('h1(cls).\n\nfoo'), '<h1 class="cls"></h1>\n<p>foo</p>');
  t.end();
});


test('empty block code and quote', function (t) {
  t.is(textile.convert('bc.\n\ncode'), '<pre><code></code></pre>\n<p>code</p>');
  t.is(textile.convert('bq.\n\nfoo'), '<blockquote>\n<p></p>\n</blockquote>\n<p>foo</p>');
  t.end();
});


test('empty named block followed by other blocks', function (t) {
  t.is(textile.convert('p.\n\nfoo\n\nh2. bar'), '<p></p>\n<p>foo</p>\n<h2>bar</h2>');
  t.is(textile.convert('h1.\n\n\n\n* a'), '<h1></h1>\n<ul>\n\t<li>a</li>\n</ul>');
  t.end();
});


test('named block with content on the next line is unchanged', function (t) {
  t.is(textile.convert('h1.\nfoo'), '<h1>foo</h1>');
  t.end();
});


test('empty extended block keeps its content', function (t) {
  t.is(textile.convert('bc..\n\na\n\nb'), '<pre><code>\na\n\nb</code></pre>');
  t.end();
});


test('empty named block keeps line numbers', function (t) {
  t.is(textile.convert('intro\n\nh1.\n\nfoo', { showOriginalLineNumber: true }),
    '<p data-line="0">intro</p>\n<h1 data-line="2"></h1>\n<p data-line="4">foo</p>');
  t.end();
});
