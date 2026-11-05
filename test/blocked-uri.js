const test = require('tape');
const textile = require('../src');

test('unsafe link schemes are blocked by default', function (t) {
  t.is(textile.convert('"x":javascript:alert(1)'), '<p><a href="">x</a></p>');
  t.is(textile.convert('"x":JaVaScRiPt:alert(1)'), '<p><a href="">x</a></p>');
  t.is(textile.convert('"x":vbscript:msgbox'), '<p><a href="">x</a></p>');
  t.is(textile.convert('"x":data:text/html,abc'), '<p><a href="">x</a></p>');
  t.end();
});


test('obfuscated schemes are blocked', function (t) {
  t.is(textile.convert('"x":javascript&#58;alert(1)'), '<p><a href="">x</a></p>');
  t.is(textile.convert('"x":javascript&colon;alert(1)'), '<p><a href="">x</a></p>');
  t.is(textile.convert('"x":&#106;avascript:alert(1)'), '<p><a href="">x</a></p>');
  t.is(textile.convert('"x":&#x6A;avascript:alert(1)'), '<p><a href="">x</a></p>');
  t.is(textile.convert('"x":java&#9;script:alert(1)'), '<p><a href="">x</a></p>');
  t.end();
});


test('image links are blocked too', function (t) {
  t.is(textile.convert('!i.png!:javascript:alert(1)'), '<p><a href=""><img src="i.png" alt="" /></a>)</p>');
  t.end();
});


test('self-referencing link keeps the url as text', function (t) {
  t.is(textile.convert('"$":javascript:alert(1)'), '<p><a href="">javascript:alert(1)</a></p>');
  t.is(textile.convert('"$":https://ex.com'), '<p><a href="https://ex.com">ex.com</a></p>');
  t.end();
});


test('safe links are left alone', function (t) {
  t.is(textile.convert('"x":https://ex.com'), '<p><a href="https://ex.com">x</a></p>');
  t.is(textile.convert('"x":mailto:a@b.c'), '<p><a href="mailto:a@b.c">x</a></p>');
  t.is(textile.convert('"x":/rel/path'), '<p><a href="/rel/path">x</a></p>');
  t.is(textile.convert('"x":#anchor'), '<p><a href="#anchor">x</a></p>');
  t.is(textile.convert('"x":http://ok.com/?q=javascript:x'), '<p><a href="http://ok.com/?q=javascript:x">x</a></p>');
  t.is(textile.convert('!data:image/png;base64,AAA!'), '<p><img src="data:image/png;base64,AAA" alt="" /></p>');
  t.end();
});


test('blockedUriSchemes option', function (t) {
  t.is(textile.convert('"x":data:text/html,abc', { blockedUriSchemes: [] }),
    '<p><a href="data:text/html,abc">x</a></p>', 'empty list allows everything');
  t.is(textile.convert('"x":ftp://a', { blockedUriSchemes: [ 'FTP' ] }),
    '<p><a href="">x</a></p>', 'custom list, case insensitive');
  t.end();
});
