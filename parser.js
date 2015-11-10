var parser = new DOMParser;

function parse (str) {
  var doc = parser.parseFromString(str, 'application/xml');
  if (!doc.children.length) throw new Error('no child nodes');
  return doc.children[0];
};

module.exports = parse;
