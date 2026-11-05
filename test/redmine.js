const test = require('tape');
const textile = require('../src');
// syntax documented in Redmine's Textile formatting guide
const redmine = textile.presets.redmine;

test('redmine extensions are off by default', function (t) {
  t.is(textile.convert('see http://x.org'), '<p>see http://x.org</p>');
  t.is(textile.convert('> quote'), '<p>&gt; quote</p>');
  t.is(textile.convert('h1. A\n\n{{toc}}'), '<h1>A</h1>\n<p>{{toc}}</p>');
  t.end();
});


test('autolink: urls', function (t) {
  const o = { autolink: true };
  t.is(textile.convert('auto http://www.redmine.org end', o),
    '<p>auto <a href="http://www.redmine.org">http://www.redmine.org</a> end</p>');
  t.is(textile.convert('See https://x.org/a?b=1&c=2.', o),
    '<p>See <a href="https://x.org/a?b=1&amp;c=2">https://x.org/a?b=1&amp;c=2</a>.</p>', 'trailing dot is not part of the url');
  t.is(textile.convert('(see http://en.wikipedia.org/wiki/Foo_(bar))', o),
    '<p>(see <a href="http://en.wikipedia.org/wiki/Foo_(bar)">http://en.wikipedia.org/wiki/Foo_(bar)</a>)</p>', 'balanced parens');
  t.is(textile.convert('ftp://x.org/f, sftp://h/f and ftps://y', o),
    '<p><a href="ftp://x.org/f">ftp://x.org/f</a>, <a href="sftp://h/f">sftp://h/f</a> and <a href="ftps://y">ftps://y</a></p>');
  t.is(textile.convert('www.redmine.org!', o),
    '<p><a href="http://www.redmine.org">www.redmine.org</a>!</p>');
  t.end();
});


test('autolink: email addresses', function (t) {
  const o = { autolink: true };
  t.is(textile.convert('mail someone@foo.bar.', o),
    '<p>mail <a href="mailto:someone@foo.bar">someone@foo.bar</a>.</p>');
  t.is(textile.convert('a.b@c', o), '<p>a.b@c</p>', 'needs a domain');
  t.end();
});


test('autolink: never inside links, code or pre', function (t) {
  const o = { autolink: true };
  t.is(textile.convert('"see http://x.org":http://y.org', o),
    '<p><a href="http://y.org">see http://x.org</a></p>');
  t.is(textile.convert('<a href="http://x.org">http://x.org</a>', o),
    '<p><a href="http://x.org">http://x.org</a></p>');
  t.is(textile.convert('@http://x.org@', o), '<p><code>http://x.org</code></p>');
  t.is(textile.convert('bc. http://x.org', o), '<pre><code>http://x.org</code></pre>');
  t.is(textile.convert('!http://x.org/i.png!', o), '<p><img src="http://x.org/i.png" alt="" /></p>');
  t.is(textile.convert('nohttp://x', o), '<p>nohttp://x</p>');
  t.end();
});


test('quoteLines', function (t) {
  const o = { quoteLines: true };
  t.is(textile.convert('>> Rails is a full-stack framework.\n>> To go live.\n> Great!', o),
    '<blockquote>\n<blockquote>\n<p>Rails is a full-stack framework.<br />\nTo go live.</p>\n</blockquote>\n<p>Great!</p>\n</blockquote>');
  t.is(textile.convert('intro\n\n> quoted *bold*\n> more\n\nafter', o),
    '<p>intro</p>\n<blockquote>\n<p>quoted <strong>bold</strong><br />\nmore</p>\n</blockquote>\n<p>after</p>');
  t.is(textile.convert('> * a\n> * b', o),
    '<blockquote>\n<ul>\n\t<li>a</li>\n\t<li>b</li>\n</ul>\n</blockquote>');
  t.is(textile.convert('a > b', o), '<p>a &gt; b</p>');
  t.is(textile.convert('> quoted line\n>> nested quote', o),
    '<blockquote>\n<p>quoted line</p>\n<blockquote>\n<p>nested quote</p>\n</blockquote>\n</blockquote>', 'deeper level right after a shallower line');
  t.end();
});


test('quoteLines with line numbers', function (t) {
  t.is(textile.convert('intro\n\n>> deep\n> mid\n\nafter', { quoteLines: true, showOriginalLineNumber: true }),
    '<p data-line="0">intro</p>\n<blockquote data-line="2">\n<blockquote data-line="2">\n<p data-line="2">deep</p>\n</blockquote>\n<p data-line="3">mid</p>\n</blockquote>\n<p data-line="5">after</p>');
  t.is(textile.convert('> a\n>> b\n> c', { quoteLines: true, showOriginalLineNumber: true }),
    '<blockquote data-line="0">\n<p data-line="0">a</p>\n<blockquote data-line="1">\n<p data-line="1">b</p>\n</blockquote>\n<p data-line="2">c</p>\n</blockquote>');
  t.end();
});


test('headingIds', function (t) {
  const o = { headingIds: true };
  t.is(textile.convert('h1. Olá, Mundo — teste\n\nh2. It\'s "quoted"', o),
    '<h1 id="Olá-Mundo-teste">Olá, Mundo — teste</h1>\n<h2 id="Its-quoted">It&#8217;s &#8220;quoted&#8221;</h2>');
  t.is(textile.convert('h2. same\n\nh2. same\n\nh2. same', o),
    '<h2 id="same">same</h2>\n<h2 id="same-2">same</h2>\n<h2 id="same-3">same</h2>', 'duplicates are numbered');
  t.is(textile.convert('h1(#custom). Custom', o), '<h1 id="custom">Custom</h1>', 'explicit id wins');
  t.end();
});


test('toc', function (t) {
  t.is(textile.convert('{{toc}}\n\nh1. A\n\nh2. B\n\nh3. C\n\nh2. D\n\nh1. E', { toc: true }),
    '<ul class="toc">\n\t<li><a href="#A">A</a>\n\t<ul>\n\t\t<li><a href="#B">B</a>\n\t\t<ul>\n\t\t\t<li><a href="#C">C</a></li>\n\t\t</ul></li>\n\t\t<li><a href="#D">D</a></li>\n\t</ul></li>\n\t<li><a href="#E">E</a></li>\n</ul>\n' +
    '<h1 id="A">A</h1>\n<h2 id="B">B</h2>\n<h3 id="C">C</h3>\n<h2 id="D">D</h2>\n<h1 id="E">E</h1>');
  t.is(textile.convert('h1. *Bold* title\n\n{{>toc}}', { toc: true }),
    '<h1 id="Bold-title"><strong>Bold</strong> title</h1>\n<ul class="toc right">\n\t<li><a href="#Bold-title">Bold title</a></li>\n</ul>');
  t.is(textile.convert('{{toc}}\n\nh3. deep\n\nh1. top', { toc: true }),
    '<ul class="toc">\n\t<li><a href="#deep">deep</a></li>\n\t<li><a href="#top">top</a></li>\n</ul>\n<h3 id="deep">deep</h3>\n<h1 id="top">top</h1>');
  t.is(textile.convert('h1. a\n\n{{toc}}', { toc: true, showOriginalLineNumber: true }),
    '<h1 data-line="0" id="a">a</h1>\n<ul class="toc" data-line="2">\n\t<li><a href="#a">a</a></li>\n</ul>');
  t.end();
});


test('toc in tokenize output', function (t) {
  const tree = textile.tokenize('h1. a\n\n{{toc}}', { toc: true });
  t.is(tree[0][1].id, 'a');
  t.is(tree[2][0], 'ul');
  t.end();
});


test('redmine preset', function (t) {
  t.ok(Object.isFrozen(redmine), 'preset cannot be modified by accident');
  t.is(textile.convert('h1. Title\n\n{{toc}}\n\n> see www.redmine.org', redmine),
    '<h1 id="Title">Title</h1>\n<ul class="toc">\n\t<li><a href="#Title">Title</a></li>\n</ul>\n<blockquote>\n<p>see <a href="http://www.redmine.org">www.redmine.org</a></p>\n</blockquote>');
  t.end();
});
