/* MediaWiki style definition lists:
**
**   ; term
**   : definition
**
** A marker (; or :) only starts an item at the beginning of a line, other
** lines continue the previous item. Attributes on the first item, or on an
** empty item ";(class#id)." go on the list itself.
*/

const re = require('../re');
const { parseAttr, addLineNumber } = require('./attr');
const { txattr } = require('./re_ext');
re.pattern.txattr = txattr;

const reDeflistWiki = re.compile(/^[;:](?:[:txattr:])?(?:\. ?| )[^\0]*?(?:\r?\n(?:\s*\n|$)+|$)/);
const reItemStart = re.compile(/^([;:])([:txattr:])?(\. ?| )/);
const reItemOnly = re.compile(/^([;:])([:txattr:])?\.?\s*$/);

const itemType = { ';': 'dt', ':': 'dd' };

function splitItems (src) {
  const items = [];
  let pos = 0;
  src.split('\n').forEach(line => {
    if (reItemStart.test(line) || reItemOnly.test(line) || !items.length) {
      items.push({ text: line, pos: pos });
    }
    else {
      items[items.length - 1].text += '\n' + line;
    }
    pos += line.length + 1;
  });
  return items;
}

function parseItem (item) {
  const type = itemType[item.text[0]];
  let text = item.text.slice(1);
  let offset = item.pos + 1;
  let attr = null;
  const pba = parseAttr(text, type);
  if (pba) {
    const step = typeof pba[0] === 'string' ? pba[0].length : pba[0];
    attr = pba[1];
    text = text.slice(step);
    offset += step;
  }
  const sep = /^\.? ?/.exec(text)[0];
  text = text.slice(sep.length);
  offset += sep.length;
  offset += text.length - text.trimStart().length;
  return { type, attr, offset, pos: item.pos, content: text.trim() };
}

function testDefListWiki (src) {
  const m = reDeflistWiki.exec(src);
  // a list needs at least one item with content
  return m && splitItems(m[0]).some(item => parseItem(item).content) ? m : null;
}

function parseDefListWiki (src, options, charPosToLine, charOffset) {
  // late loading to get around circular dependencies
  const parsePhrase = require('./phrase').parsePhrase;

  let listAttr = null;
  const deflist = [ 'dl', null, '\n' ];

  splitItems(src.replace(/\s+$/, '')).forEach((item, index) => {
    const parsed = parseItem(item);
    const { type, offset, content } = parsed;
    let attr = parsed.attr;
    if (!content) {
      // an empty item only carries attributes for the list
      if (!listAttr && attr) { listAttr = attr; }
      return;
    }
    if (!index && !listAttr && attr) {
      // attributes on the first item belong to the list
      listAttr = attr;
      attr = null;
    }
    const elm = [ type, addLineNumber(attr, options, charPosToLine, charOffset, item.pos) ];
    deflist.push('\t', elm.concat(parsePhrase(content, options, charPosToLine, (charOffset || 0) + offset)), '\n');
  });

  if (listAttr) {
    deflist[1] = listAttr;
  }
  else {
    deflist.splice(1, 1);
  }
  return deflist;
}

exports.testDefListWiki = testDefListWiki;
exports.parseDefListWiki = parseDefListWiki;
