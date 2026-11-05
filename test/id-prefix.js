const test = require('tape');
const textile = require('../src');

const tx = 'text[1].\n\nfn1. note';

test('footnote ids are unprefixed by default', function (t) {
  t.is(textile.convert(tx),
    '<p>text<sup class="footnote" id="fnr1"><a href="#fn1">1</a></sup>.</p>\n' +
    '<p class="footnote" id="fn1"><a href="#fnr1"><sup>1</sup></a> note</p>');
  t.end();
});


test('idPrefix string', function (t) {
  t.is(textile.convert(tx, { idPrefix: '12345' }),
    '<p>text<sup class="footnote" id="fnr-12345-1"><a href="#fn-12345-1">1</a></sup>.</p>\n' +
    '<p class="footnote" id="fn-12345-1"><a href="#fnr-12345-1"><sup>1</sup></a> note</p>');
  t.end();
});


test('idPrefix true uses one random prefix per document', function (t) {
  const html = textile.convert(tx, { idPrefix: true });
  const ids = html.match(/(?:id="|href="#)fnr?-([a-z0-9]+)-1/g).map(s => s.replace(/.*fnr?-|-1$/g, ''));
  t.is(ids.length, 4, 'all four ids/refs are prefixed');
  t.ok(ids.every(id => id === ids[0]), 'with the same prefix');
  const other = textile.convert(tx, { idPrefix: true }).match(/id="fnr-([a-z0-9]+)-1"/)[1];
  t.not(other, ids[0], 'another document gets another prefix');
  t.end();
});


test('idPrefix applies to footnote references without a link', function (t) {
  t.is(textile.convert('text[1!].', { idPrefix: 'p' }),
    '<p>text<sup class="footnote" id="fnr-p-1">1</sup>.</p>');
  t.end();
});
