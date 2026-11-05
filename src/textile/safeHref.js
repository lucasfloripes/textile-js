// Neutralize link targets that use a blocked URI scheme (javascript:, ...).
// Browsers decode character references and ignore tabs, newlines and
// leading control characters in URLs, so the scheme is checked on a
// normalized copy: "java&#9;script&#58;" is still "javascript:".

const namedRefs = { colon: ':', tab: '\t', newline: '\n' };

function decodeRefs (str) {
  return str.replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));?/gi, (all, dec, hex, name) => {
    if (dec || hex) {
      const code = parseInt(dec || hex, dec ? 10 : 16);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
    }
    const ch = namedRefs[name.toLowerCase()];
    return ch == null ? all : ch;
  });
}

function getScheme (url) {
  // eslint-disable-next-line no-control-regex
  const normalized = decodeRefs(url).replace(/[\u0000- \u007f]+/g, '');
  const m = /^([a-z][a-z\d+.-]*):/i.exec(normalized);
  return m ? m[1].toLowerCase() : null;
}

function safeHref (url, options) {
  const blocked = options && options.blockedUriSchemes;
  if (url && Array.isArray(blocked) && blocked.length) {
    const scheme = getScheme(String(url));
    if (scheme && blocked.some(s => String(s).toLowerCase() === scheme)) {
      return '';
    }
  }
  return url;
}

module.exports = { safeHref };
