const test = require('tape');
const textile = require('../src');

test('dimension sign needs digits on both sides', function (t) {
  t.is(textile.convert('2x4'), '<p>2&#215;4</p>');
  t.is(textile.convert('3 x 5'), '<p>3 &#215; 5</p>');
  t.is(textile.convert('.5x.5'), '<p>.5&#215;.5</p>');
  t.is(textile.convert('visit www.x.org now'), '<p>visit www.x.org now</p>');
  t.is(textile.convert('a.x.b'), '<p>a.x.b</p>');
  t.end();
});
