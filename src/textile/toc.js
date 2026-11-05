/* Heading anchors and table of contents (Redmine style)
**
**   headingIds: every heading gets an id derived from its text
**   toc:        a paragraph holding only {{toc}} (or {{>toc}} for a right
**               aligned one) is replaced by a list of links to the headings
*/

const reHeading = /^h([1-6])$/;
const reTocMacro = /^\s*\{\{([<>]?)toc\}\}\s*$/;

function hasAttr (node) {
  return node[1] === null || (typeof node[1] === 'object' && !Array.isArray(node[1]));
}

function children (node) {
  return node.slice(hasAttr(node) ? 2 : 1);
}

function textOf (node) {
  if (typeof node === 'string') { return node; }
  if (!Array.isArray(node) || node[0] === '!') { return ''; }
  return children(node).map(textOf).join('');
}

// Redmine's sanitize_anchor_name: keep word characters, spaces and dashes,
// then turn each run of whitespace (and the dashes after it) into one dash
function anchorName (text) {
  return text
    .replace(/&#?\w+;/g, '')
    .trim()
    .replace(/[^\s\-\p{L}\p{N}\p{M}_]/gu, '')
    .replace(/\s+(-+\s*)?/g, '-');
}

function collectHeadings (nodes, list) {
  nodes.forEach(node => {
    if (!Array.isArray(node)) { return; }
    const m = reHeading.exec(node[0]);
    if (m) {
      list.push({ node, level: +m[1] });
    }
    else {
      collectHeadings(children(node), list);
    }
  });
  return list;
}

function addHeadingIds (headings) {
  const seen = {};
  headings.forEach(h => {
    let attr = hasAttr(h.node) ? h.node[1] : null;
    if (attr && attr.id) {
      h.id = attr.id;
      return;
    }
    const base = anchorName(textOf(h.node)) || 'section';
    seen[base] = (seen[base] || 0) + 1;
    h.id = seen[base] > 1 ? `${base}-${seen[base]}` : base;
    if (!attr) {
      attr = {};
      if (h.node[1] === null) { h.node[1] = attr; }
      else { h.node.splice(1, 0, attr); }
    }
    attr.id = h.id;
  });
}

// nest headings by level into <ul>/<li>, indented like regular lists
function nest (headings) {
  const root = [];
  const stack = [ { level: 0, items: root } ];
  headings.forEach(h => {
    while (stack.length > 1 && h.level <= stack[stack.length - 1].level) {
      stack.pop();
    }
    const entry = { heading: h, items: [] };
    stack[stack.length - 1].items.push(entry);
    stack.push({ level: h.level, items: entry.items });
  });
  return root;
}

function renderList (entries, attr, depth) {
  const tabs = '\t'.repeat(depth);
  const list = attr ? [ 'ul', attr, '\n' ] : [ 'ul', '\n' ];
  entries.forEach(entry => {
    const li = [ 'li', [ 'a', { href: '#' + entry.heading.id }, textOf(entry.heading.node).trim() ] ];
    if (entry.items.length) {
      li.push('\n' + tabs + '\t', renderList(entry.items, null, depth + 1));
    }
    list.push(tabs + '\t', li, '\n');
  });
  list.push(tabs);
  return list;
}

function buildToc (headings, align) {
  const attr = { class: align === '>' ? 'toc right' : align === '<' ? 'toc left' : 'toc' };
  return renderList(nest(headings), attr, 0);
}

function isTocParagraph (node) {
  if (!Array.isArray(node) || node[0] !== 'p') { return null; }
  const kids = children(node);
  return kids.length === 1 && typeof kids[0] === 'string' ? reTocMacro.exec(kids[0]) : null;
}

function applyToc (tree, options) {
  if (!options.headingIds && !options.toc) {
    return tree;
  }
  const headings = collectHeadings(tree, []);
  addHeadingIds(headings);
  if (options.toc) {
    for (let i = 0; i < tree.length; i++) {
      const m = isTocParagraph(tree[i]);
      if (m) {
        const toc = buildToc(headings, m[1]);
        const pAttr = hasAttr(tree[i]) ? tree[i][1] : null;
        if (pAttr && pAttr['data-line'] != null) {
          toc[1]['data-line'] = pAttr['data-line'];
        }
        tree[i] = toc;
      }
    }
  }
  return tree;
}

module.exports = { applyToc, anchorName };
