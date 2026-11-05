const test = require('tape');
const textile = require('../src');

const tx = 'ABC(Always Be Closing)';

test('acronyms use <acronym> by default', function (t) {
  t.is(textile.convert(tx),
    '<p><acronym title="Always Be Closing"><span class="caps">ABC</span></acronym></p>');
  t.end();
});


test('useAbbr renders <abbr>', function (t) {
  t.is(textile.convert(tx, { useAbbr: true }),
    '<p><abbr title="Always Be Closing"><span class="caps">ABC</span></abbr></p>');
  t.is(textile.convert('NASA', { useAbbr: true }),
    '<p><span class="caps">NASA</span></p>', 'plain caps are unchanged');
  t.end();
});
