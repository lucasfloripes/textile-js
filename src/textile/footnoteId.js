// HTML ids for footnotes and their references: "fn1" / "fnr1", or
// "fn-PREFIX-1" / "fnr-PREFIX-1" when the idPrefix option is set, so that
// several documents rendered into one page don't produce duplicate ids.
module.exports = function footnoteId (kind, num, options) {
  const prefix = options && options.idPrefix;
  return prefix ? `${kind}-${prefix}-${num}` : kind + num;
};
