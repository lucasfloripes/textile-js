/*
** Textile formatting toolbar for a <textarea>, modeled on Redmine's.
**
**   const toolbar = TextileToolbar.attach(textarea, {
**     quoteLines: () => true,   // use "> " quotes (Redmine) instead of "bq. "
**     onHelp: () => { ... }     // help button; omitted = no help button
**   });
**
** Buttons wrap the selection (or a placeholder) in Textile markup and
** toggle it off when it is already applied. Edits go through the
** browser's editing commands, so undo/redo keeps working, and fire an
** "input" event on the textarea.
*/
(function (global) {
  const LANGUAGES = [
    'c',
    'cpp',
    'csharp',
    'css',
    'diff',
    'go',
    'groovy',
    'html',
    'java',
    'javascript',
    'json',
    'kotlin',
    'objective_c',
    'perl',
    'php',
    'python',
    'r',
    'ruby',
    'sass',
    'scala',
    'shell',
    'sql',
    'swift',
    'typescript',
    'xml',
    'yaml'
  ];

  const svg = paths => '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';

  const ICONS = {
    ul: svg('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>'),
    ol: svg('<path d="M10 6h10M10 12h10M10 18h10"/><path d="M4 4h1v4M4 8h2M4 14.5c0-.8.7-1.5 1.5-1.5S7 13.7 7 14.5c0 1-3 2-3 3.5h3"/>'),
    bq: svg('<path d="M3 6h18M10 12h11M10 18h11M3 10l4 3-4 3"/>'),
    unbq: svg('<path d="M3 6h18M10 12h11M10 18h11M7 10l-4 3 4 3"/>'),
    table: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16M15 4v16"/>'),
    precode: svg('<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12"/>'),
    link: svg('<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>'),
    img: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>'),
    help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4.9.7c0 1.6-2.4 2.1-2.4 3.6M12 17h.01"/>')
  };

  // ---- textarea editing helpers ----

  function replaceRange (ta, start, end, text, selStart, selEnd) {
    ta.focus();
    ta.setSelectionRange(start, end);
    // execCommand keeps the native undo stack; fall back when unsupported
    let done;
    try {
      done = document.execCommand('insertText', false, text);
    }
    catch {
      done = false;
    }
    if (!done || ta.value.slice(start, start + text.length) !== text) {
      ta.setRangeText(text, start, end, 'end');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
    ta.setSelectionRange(start + selStart, start + selEnd);
  }

  // wrap the selection in inline markup, e.g. *strong*
  function toggleInline (ta, openMark, closeMark, placeholder) {
    const value = ta.value;
    let start = ta.selectionStart;
    let end = ta.selectionEnd;
    let sel = value.slice(start, end);

    // keep surrounding whitespace outside of the markup
    const lead = /^\s*/.exec(sel)[0];
    const trail = /\s*$/.exec(sel.slice(lead.length))[0];
    start += lead.length;
    end -= trail.length;
    sel = value.slice(start, end);

    // already wrapped (markup inside or just outside the selection): unwrap
    if (sel.length >= openMark.length + closeMark.length && sel.startsWith(openMark) && sel.endsWith(closeMark)) {
      const unwrapped = sel.slice(openMark.length, sel.length - closeMark.length);
      return replaceRange(ta, start, end, unwrapped, 0, unwrapped.length);
    }
    if (value.slice(start - openMark.length, start) === openMark && value.slice(end, end + closeMark.length) === closeMark) {
      return replaceRange(ta, start - openMark.length, end + closeMark.length, sel, 0, sel.length);
    }

    const inner = sel || placeholder;
    // Textile needs a boundary before phrase markup: "E=mc^2^" -> "E=mc[^2^]"
    const before = value.charAt(start - 1);
    const after = value.charAt(end);
    const needFence = (before && /[\w]/.test(before)) || (after && /[\w]/.test(after));
    const o = needFence ? '[' + openMark : openMark;
    const c = needFence ? closeMark + ']' : closeMark;
    replaceRange(ta, start, end, o + inner + c, o.length, o.length + inner.length);
  }

  // expand the selection to whole lines and transform them
  function transformLines (ta, fn) {
    const value = ta.value;
    const start = value.lastIndexOf('\n', ta.selectionStart - 1) + 1;
    let end = value.indexOf('\n', ta.selectionEnd - (ta.selectionEnd > ta.selectionStart && value.charAt(ta.selectionEnd - 1) === '\n' ? 1 : 0));
    if (end < 0) { end = value.length; }
    const lines = value.slice(start, end).split('\n');
    const out = fn(lines).join('\n');
    replaceRange(ta, start, end, out, 0, out.length);
  }

  function toggleLinePrefix (ta, prefix, pattern) {
    transformLines(ta, lines => {
      const content = lines.filter(l => l.trim());
      const all = content.length && content.every(l => pattern.test(l));
      return lines.map(l => {
        if (!l.trim()) { return l; }
        return all ? l.replace(pattern, '') : prefix + l.replace(pattern, '');
      });
    });
  }

  function toggleHeading (ta, level) {
    transformLines(ta, lines => {
      const re = /^h[1-6](\([^)]*\)|\{[^}]*\}|\[[^\]]*\]|[<>=()]+)*\.\s+/;
      const first = lines[0] || '';
      const m = /^h([1-6])/.exec(first);
      const off = m && re.test(first) && +m[1] === level;
      lines[0] = off ? first.replace(re, '') : `h${level}. ` + (first.replace(re, '') || 'Heading');
      return lines;
    });
  }

  // insert a block on its own, separated from the text around it by blank lines
  function insertBlock (ta, before, body, after) {
    const value = ta.value;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const ahead = value.slice(0, start);
    const behind = value.slice(end);
    const padBefore = !ahead || /\n\n$/.test(ahead) ? '' : /\n$/.test(ahead) ? '\n' : '\n\n';
    const padAfter = !behind || /^\n\n/.test(behind) ? '' : /^\n/.test(behind) ? '\n' : '\n\n';
    const text = padBefore + before + body + after + padAfter;
    const selStart = padBefore.length + before.length;
    replaceRange(ta, start, end, text, selStart, selStart + body.length);
  }

  function selection (ta) {
    return ta.value.slice(ta.selectionStart, ta.selectionEnd);
  }

  // ---- actions ----

  const QUOTE_RE = /^(?:> ?|bq\. )/;

  const ACTIONS = {
    strong: ta => toggleInline(ta, '*', '*', 'strong text'),
    em: ta => toggleInline(ta, '_', '_', 'emphasized text'),
    ins: ta => toggleInline(ta, '+', '+', 'underlined text'),
    del: ta => toggleInline(ta, '-', '-', 'deleted text'),
    code: ta => toggleInline(ta, '@', '@', 'code'),
    h1: ta => toggleHeading(ta, 1),
    h2: ta => toggleHeading(ta, 2),
    h3: ta => toggleHeading(ta, 3),
    ul: ta => toggleLinePrefix(ta, '* ', /^\* /),
    ol: ta => toggleLinePrefix(ta, '# ', /^# /),
    bq: (ta, opts) => {
      if (opts.quoteLines()) {
        transformLines(ta, lines => lines.map(l => '> ' + l));
      }
      else {
        transformLines(ta, lines => {
          if (!QUOTE_RE.test(lines[0])) { lines[0] = 'bq. ' + lines[0]; }
          return lines;
        });
      }
    },
    unbq: ta => transformLines(ta, lines => lines.map(l => l.replace(QUOTE_RE, ''))),
    table: ta => insertBlock(ta, '|_. Header 1 |_. Header 2 |\n| ', selection(ta) || 'Cell 1', ' | Cell 2 |'),
    pre: ta => insertBlock(ta, '<pre>\n', selection(ta) || 'preformatted text', '\n</pre>'),
    precode: (ta, opts, lang) => {
      const cls = lang ? ` class="${lang}"` : '';
      insertBlock(ta, `<pre><code${cls}>\n`, selection(ta) || 'code', '\n</code></pre>');
    },
    link: ta => {
      const sel = selection(ta);
      if (/^(https?|ftps?|mailto):|^www\./i.test(sel)) {
        const withUrl = '"link text":' + sel;
        return replaceRange(ta, ta.selectionStart, ta.selectionEnd, withUrl, 1, 10);
      }
      const label = sel || 'link text';
      const text = `"${label}":https://`;
      replaceRange(ta, ta.selectionStart, ta.selectionEnd, text, text.length - 8, text.length);
    },
    img: ta => {
      const url = selection(ta) || 'https://example.com/image.png';
      replaceRange(ta, ta.selectionStart, ta.selectionEnd, '!' + url + '!', 1, 1 + url.length);
    }
  };

  // [action, label (text) or icon, title, shortcut key]
  const LAYOUT = [
    [ [ 'strong', '<b>B</b>', 'Strong', 'b' ],
      [ 'em', '<i>I</i>', 'Italic', 'i' ],
      [ 'ins', '<u>U</u>', 'Underline', 'u' ],
      [ 'del', '<s>S</s>', 'Deleted' ],
      [ 'code', 'C', 'Inline code', 'e' ] ],
    [ [ 'h1', 'H<sub>1</sub>', 'Heading 1' ], [ 'h2', 'H<sub>2</sub>', 'Heading 2' ], [ 'h3', 'H<sub>3</sub>', 'Heading 3' ] ],
    [ [ 'ul', ICONS.ul, 'Unordered list' ], [ 'ol', ICONS.ol, 'Ordered list' ] ],
    [ [ 'bq', ICONS.bq, 'Quote' ],
      [ 'unbq', ICONS.unbq, 'Unquote' ],
      [ 'table', ICONS.table, 'Table' ],
      [ 'pre', '<span class="tt-pre">pre</span>', 'Preformatted text' ],
      [ 'precode', ICONS.precode, 'Highlighted code' ] ],
    [ [ 'link', ICONS.link, 'Link', 'k' ], [ 'img', ICONS.img, 'Image' ] ],
    [ [ 'help', ICONS.help, 'Text formatting help' ] ]
  ];

  function attach (textarea, options) {
    const opts = Object.assign({ quoteLines: () => false, onHelp: null }, options);
    const bar = document.createElement('div');
    bar.className = 'textile-toolbar';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'Text formatting');
    if (textarea.id) { bar.setAttribute('aria-controls', textarea.id); }

    const isMac = /Mac|iP(hone|ad)/.test(navigator.platform || navigator.userAgent);
    const shortcuts = {};
    let menu = null;

    function closeMenu () {
      if (menu) {
        menu.remove();
        menu = null;
        document.removeEventListener('mousedown', onOutside);
      }
    }
    function onOutside (e) {
      if (menu && !menu.contains(e.target)) { closeMenu(); }
    }

    function openLanguageMenu (button) {
      closeMenu();
      menu = document.createElement('div');
      menu.className = 'textile-toolbar-menu';
      menu.setAttribute('role', 'menu');
      [ '' ].concat(LANGUAGES).forEach(lang => {
        const item = document.createElement('button');
        item.type = 'button';
        item.setAttribute('role', 'menuitem');
        item.textContent = lang || 'no language';
        item.addEventListener('click', () => {
          closeMenu();
          ACTIONS.precode(textarea, opts, lang);
        });
        menu.appendChild(item);
      });
      bar.appendChild(menu);
      menu.style.left = button.offsetLeft + 'px';
      menu.style.top = (button.offsetTop + button.offsetHeight + 4) + 'px';
      menu.querySelector('button').focus();
      menu.addEventListener('keydown', e => {
        const items = Array.from(menu.querySelectorAll('button'));
        const i = items.indexOf(document.activeElement);
        if (e.key === 'Escape') { closeMenu(); button.focus(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      });
      setTimeout(() => document.addEventListener('mousedown', onOutside));
    }

    LAYOUT.forEach(group => {
      const g = document.createElement('span');
      g.className = 'textile-toolbar-group';
      group.forEach(([ action, label, title, key ]) => {
        if (action === 'help' && !opts.onHelp) { return; }
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'textile-toolbar-btn tt-' + action;
        b.innerHTML = label;
        const hint = key ? ` (${isMac ? '⌘' : 'Ctrl+'}${key.toUpperCase()})` : '';
        b.title = title + hint;
        b.setAttribute('aria-label', title);
        // keep the textarea selection when clicking
        b.addEventListener('mousedown', e => e.preventDefault());
        b.addEventListener('click', () => {
          if (action === 'help') { return opts.onHelp(); }
          if (action === 'precode') { return openLanguageMenu(b); }
          ACTIONS[action](textarea, opts);
        });
        if (key) { shortcuts[key] = action; }
        g.appendChild(b);
      });
      if (g.children.length) { bar.appendChild(g); }
    });

    textarea.addEventListener('keydown', e => {
      if (!(isMac ? e.metaKey : e.ctrlKey) || e.altKey || e.shiftKey) { return; }
      const action = shortcuts[e.key.toLowerCase()];
      if (action) {
        e.preventDefault();
        ACTIONS[action](textarea, opts);
      }
    });

    textarea.parentNode.insertBefore(bar, textarea);
    return { element: bar, run: (action, arg) => ACTIONS[action](textarea, opts, arg) };
  }

  global.TextileToolbar = { attach, actions: Object.keys(ACTIONS) };
})(typeof window !== 'undefined' ? window : this);
