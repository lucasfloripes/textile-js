/*
** Textile parser for JavaScript
**
** Copyright (c) 2012 Borgar Þorsteinsson (MIT License).
**
*/

const merge = require('./merge');
const jsonmlUtils = require('./jsonml');
const { parseFlow } = require('./textile/flow');
const { parseHtml } = require('./html');
const { applyToc } = require('./textile/toc');

// options
const defaults = {
  // single-line linebreaks are converted to <br> by default
  breaks: true,
  // turn bare URLs (http, https, ftp, ftps, sftp, sftps, www.) and email addresses into links
  autolink: false,
  // lines starting with ">" become (nested) blockquotes
  quoteLines: false,
  // give headings an id derived from their text
  headingIds: false,
  // replace a {{toc}} or {{>toc}} paragraph with a table of contents (implies headingIds)
  toc: false,
  // emit <abbr> instead of the obsolete <acronym> for "ABC(title)"
  useAbbr: false,
  // prefix for footnote ids: a string, true (random) or false (none)
  idPrefix: false,
  // links using these URI schemes get an empty href
  blockedUriSchemes: [ 'javascript', 'vbscript', 'data' ],
  // by default, don't map the elements of HTML output, with the line numbers of input text
  showOriginalLineNumber: false,
  // line number offset of the first char of input text, for showOriginalLineNumber option
  lineOffset: 0,
  // by default, don't set a special CSS class name to each HTML element mapped to an original line number
  cssClassOriginalLineNumber: '',
  // functions to apply to each JsonML node before rendering to HTML
  hooks: [],
  // function called where a JsonML node is rendered to HTML
  renderers: {}
};

// get a throw-away copy of the options, with defaults applied
function getOptions (opt) {
  opt = merge(merge({}, textile.defaults), opt || {});
  if (opt.idPrefix === true) {
    opt.idPrefix = Math.floor(Math.random() * 1e9).toString(36);
  }
  return opt;
}

function textile (txt, opt) {
  opt = getOptions(opt);
  // run the converter
  return applyToc(parseFlow(txt, opt, opt.lineOffset), opt).map(value => jsonmlUtils.toHTML(value, opt.renderers)).join('');
}
module.exports = textile;

textile.defaults = defaults;

// option sets for common dialects: textile.convert(src, textile.presets.redmine)
textile.presets = {
  redmine: Object.freeze({
    autolink: true,
    quoteLines: true,
    headingIds: true,
    toc: true
  })
};

textile.setOptions = textile.setoptions = function (opt) {
  merge(textile.defaults, opt);
  return this;
};

textile.parse = textile.convert = textile;
textile.html_parser = parseHtml;

textile.tokenize = function (txt, opt) {
  opt = getOptions(opt);
  // parse and return tree
  return applyToc(parseFlow(txt, opt, opt.lineOffset), opt);
};
textile.jsonml = function (txt, opt) {
  // parse and return tree
  return [ 'html' ].concat(textile.tokenize(txt, opt));
};
textile.serialize = function (jsonml, opt) {
  // get a throw-away copy of options
  opt = merge(merge({}, textile.defaults), opt || {});
  // serialize
  return jsonmlUtils.toHTML(jsonml, opt.renderers);
};

textile.jsonmlUtils = jsonmlUtils;
